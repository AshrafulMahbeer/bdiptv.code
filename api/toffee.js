const DATA_URL = "https://raw.githubusercontent.com/sm-monirulislam/Toffee-Auto-Update-Playlist/refs/heads/main/toffee_data.json";

export default async function handler(req, res) {
  try {
    const ALLOWED_ORIGIN = "https://bostaflix.vercel.app";

    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";

    if (
      !origin.includes(ALLOWED_ORIGIN) &&
      !referer.startsWith(ALLOWED_ORIGIN)
    ) {
      return res.status(403).send("Forbidden");
    }

    const { id, url } = req.query;

    let targetUrl = url;
    let customHeaders = {};

    // 🔎 If ID provided → lookup from JSON
    if (id) {
      const json = await fetch(DATA_URL).then(r => r.json());

      let found = null;

      for (const group of json.response) {
        if (group.name === id) {
          found = group;
          break;
        }
      }

      if (!found) {
        return res.status(404).send("Channel not found");
      }

      targetUrl = found.link;
      customHeaders = found.headers || {};
    }

    if (!targetUrl) {
      return res.status(400).send("Missing id or url");
    }

    const upstream = await fetch(targetUrl, {
      headers: {
        ...customHeaders,
        "User-Agent": customHeaders["user-agent"] || req.headers["user-agent"] || "",
        "Referer": targetUrl,
        "Origin": new URL(targetUrl).origin,
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).send("Upstream error");
    }

    const contentType = upstream.headers.get("content-type") || "";

    // 🔥 M3U8 rewrite
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

          return `/api/live?url=${encodeURIComponent(absoluteUrl)}&id=${id || ""}`;
        })
        .join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      res.setHeader("Cache-Control", "no-store");

      return res.send(rewritten);
    }

    // 🚀 STREAM segments
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Cache-Control", "no-store");

    const reader = upstream.body.getReader();
    res.status(200);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }

    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy error");
  }
}
