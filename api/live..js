import { request } from 'https';

export default function handler(req, res) {
  const { chunks } = req.query;

  // If 'chunks' is missing, return a 400 Bad Request
  if (!chunks) {
    return res.status(400).json({ error: 'Missing chunks parameter' });
  }

  // Construct the target URL path
  const targetPath = `/youtube/live.php?chunks=${chunks}`;

  // Options for the proxy request
  const options = {
    hostname: 'mafiatv.live',
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers, // Forward incoming headers
      referer: 'https://mafiatv.live/', // Override or add the Referer header
    },
  };

  // Create the proxy request
  const proxy = request(options, (proxyRes) => {
    // Forward the status code and headers from the proxied response
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Pipe the proxied response body to the client
    proxyRes.pipe(res, { end: true });
  });

  // Handle errors in the proxy request
  proxy.on('error', (err) => {
    console.error('Proxy request error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // Pipe the request body (if applicable) to the proxy request
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(proxy, { end: true });
  } else {
    proxy.end();
  }
}
