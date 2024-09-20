export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    // Fetch the target URL (HLS stream or other)
    const response = await fetch(decodeURIComponent(url));

    // Check if the response is successful
    if (!response.ok) {
      return res.status(response.status).send('Error fetching the resource');
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Set the appropriate content type for HLS content
    res.setHeader('Content-Type', response.headers.get('content-type'));

    // Stream the response body back to the client
    const body = await response.arrayBuffer();
    res.status(200).send(Buffer.from(body));
    
  } catch (error) {
    // Handle any errors during the fetch or streaming process
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
