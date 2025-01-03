export default async function handler(req, res) {
  const { chunks } = req.query;

  // If 'chunks' is missing, return a 400 Bad Request
  if (!chunks) {
    return res.status(400).json({ error: 'Missing chunks parameter' });
  }

  // Construct the target URL
  const targetUrl = `https://mafiatv.live/youtube/live.php?chunks=${chunks}`;

  try {
    // Make the proxy request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers, // Forward incoming headers
        referer: 'https://mafiatv.live/', // Override or add the Referer header
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined, // Include body for non-GET/HEAD methods
    });

    // Forward the response status and headers
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Stream the response body
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error('Error proxying request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
