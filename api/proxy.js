export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    // Fetch the HLS stream from the provided URL
    const response = await fetch(decodeURIComponent(url));

    // Check if the response is successful
    if (!response.ok) {
      return res.status(response.status).send('Error fetching the stream');
    }

    // Set the appropriate headers for HLS content
    res.setHeader('Content-Type', response.headers.get('content-type'));
    
    // Pipe the response body to the client
    response.body.pipe(res);
  } catch (error) {
    // Catch any errors during the fetch or streaming
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
