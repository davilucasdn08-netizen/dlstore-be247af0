const https = require('https');
const zlib = require('zlib');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let next = res.headers.location;
        if (next.startsWith('/')) next = 'https://www.amazon.com.br' + next;
        resolve(fetch(next));
        return;
      }

      let stream = res;
      if (res.headers['content-encoding'] === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (res.headers['content-encoding'] === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (res.headers['content-encoding'] === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      let data = '';
      stream.on('data', c => data += c);
      stream.on('end', () => resolve(data));
      stream.on('error', reject);
    }).on('error', reject);
  });
}

const url = 'https://amzn.to/4s7t8Wg'; // Fire TV Stick
fetch(url).then(html => {
  console.log('--- HTML Length:', html.length);
  if (html.includes('captchacharacters')) {
      console.log('--- CAPTCHA DETECTED ---');
      return;
  }
  
  // Traditional Amazon price
  const priceWhole = html.match(/<span class="a-price-whole">([^<]+)/);
  const priceFraction = html.match(/<span class="a-price-fraction">([^<]+)<\/span>/);
  console.log('--- Price components:', priceWhole ? priceWhole[1].trim() : 'NOT FOUND', priceFraction ? priceFraction[1].trim() : 'NOT FOUND');

  // Alternative price searches
  const offscreen = html.match(/<span class="a-offscreen">([^<]+)<\/span>/);
  console.log('--- Offscreen match:', offscreen ? offscreen[1].trim() : 'NOT FOUND');

  // Raw R$ matches
  const rawPriceMatch = html.match(/R\$\s*([0-9.,]+)/g);
  console.log('--- Raw R$ matches (first 3):', rawPriceMatch ? rawPriceMatch.slice(0, 3) : 'NONE');

}).catch(err => {
  console.error('Fetch Error:', err);
});
