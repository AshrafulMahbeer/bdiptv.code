export default async function handler(req, res) {
  const originalUrl = 'http://103.121.48.61:8080/live/0531195110/0531195110%20/83811.ts';

  try {
    // Step 1: HEAD request to get the redirect URL
    const headResp = await fetch(originalUrl, { method: 'HEAD', redirect: 'manual' });

    const redirectUrl = headResp.headers.get('location');
    if (!redirectUrl) {
      return res.status(502).json({ error: 'No redirect location found' });
    }

    // Step 2: Fetch the redirected content
    const finalResp = await fetch(redirectUrl);

    if (!finalResp.ok) {
      return res.status(finalResp.status).send('Failed to fetch redirected content');
    }

    // Step 3: Set content headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', finalResp.headers.get('content-type') || 'application/octet-stream');

    const data = await finalResp.arrayBuffer();
    res.status(200).send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
