import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BodySchema = z.object({
  url: z.string().url().max(2000),
});

function extractPrice(html: string): string {
  // Amazon price patterns
  const patterns = [
    /class="a-price-whole"[^>]*>([^<]+)</,
    /id="priceblock_ourprice"[^>]*>([^<]+)</,
    /id="priceblock_dealprice"[^>]*>([^<]+)</,
    /class="a-offscreen"[^>]*>([^<]+)</,
    /data-a-color="price"[^>]*>.*?<span[^>]*>([^<]+)</s,
    /class="a-price"[^>]*>.*?<span[^>]*>([^<]+)</s,
    /"price":\s*"?(\d+[\.,]\d{2})"?/,
    /R\$\s*([\d.,]+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let price = match[1].trim().replace(/[^\d.,]/g, '');
      if (price) return price;
    }
  }
  return "";
}

function extractTitle(html: string): string {
  const patterns = [
    /id="productTitle"[^>]*>\s*([^<]+)/,
    /id="title"[^>]*>\s*([^<]+)/,
    /<title[^>]*>([^<]+)</,
    /property="og:title"\s+content="([^"]+)"/,
    /name="title"\s+content="([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let title = match[1].trim();
      // Clean Amazon title suffixes
      title = title.replace(/\s*[-|]\s*Amazon.*$/i, '').trim();
      if (title.length > 2) return title;
    }
  }
  return "";
}

function extractImage(html: string): string {
  const patterns = [
    /id="landingImage"[^>]*src="([^"]+)"/,
    /id="imgBlkFront"[^>]*src="([^"]+)"/,
    /data-old-hires="([^"]+)"/,
    /property="og:image"\s+content="([^"]+)"/,
    /"hiRes":"([^"]+)"/,
    /"large":"([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] && match[1].startsWith('http')) {
      return match[1];
    }
  }
  return "";
}

function guessCategory(title: string): string {
  const lower = title.toLowerCase();
  const categories: Record<string, string[]> = {
    "Eletrônicos e Informática": ["notebook", "celular", "fone", "mouse", "teclado", "monitor", "tablet", "câmera", "caixa de som", "carregador", "cabo", "usb", "bluetooth", "smart", "echo", "alexa", "kindle", "tv", "computador", "pc", "ssd", "hd", "memória", "placa", "processador", "headset", "speaker", "phone", "laptop", "watch", "relógio digital", "wireless", "wi-fi"],
    "Moda e Acessórios": ["camisa", "camiseta", "calça", "vestido", "saia", "blusa", "jaqueta", "tênis", "sapato", "bota", "sandália", "bolsa", "mochila", "carteira", "óculos", "relógio", "anel", "brinco", "colar", "pulseira", "roupa", "moda", "chapéu", "boné"],
    "Casa e Decoração": ["sofá", "mesa", "cadeira", "cama", "travesseiro", "lençol", "cortina", "tapete", "luminária", "vaso", "panela", "frigideira", "liquidificador", "microondas", "geladeira", "fogão", "aspirador", "organizador", "prateleira", "estante"],
    "Beleza e Cuidados Pessoais": ["shampoo", "condicionador", "creme", "perfume", "maquiagem", "batom", "base", "protetor solar", "desodorante", "escova", "secador", "prancha", "hidratante", "sabonete", "esmalte"],
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return "Eletrônicos e Informática";
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'URL inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { url } = parsed.data;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Não foi possível acessar o link (${response.status})` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();

    const name = extractTitle(html);
    const imageUrl = extractImage(html);
    const price = extractPrice(html);
    const category = guessCategory(name);

    return new Response(JSON.stringify({
      success: true,
      data: { name, imageUrl, price, category },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting product:', error);
    return new Response(JSON.stringify({ error: 'Erro ao extrair dados do produto' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
