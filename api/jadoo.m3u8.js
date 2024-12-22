export default async function handler(req, res) {
  const { url } = req.query;

  // Validate URL query parameter
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  let currentUrl = url;
  let repeatCount = 0;
  let proxy = false;

  try {
    while (repeatCount < 5) {
      // Fetch the M3U8 file
      const response = await fetch(currentUrl);
      if (!response.ok) {
        return res.status(500).json({ error: `Failed to fetch: ${response.statusText}` });
      }

      const m3u8Content = await response.text();

      // Check if the file contains .ts segments
      if (m3u8Content.includes('.ts')) {
        proxy = true;
        return res.status(200).json({ proxy, m3u8: true, message: 'Task done' });
      }

      // Check if the file contains a nested .m3u8 file
      if (m3u8Content.includes('.m3u8')) {
        proxy = false;
        const nextM3u8Match = m3u8Content.match(/(https?:\\/\\/[^\\s\"']+\\.m3u8)/);

        if (nextM3u8Match && nextM3u8Match[0]) {
          currentUrl = nextM3u8Match[0];
          repeatCount++;
        } else {
          return res.status(400).json({ error: 'No nested .m3u8 URL found' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid M3U8 file structure' });
      }
    }

    return res.status(400).json({ error: 'Maximum repeat limit reached' });
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred', details: error.message });
  }
}
