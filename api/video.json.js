export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', 'https://bostaflix.vercel.app');

  const url = req.query.url;
  const msg = {};

  try {
    if (!url) {
      throw new Error('Please provide the URL');
    }

    const headers = {
      'sec-fetch-user': '?1',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-site': 'none',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'cache-control': 'max-age=0',
      'authority': 'www.facebook.com',
      'upgrade-insecure-requests': '1',
      'accept-language': 'en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6',
      'sec-ch-ua': '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
    };

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    const html = await response.text();

    msg.success = true;
    msg.id = generateId(url);
    msg.title = getTitle(html);

    const sdLink = getSDLink(html);
    const hdLink = getHDLink(html);

    if (sdLink) msg.links = { ...msg.links, 'Download Low Quality': sdLink + '&dl=1' };
    if (hdLink) msg.links = { ...msg.links, 'Download High Quality': hdLink + '&dl=1' };

  } catch (error) {
    msg.success = false;
    msg.message = error.message;
  }

  res.status(200).json(msg);
}

// Utility functions
function generateId(url) {
  const match = url.match(/(\d+)\/?$/);
  return match ? match[1] : '';
}

function cleanStr(str) {
  try {
    return JSON.parse(`{"text": "${str.replace(/"/g, '\\"')}"}`).text;
  } catch {
    return str;
  }
}

function getSDLink(html) {
  const match = html.match(/browser_native_sd_url":"([^"]+)"/);
  return match ? cleanStr(match[1]) : null;
}

function getHDLink(html) {
  const match = html.match(/browser_native_hd_url":"([^"]+)"/);
  return match ? cleanStr(match[1]) : null;
}

function getTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/) || html.match(/title id="pageTitle">(.+?)<\/title>/);
  return match ? cleanStr(match[1]) : '';
}
