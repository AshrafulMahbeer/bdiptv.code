export default async function handler(req, res) {
  const originalUrl = 'http://103.121.48.61:8080/live/0531195110/0531195110%20/83811.ts';

  try {
    // Step 1: fetch with redirect follow
    const initialResponse = await fetch(originalUrl, { method: 'GET', redirect: 'follow' });

    // Step 2: Check final URL from response.url
    const finalUrl = initialResponse.url;

    if (!finalUrl || !initialResponse.ok) {
      return res.status(502).json({ error: 'Failed to resolve redirect or fetch final content' });
    }

    // Step 3: Read data and pass through
    const arrayBuffer = await initialResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', initialResponse.headers.get('content-type') || 'application/octet-stream');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
