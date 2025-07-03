import { IncomingMessage, ServerResponse } from 'http';
import http from 'http';
import https from 'https';
import { URL } from 'url';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const originalUrl = 'http://103.121.48.61:8080/live/0531195110/0531195110%20/83811.ts';

  try {
    const redirectUrl = await getRedirectLocation(originalUrl);
    if (!redirectUrl) {
      res.statusCode = 502;
      res.end('No redirect location found');
      return;
    }

    const content = await fetchBinary(redirectUrl);

    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', 'https://bostaflix.vercel.app');
    res.statusCode = 200;
    res.end(content);
  } catch (err) {
    res.statusCode = 500;
    res.end(`Error: ${err}`);
  }
}

function getRedirectLocation(urlStr: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const mod = urlObj.protocol === 'https:' ? https : http;

    const req = mod.get(urlObj, { method: 'HEAD' }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
      } else {
        resolve(null);
      }
    });

    req.on('error', reject);
  });
}

function fetchBinary(urlStr: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const mod = urlObj.protocol === 'https:' ? https : http;

    const req = mod.get(urlObj, (res) => {
      const data: Buffer[] = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    });

    req.on('error', reject);
  });
}
