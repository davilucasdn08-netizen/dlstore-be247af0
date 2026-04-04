const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(`Redirect: ${res.headers.location}`);
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data.substring(0, 1000)));
      }
    }).on('error', reject);
  });
}

fetch('https://amzn.to/4bSQqsI').then(console.log).catch(console.error);
