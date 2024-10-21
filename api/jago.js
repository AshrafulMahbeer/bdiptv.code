// /api/jago.js

export default function handler(req, res) {
  const { url } = req.query;

  // Check if the requested URL is valid
  if (url === 'stream.m3u8') {
    // Set the response header to serve an m3u8 file
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

    // Respond with a master m3u8 playlist pointing to app24.jagobd.com.bd
    const masterM3U8 = `
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000
https://app24.jagobd.com.bd/stream.m3u8
    `;

    res.status(200).send(masterM3U8);
  } else {
    // If the requested URL is invalid, return a 404
    res.status(404).send('Stream not found');
  }
}
