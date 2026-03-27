export default async function handler(req, res) {
  try {
    const ALLOWED_ORIGIN = "https://bostaflix.vercel.app";

    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";

    // --- 🔒 Block unauthorized access ---
    if (
      !origin.includes(ALLOWED_ORIGIN) &&
      !referer.startsWith(ALLOWED_ORIGIN)
    ) {
      res.status(403).send("Forbidden");
      return;
    }

    const { url } = req.query;

    if (!url) {
      res.status(400).send("Missing ?url=");
      return;
    }

    const targetUrl = decodeURIComponent(url);

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "",
        "Referer": targetUrl,
        "Origin": new URL(targetUrl).origin,
      },
    });

    if (!response.ok) {
      res.status(response.status).send("Upstream error");
      return;
    }

    const contentType = response.headers.get("content-type") || "";

    // --- Handle M3U8 ---
    if (
      contentType.includes("application/vnd.apple.mpegurl") ||
      targetUrl.includes(".m3u8")
    ) {
      let text = await response.text();

      const base = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      const rewritten = text
        .split("\n")
        .map(line => {
          line = line.trim();

          if (!line || line.startsWith("#")) return line;

          let absoluteUrl;
          if (line.startsWith("http")) {
            absoluteUrl = line;
          } else {
            absoluteUrl = base + line;
          }

          return `/api/hls?url=${encodeURIComponent(absoluteUrl)}`;
        })
        .join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      res.setHeader("Cache-Control", "no-store");
      res.send(rewritten);
      return;
    }

    // --- Handle segments ---
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(500).send("Proxy error");
  }
}
