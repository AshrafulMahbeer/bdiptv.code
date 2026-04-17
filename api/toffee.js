import { Readable } from 'stream';

const DATA_URL = "https://raw.githubusercontent.com/sm-monirulislam/Toffee-Auto-Update-Playlist/refs/heads/main/toffee_data.json";

// Shared across warm executions
let cache = null;
let lastFetch = 0;

export default async function handler(req, res) {
  try {
    const ALLOWED_ORIGIN = "https://bostaflix.vercel.app";
    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";

    // 🔒 Security Check
    if (!origin.includes(ALLOWED_ORIGIN) && !referer.startsWith(ALLOWED_ORIGIN)) {
      return res.status(403).send("Forbidden");
    }

    const { id, url } = req.query;
    let targetUrl = url;
    let customHeaders = {};

    // 🔄 Cache Playlist JSON (1 minute)
    if (!cache || Date.now() - lastFetch > 60000) {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) throw new Error("Playlist fetch failed");
      const json = await resp.json();
      cache = json.response || json; 
      lastFetch = Date.now();
    }

    // 🔎 Resolve Channel ID
    if (id) {
      const cleanId = decodeURIComponent(id).trim().toLowerCase();
      const found = cache.find(ch => ch.name?.trim().toLowerCase() === cleanId);

      if (!found) {
        return res.status(404).json({ error: "Channel not found" });
      }
      targetUrl = found.link;
      customHeaders = found.headers || {};
    }

    if (!targetUrl) return res.status(400).send("Missing parameters");

    // 🧹 Clean Headers
    const safeHeaders = { ...customHeaders };
    delete safeHeaders.host;
    delete safeHeaders.Host;
    delete safeHeaders["accept-encoding"];

    // 🌐 Fetch Upstream Stream
    const upstream = await fetch(targetUrl, {
      headers: {
        ...safeHeaders,
        "User-Agent": safeHeaders["user-agent"] || req.headers["user-agent"] || "Mozilla/5.0",
        "Referer": new URL(targetUrl).origin,
        "Origin": new URL(targetUrl).origin,
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).send("Upstream Error");
    }

    const contentType = upstream.headers.get("content-type") || "";

    // 🎯 M3U8 Manifest Rewriting
    if (contentType.includes("mpegurl") || targetUrl.includes(".m3u8")) {
      const text = await upstream.text();
      const base = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      const rewritten = text.split("\n").map(line => {
        const t = line.trim();
        if (!t || t.startsWith("#")) return t;
        const abs = t.startsWith("http") ? t : base + t;
        return `/api/toffee?url=${encodeURIComponent(abs)}`;
      }).join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      return res.status(200).send(rewritten);
    }

    // 🚀 Stream Video Segments (.ts / .m4s)
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Cache-Control", "public, max-age=10");

    if (upstream.body) {
      // Native Node.js bridge for Web Streams
      Readable.fromWeb(upstream.body).pipe(res);
    } else {
      res.status(500).send("Empty stream body");
    }

  } catch (err) {
    console.error("Internal Error:", err.message);
    if (!res.headersSent) {
      res.status(500).send("Proxy error");
    }
  }
}
