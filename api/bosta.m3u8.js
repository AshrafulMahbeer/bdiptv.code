export default async function handler(req, res) {
  const originalUrl = 'http://103.121.48.61:8080/live/0531195110/0531195110%20/83811.ts';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const initialResponse = await fetch(originalUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!initialResponse.ok) {
      return res.status(502).send('Failed to fetch final content');
    }

    const contentType = initialResponse.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await initialResponse.arrayBuffer());

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    return res.status(200).send(buffer);
  } catch (error) {
    if (error.name === 'AbortError') {
      // If aborted, try to send partial content if any
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/octet-stream');
      return res.status(206).send(Buffer.from([])); // Empty partial content
    }

    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}
