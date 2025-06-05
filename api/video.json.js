import http from 'http';
import https from 'https';
import { URL } from 'url';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', 'https://bostaflix.vercel.app');
  res.setHeader('Content-Type', 'application/json');

  const { url } = req.query;
  const msg = {};

  try {
    if (!url) throw new Error('Please provide the URL');

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
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    };

    const html = await fetchRawHtml(url, headers);

    msg.success = true;
    msg.id = extractId(url);
    msg.title = extractTitle(html);
    msg.links = {};

    const sdLink = extractMatch(html, /browser_native_sd_url":"([^"]+)"/);
    const hdLink = extractMatch(html, /browser_native_hd_url":"([^"]+)"/);

    if (sdLink) msg.links['Download Low Quality'] = decodeJsonString(sdLink) + '&dl=1';
    if (hdLink) msg.links['Download High Quality'] = decodeJsonString(hdLink) + '&dl=1';

    res.status(200).end(JSON.stringify(msg));
  } catch (err) {
    res.status(500).end(JSON.stringify({ success: false, message: err.message }));
  }
}

// Fetch raw HTML from a URL using native http/https
function fetchRawHtml(rawUrl, headers) {
  const urlObj = new URL(rawUrl);
  const lib = urlObj.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const options = {
      headers,
      timeout: 10000,
    };

    const req = lib.get(rawUrl, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

// Extract Facebook video ID
function extractId(url) {
  const match = url.match(/(\d+)\/?$/);
  return match ? match[1] : '';
}

// Extract HTML title tag content
function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/);
  return match ? decodeJsonString(match[1]) : '';
}

// Safely decode string that may contain escaped sequences (e.g., \u0025)
function decodeJsonString(str) {
  try {
    return JSON.parse(`{"text":"${str}"}`).text;
  } catch {
    return str;
  }
}

// Regex extractor
function extractMatch(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : null;
}
