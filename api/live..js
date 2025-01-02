// api/live.js

export default function handler(req, res) {
  // Check if the 'chunks' query parameter is present
  const { chunks } = req.query;

  // If 'chunks' is provided, redirect to the new URL
  if (chunks) {
    return res.redirect(301, `https://mafiatv.live/youtube/live.php?chunks=${chunks}`);
  }

  // Otherwise, respond with a 400 Bad Request if 'chunks' is missing
  return res.status(400).json({ error: 'Missing chunks parameter' });
}
