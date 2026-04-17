const DATA_URL =
  "https://raw.githubusercontent.com/sm-monirulislam/Toffee-Auto-Update-Playlist/refs/heads/main/toffee_data.json";

let cache = null;
let lastFetch = 0;

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

    // ---------------------------
    // 🔄 CACHE JSON (1 min)
    // ---------------------------
    if (!cache || Date.now() - lastFetch > 60000) {
      const resp = await fetch(DATA_URL);

      if (!resp.ok) {
        throw new Error("Failed to fetch playlist JSON");
      }

      cache = await resp.json();
      lastFetch = Date.now();

      if (!cache.response) {
        throw new Error("Invalid JSON format");
      }
    }

    // ---------------------------
    // 🔎 FIND CHANNEL BY ID
    // ---------------------------
    if (id) {
      const cleanId = decodeURIComponent(id || "")
        .trim()
        .toLowerCase();

      const found = cache.response.find(
        (ch) =>
          ch.name &&
          ch.name.trim().toLowerCase() === cleanId
      );

      if (!found) {
        return res.status(404).json({
          error: "Channel not found",
          requested: cleanId,
          available: cache.response
            .slice(0, 15)
            .map((c) => c.name),
        });
      }

      targetUrl = found.link;
      customHeaders = found.headers || {};
    }

    if (!targetUrl) {
      return res.status(400).send("Missing id or url");
    }

    // ---------------------------
    // 🧹 CLEAN HEADERS (IMPORTANT)
    // ---------------------------
    const safeHeaders = { ...customHeaders };

    delete safeHeaders.host;
    delete safeHeaders.Host;
    delete safeHeaders["accept-encoding"];
    delete safeHeaders["Accept-Encoding"];

    if (safeHeaders["client-api-header"] === "null") {
      delete safeHeaders["client-api-header"];
    }

    let originHeader = "";
    try {
      originHeader = new URL(targetUrl).origin;
    } catch {}

    // ---------------------------
    // 🌐 FETCH STREAM
    // ---------------------------
    const upstream = await fetch(targetUrl, {
      headers: {
        ...safeHeaders,
        "User-Agent":
          safeHeaders["user-agent"] ||
          req.headers["user-agent"] ||
          "Mozilla/5.0",
        Referer: targetUrl,
        Origin: originHeader,
      },
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res
        .status(upstream.status)
        .send(errText || "Upstream error");
    }

    const contentType =
      upstream.headers.get("content-type") || "";

    // ---------------------------
    // 🎯 M3U8 HANDLING
    // ---------------------------
    if (
      contentType.includes(
        "application/vnd.apple.mpegurl"
      ) ||
      targetUrl.includes(".m3u8")
    ) {
      const text = await upstream.text();

      const base = targetUrl.substring(
        0,
        targetUrl.lastIndexOf("/") + 1
      );

      const rewritten = text
        .split("\n")
        .map((line) => {
          line = line.trim();

          if (!line || line.startsWith("#"))
            return line;

          const absoluteUrl = line.startsWith("http")
            ? line
            : base + line;

          // IMPORTANT: remove id from segments
          return `/api/toffee?url=${encodeURIComponent(
            absoluteUrl
          )}`;
        })
        .join("\n");

      res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl"
      );
      res.setHeader(
        "Access-Control-Allow-Origin",
        ALLOWED_ORIGIN
      );
      res.setHeader("Cache-Control", "no-store");

      return res.send(rewritten);
    }

    // ---------------------------
    // 🚀 STREAM (VERCEL SAFE)
    // ---------------------------
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Access-Control-Allow-Origin",
      ALLOWED_ORIGIN
    );
    res.setHeader("Cache-Control", "no-store");

    res.status(upstream.status);

    if (upstream.body && upstream.body.pipe) {
      upstream.body.pipe(res);
    } else {
      const buffer = await upstream.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (err) {
    console.error("PROXY ERROR:", err);
    res.status(500).send(err.message || "Proxy error");
  }
}
