import { Readable } from 'stream';

const DATA_URL = "https://raw.githubusercontent.com/sm-monirulislam/Toffee-Auto-Update-Playlist/refs/heads/main/toffee_data.json";

let cache = null;
let lastFetch = 0;

export default async function handler(req, res) {
  try {
    const ALLOWED_ORIGIN = "https://bostaflix.vercel.app";
    const { origin = "", referer = "" } = req.headers;

    // 1. CORS check
    if (!origin.includes(ALLOWED_ORIGIN) && !referer.startsWith(ALLOWED_ORIGIN)) {
      return res.status(403).send("Forbidden");
    }

    const { id, url } = req.query;

    // 2. Fetch/Cache JSON
    if (!cache || Date.now() - lastFetch > 60000) {
      const resp = await fetch(DATA_URL);
      if (!resp.ok) throw new Error("Failed to fetch playlist");
      const data = await resp.json();
      cache = Array.isArray(data) ? data : (data.response || []);
      lastFetch = Date.now();
    }

    let targetUrl = url;
    let customHeaders = {};

    // 3. Resolve Channel
    if (id) {
      const cleanId = decodeURIComponent(id).trim().toLowerCase();
      const found = cache.find(ch => ch.name?.trim().toLowerCase() === cleanId);
      if (!found) return res.status(404).json({ error: "Channel not found" });
      
      targetUrl = found.link;
      customHeaders = found.headers || {};
    }

    if (!targetUrl) return res.status(400).send("Missing URL");

    // 4. Prepare Proxy Headers
    const targetUri = new URL(targetUrl);
    const safeHeaders = { ...customHeaders };

    // Fix: Explicitly set the Host header to the target domain
    safeHeaders["Host"] = targetUri.host;
    
    // Remove headers that might cause conflicts
    ['connection', 'content-length', 'accept-encoding'].forEach(h => {
        delete safeHeaders[h];
        delete safeHeaders[h.toLowerCase()];
    });

    const upstream = await fetch(targetUrl, {
      headers: {
        ...safeHeaders,
        "User-Agent": safeHeaders["user-agent"] || req.headers["user-agent"] || "Mozilla/5.0",
        "Referer": targetUri.origin,
        "Origin": targetUri.origin,
      },
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).send(errText || "Upstream Error");
    }

    const contentType = upstream.headers.get("content-type") || "";

    // 5. Handle M3U8 Manifests
    if (contentType.includes("mpegurl") || targetUrl.includes(".m3u8")) {
      const text = await upstream.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      const rewritten = text.split("\n").map(line => {
        const t = line.trim();
        if (!t || t.startsWith("#")) return t;
        const abs = t.startsWith("http") ? t : baseUrl + t;
        return `/api/toffee?url=${encodeURIComponent(abs)}`;
      }).join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
      return res.status(200).send(rewritten);
    }

    // 6. Stream Video Segments
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Cache-Control", "public, max-age=10");

    if (upstream.body) {
      return Readable.fromWeb(upstream.body).pipe(res);
    }
    
    res.status(500).send("No stream body");

  } catch (err) {
    console.error("Server Error:", err.message);
    if (!res.headersSent) {
      res.status(500).send("Proxy error: " + err.message);
    }
  }
}
