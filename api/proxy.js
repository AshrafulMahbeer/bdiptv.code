const https = require('https');
const http = require('http');

module.exports = async (req, res) => {
  let { url } = req.query;

  if (!url) {
    res.status(400).json({ error: "Missing URL" });
    return;
  }

  // Ensure URL starts with http:// if no protocol is provided
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url; // Default to http since stream supports only http
  }

  // Always convert any incoming https requests for the stream to http
  if (url.startsWith('https://')) {
    url = url.replace('https://', 'http://');
  }

  // Use http to request the stream, but serve over https
  http.get(url, (hlsRes) => {
    // Forward the content type from the original response
    res.setHeader('Content-Type', hlsRes.headers['content-type']);
    
    // Pipe the stream to the client (which uses https)
    hlsRes.pipe(res).on('error', (err) => {
      res.status(500).json({ error: "Error proxying HLS stream" });
    });
  }).on('error', (err) => {
    res.status(500).json({ error: "Failed to reach HLS URL" });
  });
};
