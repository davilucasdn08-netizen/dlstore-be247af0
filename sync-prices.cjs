/**
 * DLSTORE — Sincronizador de Preços da Amazon
 * 
 * Roda localmente e atualiza os preços de todos os produtos no Supabase.
 * Execute com: node sync-prices.cjs
 */

const https = require('https');
const zlib = require('zlib');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hrfyphdygyyjbajhuiuo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZnlwaGR5Z3l5amJhamh1aXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjkyNjQsImV4cCI6MjA5MDI0NTI2NH0.ncVdTyiRvUJn3O5CBPzspu4RaNRfcQp6_RbB0uHpRWw'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

/**
 * Normaliza qualquer string de preço para o formato "1.299,99"
 */
function normalizeBRPrice(raw) {
  let p = String(raw).trim().replace(/[R$\s\u00a0]/g, '');
  if (!p) return '';

  // Já no formato correto: "1.299,99"
  if (p.includes('.') && p.includes(',')) return p;

  // Formato "299,99"
  if (/,\d{2}$/.test(p) && !p.includes('.')) return p;

  // Formato americano "299.99"
  if (/\.\d{2}$/.test(p) && !p.includes(',')) {
    const parts = p.split('.');
    if (parts[0].length <= 3) return p.replace('.', ',');
    const num = parseFloat(p);
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Número inteiro puro
  if (/^\d+$/.test(p)) {
    return parseInt(p).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return p;
}

/**
 * Extrai e formata o preço do HTML da Amazon
 */
function extractPrice(html) {
  // Mais preciso: combina whole + fraction
  const wholeMatch = html.match(/class="a-price-whole"[^>]*>([^<]+)<\/span>/);
  const fractionMatch = html.match(/class="a-price-fraction"[^>]*>([^<]+)<\/span>/);
  
  if (wholeMatch && wholeMatch[1]) {
    let whole = wholeMatch[1].replace(/[^\d]/g, '');
    if (whole) {
      let fraction = fractionMatch ? fractionMatch[1].replace(/[^\d]/g, '') : '00';
      if (fraction.length === 1) fraction += '0';
      fraction = fraction.slice(0, 2);
      const num = parseInt(whole);
      const formattedWhole = num.toLocaleString('pt-BR');
      return `${formattedWhole},${fraction}`;
    }
  }

  // a-offscreen com preço completo "R$ 1.299,00"
  const offscreenMatches = html.matchAll(/class="a-offscreen"[^>]*>([^<]+)<\/span>/g);
  for (const m of offscreenMatches) {
    const p = normalizeBRPrice(m[1]);
    if (p && p.includes(',')) return p;
  }

  // JSON-LD
  const jsonLd = html.match(/"price"\s*:\s*"?([\d]+[.,][\d]{2})"?/);
  if (jsonLd && jsonLd[1]) return normalizeBRPrice(jsonLd[1]);

  // R$ 1.299,99 direto no HTML
  const brFull = html.match(/R\$\s*([\d.]+,\d{2})/);
  if (brFull && brFull[1]) return normalizeBRPrice(brFull[1]);

  return null;
}

function fetchPage(url) {
  return new Promise((resolve) => {
    const doRequest = (targetUrl, redirects = 0) => {
      if (redirects > 5) return resolve({ error: 'too_many_redirects' });

      const ua = USER_AGENTS[redirects % USER_AGENTS.length];
      const req = https.get(targetUrl, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let location = res.headers.location;
          if (location.startsWith('/')) location = 'https://www.amazon.com.br' + location;
          res.resume();
          return doRequest(location, redirects + 1);
        }

        let stream = res;
        const enc = res.headers['content-encoding'];
        if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());

        let data = '';
        stream.on('data', c => data += c);
        stream.on('end', () => resolve({ body: data }));
        stream.on('error', e => resolve({ error: e.message }));
      });

      req.on('error', e => resolve({ error: e.message }));
      req.setTimeout(15000, () => { req.destroy(); resolve({ error: 'timeout' }); });
    };

    doRequest(url);
  });
}

function isCaptcha(html) {
  const l = html.toLowerCase();
  return l.includes('captcha') || l.includes('robot') || l.includes('automated access') ||
         (html.length < 5000 && !l.includes('productTitle'));
}

async function scrapePrice(product) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await fetchPage(product.affiliate_link);
    if (result.error) {
      if (result.error === 'timeout') return { status: 'timeout' };
      return { status: 'error', reason: result.error };
    }
    if (!result.body) return { status: 'error', reason: 'empty body' };
    if (isCaptcha(result.body)) {
      if (attempt === 0) {
        await sleep(3000);
        continue;
      }
      return { status: 'captcha' };
    }
    
    const price = extractPrice(result.body);
    return { status: 'ok', price };
  }
  return { status: 'captcha' };
}

async function start() {
  console.log('🚀 DLSTORE — Sincronizador de Preços da Amazon');
  console.log('='.repeat(50));

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, affiliate_link, price');

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    process.exit(1);
  }

  console.log(`📦 ${products.length} produtos encontrados.\n`);

  const stats = { updated: 0, notFound: 0, captcha: 0, error: 0 };
  let captchaStreak = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const shortName = (p.name || '??').substring(0, 30).padEnd(30);
    process.stdout.write(`[${(i+1).toString().padStart(2)}/${products.length}] ${shortName} → `);

    if (!p.affiliate_link) {
      console.log('⏭ sem link');
      stats.error++;
      continue;
    }

    const result = await scrapePrice(p);

    if (result.status === 'captcha') {
      console.log('🔴 CAPTCHA');
      stats.captcha++;
      captchaStreak++;
      if (captchaStreak >= 3) {
        console.log('\n⛔ Muitos CAPTCHAs seguidos. Pausando 30s...');
        await sleep(30000);
        captchaStreak = 0;
      }
    } else if (result.status === 'timeout' || result.status === 'error') {
      console.log(`🟡 ${result.status}: ${result.reason || ''}`);
      stats.error++;
      captchaStreak = 0;
    } else if (!result.price) {
      console.log(`⏳ preço não encontrado (atual: ${p.price || 'vazio'})`);
      stats.notFound++;
      captchaStreak = 0;
    } else {
      console.log(`✅ R$ ${result.price} (era: ${p.price || 'vazio'})`);
      const { error: updateError } = await supabase
        .from('products')
        .update({ price: result.price })
        .eq('id', p.id);
      
      if (updateError) {
        console.log(`   ❌ Erro ao salvar: ${updateError.message}`);
        stats.error++;
      } else {
        stats.updated++;
      }
      captchaStreak = 0;
    }

    const delay = 2000 + Math.floor(Math.random() * 3000);
    await sleep(delay);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Resultado Final:');
  console.log(`   ✅ Atualizados:        ${stats.updated}`);
  console.log(`   ⏳ Preço não achado:   ${stats.notFound}`);
  console.log(`   🔴 CAPTCHAs:           ${stats.captcha}`);
  console.log(`   ❌ Erros:              ${stats.error}`);
  console.log('='.repeat(50));
  console.log('Sincronização concluída!');
}

start().catch(console.error);
