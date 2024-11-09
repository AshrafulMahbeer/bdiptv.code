import fetch from 'node-fetch';

export default async function handler(req, res) {
  const hlsUrl = "https://example.com/your-hls-stream.m3u8"; // Replace with your HLS URL

  try {
    // Fetch the HLS content
    const response = await fetch(hlsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch HLS stream: ${response.statusText}`);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl'); // HLS MIME type
    res.setHeader('Cache-Control', 'no-cache');

    // Pipe the response data
    const streamData = await response.text();
    res.status(200).send(streamData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error restreaming HLS');
  }
}
