export default async function handler(req, res) {
  try {
    const ALLOWED_ORIGIN = "https://bostaflix.vercel.app";

    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";

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

    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "",
        "Referer": targetUrl,
        "Origin": new URL(targetUrl).origin,
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).send("Upstream error");
      return;
    }

    const contentType = upstream.headers.get("content-type") || "";

    // --- Handle M3U8 ---
    if (
      contentType.includes("application/vnd.apple.mpegurl") ||
      targetUrl.includes(".m3u8")
    ) {
      const text = await upstream.text();

      const base = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      const rewritten = text
        .split("\n")
        .map(line => {
          line = line.trim();
          if (!line || line.startsWith("#")) return line;

          const absoluteUrl = line.startsWith("http")
            ? line
            : base + line;

          return `/api/live?url=${encodeURIComponent(absoluteUrl)}`;
        })
        .join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      res.setHeader("Cache-Control", "no-store");
      res.send(rewritten);
      return;
    }

    // --- 🚀 STREAM segments instead of buffering ---
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Cache-Control", "no-store");

    // Pipe stream directly
    const reader = upstream.body.getReader();

    res.status(200);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }

    res.end();

  } catch (err) {
    res.status(500).send("Proxy error");
  }
}
