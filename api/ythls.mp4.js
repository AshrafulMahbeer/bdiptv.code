export default async function handler(req, res) {
  try {
    // Extract query parameters
    const { id, server } = req.query;
    if (!id || !server) {
      return res.status(400).send("Missing 'id' or 'server' parameter");
    }

    // Target URL
    const targetUrl = `https://inv.nadeko.net/watch?v=${id}`;

    // Headers for the request
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
      "Cache-Control": "max-age=0",
      DNT: "1",
      Cookie: `PREFS=%7B%22volume%22%3A100%2C%22speed%22%3A1%7D; INVIDIOUS_SERVER_ID=${server}`,
      Referer: targetUrl,
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    };

    // Fetch the page
    const response = await fetch(targetUrl, { headers });
    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch video page");
    }

    // Read the page content
    const html = await response.text();

    // Extract the video URL from <meta property="og:video" content="videourl">
    const match = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/);
    if (!match) {
      return res.status(500).send("Video URL not found");
    }
    const videoUrl = match[1];

    // Redirect to the extracted video URL
    res.writeHead(302, { Location: videoUrl });
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}
