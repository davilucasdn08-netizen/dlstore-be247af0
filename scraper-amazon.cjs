const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://hrfyphdygyyjbajhuiuo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZnlwaGR5Z3l5amJhamh1aXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjkyNjQsImV4cCI6MjA5MDI0NTI2NH0.ncVdTyiRvUJn3O5CBPzspu4RaNRfcQp6_RbB0uHpRWw');

const dbPath = path.join(__dirname, 'src', 'data', 'descriptions.json');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    };
    
    const requestOptions = {
        ...options,
        headers: { ...defaultHeaders, ...(options.headers || {}) }
    };

    const req = https.get(url, requestOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve({ redirect: res.headers.location });
      } else {
        // Handle decompression
        let stream = res;
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (encoding === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (encoding === 'br') stream = res.pipe(zlib.createBrotliDecompress());

        let data = '';
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => resolve({ body: data, status: res.statusCode }));
        stream.on('error', (e) => resolve({ error: e.message }));
      }
    });

    req.on('error', reject);
    req.setTimeout(12000, () => {
        req.destroy();
        resolve({ error: "timeout" });
    });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function scrapeItem(product) {
    try {
        console.log(`Puxando [${product.name.substring(0,25)}]...`);
        const result = await fetch(product.affiliate_link);
        if (result.redirect) {
            let redirectUrl = result.redirect;
            if (redirectUrl.startsWith('/')) redirectUrl = 'https://www.amazon.com.br' + redirectUrl;
            
            const amzData = await fetch(redirectUrl);
            if (amzData.error) return amzData.error;
            if (amzData.body && amzData.body.includes('captchacharacters')) return "captcha";

            let extractedDescription = "";
            let extractedPrice = null;

            // Extract Description
            const match = amzData.body?.match(/<ul class="a-unordered-list a-vertical a-spacing-mini">([\s\S]*?)<\/ul>/);
            if (match) {
                extractedDescription = match[1].replace(/<[^>]+>/g, '').replace(/\n+/g, '\n').trim();
            } else {
                const matchDesc = amzData.body?.match(/<div id="productDescription"[^>]*>([\s\S]*?)<\/div>/);
                if (matchDesc) extractedDescription = matchDesc[1].replace(/<[^>]+>/g, '').replace(/\n+/g, '\n').trim();
            }

            // Extract Price via Whole+Fraction spans (Amazon's standard schema)
            const matchWhole = amzData.body?.match(/<span class="a-price-whole">([^<]+)/);
            const matchFraction = amzData.body?.match(/<span class="a-price-fraction">([^<]+)<\/span>/);
            
            if (matchWhole) {
                let whole = matchWhole[1].replace(/[^0-9]/g, '');
                if (whole.length > 0) {
                    let fraction = matchFraction ? matchFraction[1].replace(/[^0-9]/g, '') : "00";
                    if (fraction.length === 1) fraction += "0";
                    extractedPrice = `${whole},${fraction}`;
                }
            } else {
                // Secondary check: Offscreen span (Common in Amazon's accessibility labels)
                const altMatch = amzData.body?.match(/<span class="a-offscreen">R\$\s*([0-9.,]+)<\/span>/);
                if (altMatch) {
                    let priceString = altMatch[1].replace(/\./g, '');
                    if (priceString.includes(',')) {
                        extractedPrice = priceString;
                    } else {
                        extractedPrice = priceString + ",00";
                    }
                }
            }

            return { description: extractedDescription, price: extractedPrice };
        }
        return null; // no redirect found
    } catch(e) {
        console.error("Erro interno:", e.message);
        return null;
    }
}

async function start() {
    let cache = {};
    if (fs.existsSync(dbPath)) {
       try { cache = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch(e){}
    }

    const { data } = await supabase.from('products').select('id, name, affiliate_link');
    
    // Scan all products for price updates
    let pending = data;
    
    console.log(`Iniciando RADAR DE PREÇOS (FIXED): ${pending.length} produtos.`);

    let captchaHits = 0;

    for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        const payload = await scrapeItem(item);
        
        if (payload === "captcha") {
            console.log(`🔴 CAPTCHA DETECTADO: ${item.name.substring(0,25)}`);
            captchaHits++;
            if (captchaHits >= 5) {
                console.log("MUITOS CAPTCHAS! PARANDO O ROBÔ.");
                break;
            }
        } else if (payload === "timeout") {
            console.log(`🟡 TIMEOUT: ${item.name.substring(0,25)}`);
        } else if (payload && typeof payload === 'object') {
            const { description, price } = payload;
            
            // Sync Database Price - CRITICAL
            if (price) {
               console.log(`   💰 Sincronizando BD -> R$ ${price} [${item.name.substring(0,20)}]`);
               const { error } = await supabase.from('products').update({ price: price }).eq('id', item.id);
               if (error) console.error("   ❌ Erro Supabase:", error.message);
            } else {
               console.log(`   ⏳ Preço não localizado, mantendo congelado.`);
            }

            // Save Description to Cache
            if (description && description.length > 5) {
              cache[item.id] = description;
              fs.writeFileSync(dbPath, JSON.stringify(cache, null, 2));
            }

            captchaHits = 0;
        } else {
            console.log(`❌ FALHA: ${item.name.substring(0,25)}`);
        }

        const delay = Math.floor(Math.random() * 3000) + 2000; // Slow but safe (2s - 5s)
        await sleep(delay);
    }
    console.log(`Sincronização Finalizada.`);
}

start();
