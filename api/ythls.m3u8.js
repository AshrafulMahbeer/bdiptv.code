export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send("Missing video ID");
  }

  const webpageUrl = `https://inv.nadeko.net/watch?v=${id}`;
  
  try {
    const response = await fetch(webpageUrl, {
      headers: {
        "authority": "inv.nadeko.net",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9,bn;q=0.8",
        "cache-control": "max-age=0",
        "cookie": "PREFS=%7B%22volume%22%3A100%2C%22speed%22%3A1%7D; INVIDIOUS_SERVER_ID=2",
        "dnt": "1",
        "priority": "u=0, i",
        "referer": webpageUrl,
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      }
    });
    
    const html = await response.text();
    const match = html.match(/<source src="(.*?)" type="application\/x-mpegURL"/);
    
    if (!match || !match[1]) {
      return res.status(404).send("Stream link not found");
    }
    
    let streamUrl = match[1];
    if (!streamUrl.startsWith("http")) {
      const url = new URL(webpageUrl);
      streamUrl = url.origin + streamUrl;
    }
    
    res.writeHead(302, { Location: streamUrl });
    res.end();
  } catch (error) {
    console.error("Error fetching stream:", error);
    res.status(500).send("Error fetching stream");
  }
}
