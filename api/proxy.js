import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { url } = req.query;

  // Check if the URL is provided
  if (!url) {
    return res.status(400).json({ error: "URL parameter is missing" });
  }

  try {
    // Fetch the HLS stream from the provided URL
    const response = await fetch(decodeURIComponent(url));

    // If the response is not successful, return an error
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch the stream' });
    }

    // Set the appropriate content type (HLS playlist or media segments)
    res.setHeader('Content-Type', response.headers.get('content-type'));

    // Pipe the stream response to the client
    response.body.pipe(res);
  } catch (error) {
    // Handle any errors that occur
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
