export default async function handler(req, res) {
  const originalUrl = 'http://103.121.48.61:8080/live/0531195110/0531195110%20/83811.ts';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(originalUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok || !response.body) {
      return res.status(502).send('Failed to fetch stream');
    }

    // Set headers immediately to avoid 10s timeout
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp2t');
    res.status(200);

    // Stream the response body directly to the client
    const reader = response.body.getReader();

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      } catch (err) {
        // Silent abort, no crash
      } finally {
        res.end();
      }
    };

    await pump();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      res.status(206).end(); // Partial content
    } else {
      res.status(500).json({ error: 'Fetch failed', detail: err.message });
    }
  }
}
