export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://bostaflix.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url } = req.query;

    if (!url) {
      res.status(400).json({ error: 'Missing "url" query parameter.' });
      return;
    }

    const baseUrl = new URL(url).origin;

    // Fetch the content of the m3u8 file
    const response = await fetch(url);
    if (!response.ok) {
      res.status(response.status).json({ error: `Failed to fetch ${url}` });
      return;
    }

    const content = await response.text();

    // Process m3u8 content: Replace relative URLs or add live?url= for absolute URLs
    const processedContent = content.replace(
      /(^(?!https?:\/\/|#).*?$)|(^https?:\/\/.*?$)/gm,
      (match, relativeUrl, fullUrl) => {
        if (relativeUrl) {
          // If the URL is relative
          return `live?url=${encodeURIComponent(`${baseUrl}/${relativeUrl}`)}`;
        } else if (fullUrl) {
          // If the URL is absolute
          return `live?url=${encodeURIComponent(fullUrl)}`;
        }
        return match;
      }
    );

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.status(200).send(processedContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
