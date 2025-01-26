export default async function handler(req, res) {
  const targetUrl = req.query.url; // The URL to proxy
  if (!targetUrl) {
    res.status(400).json({ error: "Missing 'url' query parameter" });
    return;
  }

  try {
    // Fetch the target URL with a custom Referer
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        referer: "https://iptv24bd.live/", // Set your custom Referer here
      },
    });

    // Forward the response to the client
    const contentType = response.headers.get("content-type");
    res.setHeader("Content-Type", contentType || "application/octet-stream");

    const body = await response.text();
    res.status(response.status).send(body);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch target URL", details: error.message });
  }
}
