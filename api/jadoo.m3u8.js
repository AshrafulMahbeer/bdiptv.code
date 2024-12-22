async function fetchM3U8(url) {
  let currentUrl = url;
  let repeatCount = 0;
  let proxy = false;

  while (repeatCount < 5) {
    try {
      const response = await fetch(currentUrl);
      if (!response.ok) {
        console.error(`Failed to fetch M3U8 file: ${response.statusText}`);
        return;
      }

      const m3u8Content = await response.text();

      // Check if .ts files exist
      if (m3u8Content.includes('.ts')) {
        proxy = true;
        console.log({ proxy, m3u8: true, message: 'Task done' });
        return;
      }

      // Check if .m3u8 files exist
      if (m3u8Content.includes('.m3u8')) {
        proxy = false;
        const nextM3u8Match = m3u8Content.match(/(https?:\\/\\/[^\\s\"']+\\.m3u8)/);

        if (nextM3u8Match && nextM3u8Match[0]) {
          currentUrl = nextM3u8Match[0];
          repeatCount++;
        } else {
          console.error('No .m3u8 URL found in the file');
          return;
        }
      } else {
        console.error('Invalid M3U8 file structure');
        return;
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
  }

  console.error('Maximum repeat limit reached');
}

// Example usage
fetchM3U8('https://example.com/playlist.m3u8');
