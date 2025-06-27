import https from 'https';
import { parse } from 'url';

export default function handler(req, res) {
  const targetUrl = "https://tvsen6.aynascope.net/durontotv/index.m3u8?e=1751036433&u=1afb0301-3144-485e-bbfe-cc519cb6c465&token=9f5a422ae831eec301021aced1ea0763";
  const options = {
    ...parse(targetUrl),
    method: 'GET',
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "DNT": "1",
      "Host": "tvsen6.aynascope.net",
      "Pragma": "no-cache",
      "Referer": "https://web.aynaott.com/",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
    }
  };

  https.get(options, (response) => {
    let data = '';

    response.on('data', chunk => {
      data += chunk;
      if (data.length > 1000) {
        response.destroy(); // stop once we have enough
      }
    });

    response.on('end', () => {
      res.statusCode = response.statusCode || 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end(data.slice(0, 1000));
    });

  }).on('error', (err) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Fetch failed", message: err.message }));
  });
}
