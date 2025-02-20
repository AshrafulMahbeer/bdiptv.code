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
    
    async function fetchM3U8(url) {
      try {
        let response = await fetch(url);
        let text = await response.text();
        return { url: response.url, text };
      } catch (err) {
        console.error("Error fetching M3U8:", err);
        return { url, text: "" };
      }
    }
    
    // Fetch first M3U8
    const firstM3U8 = await fetchM3U8(streamUrl);
    if (!firstM3U8.text) {
      return res.status(500).send("Error fetching first M3U8");
    }
    
    // Find the second M3U8 URL within the first one
    const secondM3U8Match = firstM3U8.text.match(/(https?:\/\/[^\s]+\.m3u8)/);
    let finalM3U8Url = secondM3U8Match ? secondM3U8Match[1] : firstM3U8.url;
    
    // Fetch the final M3U8
    const finalM3U8 = await fetchM3U8(finalM3U8Url);
    if (!finalM3U8.text) {
      return res.status(500).send("Error fetching second M3U8");
    }
    
    // Replace all origin URLs with inv.nadeko.net
    const modifiedM3U8 = finalM3U8.text.replace(/https?:\/\/[^\/]+/g, "https://inv.nadeko.net");
    
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.send(modifiedM3U8);
  } catch (error) {
    console.error("Error fetching stream:", error);
    res.status(500).send("Error fetching stream");
  }
}
