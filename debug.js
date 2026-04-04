const https = require('https');

function fetch(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let next = res.headers.location;
        if (next.startsWith('/')) next = 'https://www.amazon.com.br' + next;
        resolve(fetch(next));
      } else {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      }
    });
  });
}

fetch('https://amzn.to/4s7t8Wg').then(html => {
  console.log('--- HTML Length:', html.length);
  if (html.includes('captchacharacters')) {
      console.log('--- CAPTCHA DETECTED ---');
      return;
  }
  const priceMatches = html.match(/<span class="a-price"[^>]*>([\s\S]*?)<\/span>/g);
  console.log('--- Price spans found:', priceMatches ? priceMatches.length : 0);
  if (priceMatches) {
      priceMatches.forEach((m, i) => console.log(`[${i}]`, m));
  }
  
  const offScreen = html.match(/<span class="a-offscreen">([^<]+)<\/span>/g);
  console.log('--- Offscreen spans found:', offScreen ? offScreen.length : 0);
  if (offScreen) {
      offScreen.forEach((m, i) => console.log(`OFF[${i}]`, m));
  }
});
