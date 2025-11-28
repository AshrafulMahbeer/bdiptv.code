// /api/proxy.js
export default async function handler(req, res) {
  const url = 'https://xfireflix.ct.ws/ayna/play.php?id=9ab9aa29-3d3b-4527-ab47-d9b69f0ea80c';

  const headers = {
    'cache-control': 'no-cache, max-age=0',
    'connection': 'keep-alive',
    'content-type': 'text/html; charset=UTF-8',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-encoding': 'gzip, deflate, br', // Vercel fetch can decode gzip/deflate/br automatically
    'accept-language': 'en-US,en;q=0.9,bn;q=0.8',
    'cookie': '__test=392f9bcbab403b32d5586ef28a71f6f1',
    'dnt': '1',
    'pragma': 'no-cache',
    'referer': 'https://xfireflix.ct.ws/ayna/play.php?id=9ab9aa29-3d3b-4527-ab47-d9b69f0ea80c',
    'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
  };

  try {
    const response = await fetch(url, { headers });
    const body = await response.text();

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(body);
  } catch (err) {
    res.status(500).send('Fetch error: ' + err.message);
  }
}
