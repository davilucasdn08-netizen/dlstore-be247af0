import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
];

function isCaptchaOrBlocked(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("captcha") ||
    lower.includes("robot") ||
    lower.includes("automated access") ||
    lower.includes("api-services-support@amazon") ||
    (html.length < 5000 && !lower.includes("productTitle") && !lower.includes("og:title"))
  );
}

/** Normalize a raw price string to Brazilian format: "1.299,99" */
function normalizeBRPrice(raw: string): string {
  let p = raw.trim().replace(/[R$\s\u00a0]/g, "");
  if (!p) return "";

  // Already in format 1.299,99 with period as thousand sep
  if (p.includes(".") && p.includes(",")) return p;

  // Already 299,99 format
  if (/,\d{2}$/.test(p) && !p.includes(".")) return p;

  // US format with dot decimal: 299.99
  if (/\.\d{2}$/.test(p) && !p.includes(",")) {
    const parts = p.split(".");
    if (parts[0].length <= 3) return p.replace(".", ",");
    // e.g. 1299.99 → 1.299,99
    const num = parseFloat(p);
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Plain integer
  if (/^\d+$/.test(p)) {
    return parseInt(p).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return p;
}

function extractPrice(html: string): string {
  // Most accurate: combine a-price-whole + a-price-fraction
  const wholeMatch = html.match(/class="a-price-whole"[^>]*>([^<]+)</);
  const fractionMatch = html.match(/class="a-price-fraction"[^>]*>([^<]+)</);
  if (wholeMatch?.[1]) {
    const whole = wholeMatch[1].trim().replace(/[^\d]/g, "");
    const fraction = fractionMatch?.[1]?.trim().replace(/[^\d]/g, "") || "00";
    const paddedFraction = fraction.length === 1 ? fraction + "0" : fraction.slice(0, 2);
    if (whole) {
      // Format thousands
      const num = parseInt(whole);
      const formattedWhole = num.toLocaleString("pt-BR");
      return `${formattedWhole},${paddedFraction}`;
    }
  }

  // a-offscreen: "R$ 1.299,00"
  const offscreen = html.match(/class="a-offscreen"[^>]*>([^<]+)</);
  if (offscreen?.[1]) {
    const p = normalizeBRPrice(offscreen[1]);
    if (p) return p;
  }

  // JSON-LD price
  const jsonLdPrice = html.match(/"price"\s*:\s*"?(\d+[\d.,]*\d*)"?/);
  if (jsonLdPrice?.[1]) return normalizeBRPrice(jsonLdPrice[1]);

  // Generic R$ with cents
  const brFull = html.match(/R\$\s*([\d.]+,\d{2})/);
  if (brFull?.[1]) return normalizeBRPrice(brFull[1]);

  return "";
}

async function fetchProductPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const ua = USER_AGENTS[attempt % USER_AGENTS.length];
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      });

      if (!res.ok) {
        await res.text();
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }

      const html = await res.text();

      if (isCaptchaOrBlocked(html)) {
        console.log(`Attempt ${attempt + 1}: blocked/captcha for URL`);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        return null;
      }

      return html;
    } catch (e) {
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  return null;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all products
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, name, affiliate_link, price");

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum produto encontrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Iniciando sync de preços: ${products.length} produtos.`);

    const results = { updated: 0, failed: 0, blocked: 0, skipped: 0 };

    for (const product of products) {
      if (!product.affiliate_link) {
        results.skipped++;
        continue;
      }

      const html = await fetchProductPage(product.affiliate_link);

      if (!html) {
        console.log(`❌ Bloqueado/falhou: ${product.name?.substring(0, 30)}`);
        results.blocked++;
        await sleep(2000);
        continue;
      }

      const price = extractPrice(html);

      if (price) {
        const { error } = await supabase
          .from("products")
          .update({ price: price })
          .eq("id", product.id);

        if (error) {
          console.error(`Erro ao atualizar ${product.id}:`, error.message);
          results.failed++;
        } else {
          console.log(`✅ Atualizado: ${product.name?.substring(0, 25)} → R$ ${price}`);
          results.updated++;
        }
      } else {
        console.log(`⏳ Preço não encontrado: ${product.name?.substring(0, 25)}`);
        results.skipped++;
      }

      // Delay between requests to avoid rate limiting
      const delay = Math.floor(Math.random() * 2500) + 1500;
      await sleep(delay);
    }

    const summary = `Sync concluído: ${results.updated} atualizados, ${results.failed} erros, ${results.blocked} bloqueados, ${results.skipped} ignorados.`;
    console.log(summary);

    return new Response(JSON.stringify({ message: summary, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Erro geral:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
