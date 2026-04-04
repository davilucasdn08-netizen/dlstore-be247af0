const https = require('https');
const fs = require('fs');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve({ redirect: res.headers.location });
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ body: data, status: res.statusCode }));
      }
    }).on('error', reject);
  });
}

(async () => {
    const result = await fetch('https://amzn.to/4bSQqsI');
    if (result.redirect) {
        let redirectUrl = result.redirect;
        if (redirectUrl.startsWith('/')) redirectUrl = 'https://www.amazon.com.br' + redirectUrl;
        console.log('Redirecting to:', redirectUrl);
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
        };
        const urlToFetch = new URL(redirectUrl);
        if (urlToFetch.hostname.includes('amazon')) {
             const amzData = await fetch(urlToFetch, { headers });
             fs.writeFileSync('amazon-page.html', amzData.body);
             
             // Very naive extraction for feature bullets
             const match = amzData.body.match(/<ul class="a-unordered-list a-vertical a-spacing-mini">([\s\S]*?)<\/ul>/);
             if (match) {
                 const cleanText = match[1].replace(/<[^>]+>/g, '').replace(/\n+/g, '\n').trim();
                 console.log("EXTRACTED BULLETS:\n", cleanText);
             } else {
                 const matchDesc = amzData.body.match(/<div id="productDescription" class="a-section a-spacing-small">([\s\S]*?)<\/div>/);
                 if (matchDesc) {
                     const cleanTextDesc = matchDesc[1].replace(/<[^>]+>/g, '').replace(/\n+/g, '\n').trim();
                     console.log("EXTRACTED DESC:\n", cleanTextDesc);
                 } else {
                     console.log("FAILED to extract descriptions. Body contains CAPTCHA?", amzData.body.includes('captchacharacters'));
                 }
             }
        }
    }
})();
