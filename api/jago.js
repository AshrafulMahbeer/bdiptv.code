// /api/jago.js

export default function handler(req, res) {
  const { url } = req.query;

  if (url) {
    // Set the response header to serve an m3u8 file
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

    // Prepend the domain to the provided URL path
    const domain = 'https://app24.jagobd.com.bd/';
    const fullUrl = domain + url;

    // Generate the M3U8 response with the full URL
    const m3u8Content = `
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000
${fullUrl}
    `;

    // Send the dynamically generated M3U8 content
    res.status(200).send(m3u8Content);
  } else {
    // If the url query parameter is not provided, return a 400 error
    res.status(400).send('Missing URL parameter');
  }
}
