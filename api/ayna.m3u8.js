// api/proxy.js
export default async function handler(req, res) {
  const target = "http://ayna-playlist.xfireflix.workers.dev/";

  // Build VLC-like / universal media headers
  const headers = {
    // Exact-ish VLC UA (use latest version string you observed)
    "User-Agent": "VLC/3.0.18 LibVLC/3.0.18",
    "Accept": "*/*",
    // force identity to avoid gzip responses that some streamers don't expect
    "Accept-Encoding": "identity",
    // let server know we want metadata (icy) if available
    "Icy-MetaData": "1",
    // keep connection alive
    "Connection": "keep-alive",
    // allow range requests from the client to be forwarded
    "Range": req.headers.range || "bytes=0-",
    // Some servers like a referer; uncomment and set one if needed:
    // "Referer": "https://example.com/",
    // "Pragma"/"Cache-Control" sometimes help:
    "Pragma": "no-cache",
    "Cache-Control": "no-cache"
  };

  // Allow browser clients to call this endpoint (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range,Accept,Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const upstream = await fetch(target, { method: "GET", headers });

    // Copy some important response headers to the client
    const contentType = upstream.headers.get("content-type");
    const contentRange = upstream.headers.get("content-range");
    const acceptRanges = upstream.headers.get("accept-ranges");
    const contentLength = upstream.headers.get("content-length");

    if (contentType) res.setHeader("Content-Type", contentType);
    if (contentRange) res.setHeader("Content-Range", contentRange);
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
    if (contentLength) res.setHeader("Content-Length", contentLength);

    // If upstream returns non-200/206, pass status and text
    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      return res.status(upstream.status).send(errText || `Upstream status ${upstream.status}`);
    }

    // For playlist files (small): use arrayBuffer and send as single response
    // This is easiest and reliable for .m3u/.m3u8/.txt playlists.
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).end(buf);
  } catch (err) {
    res.status(502).send("Proxy error: " + err.message);
  }
}
