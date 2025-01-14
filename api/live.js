export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://bostaflix.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Custom-Header');

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

    const baseUrl = new URL(url).origin + new URL(url).pathname.replace(/\/[^/]*$/, '/');

    // Custom headers (adjust as needed)
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Referer': baseUrl, // Use the base URL as referer
      'Custom-Header': req.headers['custom-header'] || '',
    };

    console.log(`Fetching URL: ${url}`); // Log the URL being fetched

    // Fetch the content of the m3u8 file
    const response = await fetch(url, { headers });
    console.log(`Response Status: ${response.status}`); // Log response status

    if (!response.ok) {
      res.status(response.status).json({ error: `Failed to fetch ${url}: ${response.statusText}` });
      return;
    }

    const content = await response.text();

    // Process m3u8 content: Add "live?url=" after #EXTINF: lines and resolve relative URLs
    const processedContent = content.replace(
      /(^#EXTINF:.*?\n)(.*?$)/gm,
      (match, extinfLine, mediaUrl) => {
        if (!mediaUrl.startsWith('http')) {
          // Resolve relative URL
          mediaUrl = new URL(mediaUrl, baseUrl).href;
        }
        return `${extinfLine}live?url=${mediaUrl}`;
      }
    );

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.status(200).send(processedContent);
  } catch (error) {
    console.error('Error:', error); // Log the error for debugging
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
