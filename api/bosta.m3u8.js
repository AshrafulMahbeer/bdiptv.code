import type { VercelRequest, VercelResponse } from '@vercel/node';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const originalUrl = 'http://103.121.48.61:8080/live/0531195110/0531195110%20/83811.ts';

  try {
    const redirectUrl = await getRedirectLocation(originalUrl);
    if (!redirectUrl) {
      return res.status(502).send('No redirect location found');
    }

    const content = await fetchBinary(redirectUrl);
    res.setHeader('Content-Type', 'video/mp2t');
    res.status(200).send(content);
    res.setHeader('Access-Control-Allow-Origin', 'https://bostaflix.vercel.app');
  } catch (err: any) {
    res.status(500).send(`Error: ${err.message}`);
  }
}

function getRedirectLocation(urlStr: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const mod = url.protocol === 'https:' ? https : http;

    const req = mod.request(
      url,
      { method: 'HEAD' },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(res.headers.location);
        } else {
          resolve(null);
        }
      }
    );

    req.on('error', reject);
    req.end();
  });
}

function fetchBinary(urlStr: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const mod = url.protocol === 'https:' ? https : http;

    mod.get(url, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}
