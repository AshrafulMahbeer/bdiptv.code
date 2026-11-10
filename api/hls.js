
import { lookup } from "node:dns/promises";
import net from "node:net";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const ALLOWED_ORIGIN = "https://bostaflix.vercel.app";

const MAX_PLAYLIST_SIZE = 2 * 1024 * 1024;
const MAX_URL_LENGTH = 8192;
const MAX_REDIRECTS = 5;
const HEADER_TIMEOUT = 15000;

// --------------------------------------------------
// Security: origin validation
// --------------------------------------------------

function isAllowedOrigin(req) {
  const origin = req.headers.origin;

  if (origin) {
    return origin === ALLOWED_ORIGIN;
  }

  const referer = req.headers.referer;

  if (!referer) return false;

  try {
    return new URL(referer).origin === ALLOWED_ORIGIN;
  } catch {
    return false;
  }
}

// --------------------------------------------------
// Security: private IP detection
// --------------------------------------------------

function isPrivateIPv4(ip) {
  const parts = ip.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)
  ) return true;

  const [a, b, c] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase().split("%")[0];

  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("ff")
  ) return true;

  // IPv4-mapped IPv6
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice(7);

    if (net.isIP(mapped) === 4) {
      return isPrivateIPv4(mapped);
    }
  }

  return false;
}

function isPrivateIP(ip) {
  const version = net.isIP(ip);

  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);

  return true;
}

// --------------------------------------------------
// Security: URL validation and DNS checks
// --------------------------------------------------

async function validateTarget(input) {
  if (
    typeof input !== "string" ||
    !input ||
    input.length > MAX_URL_LENGTH
  ) {
    throw new Error("Invalid URL");
  }

  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error("Unsupported URL");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".localhost.")
  ) {
    throw new Error("Blocked hostname");
  }

  const ipVersion = net.isIP(hostname);

  if (ipVersion) {
    if (isPrivateIP(hostname)) {
      throw new Error("Blocked IP address");
    }
  } else {
    let addresses;

    try {
      addresses = await lookup(hostname, {
        all: true,
        verbatim: true
      });
    } catch {
      throw new Error("DNS resolution failed");
    }

    if (
      !addresses.length ||
      addresses.some(item => isPrivateIP(item.address))
    ) {
      throw new Error("Blocked DNS destination");
    }
  }

  return parsed;
}

// --------------------------------------------------
// Upstream fetch with redirect validation
// --------------------------------------------------

async function fetchUpstream(url, req) {
  let current = url;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await validateTarget(current.href);

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      HEADER_TIMEOUT
    );

    let response;

    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            req.headers["user-agent"] || "Mozilla/5.0 BOSTAFLIX",
          "Referer": current.href,
          "Origin": current.origin,
          "Accept": "*/*"
        }
      });
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }

    clearTimeout(timeout);

    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      const location = response.headers.get("location");

      await response.body?.cancel();

      if (!location) {
        throw new Error("Invalid redirect");
      }

      current = new URL(location, current);
      continue;
    }

    return response;
  }

  throw new Error("Too many redirects");
}

// --------------------------------------------------
// Playlist detection
// --------------------------------------------------

function isPlaylist(response, url) {
  const type = (
    response.headers.get("content-type") || ""
  ).toLowerCase();

  return (
    type.includes("mpegurl") ||
    type.includes("application/x-mpegurl") ||
    /\.m3u8(?:$|[?#])/i.test(url.href)
  );
}

// --------------------------------------------------
// Playlist reading with size limit
// --------------------------------------------------

async function readPlaylist(response) {
  if (!response.body) {
    throw new Error("Empty playlist");
  }

  const reader = response.body.getReader();

  const chunks = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      total += value.byteLength;

      if (total > MAX_PLAYLIST_SIZE) {
        throw new Error("Playlist too large");
      }

      chunks.push(value);
    }
  } catch (err) {
    await reader.cancel().catch(() => {});
    throw err;
  }

  const combined = new Uint8Array(total);

  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(combined);
}

// --------------------------------------------------
// Rewrite HLS URLs
// --------------------------------------------------

function proxyUrl(url) {
  return `/api/hls?url=${encodeURIComponent(url)}`;
}

function resolveUrl(value, base) {
  try {
    const resolved = new URL(value, base);

    if (!["http:", "https:"].includes(resolved.protocol)) {
      return null;
    }

    if (resolved.username || resolved.password) {
      return null;
    }

    return resolved.href;
  } catch {
    return null;
  }
}

function rewritePlaylist(playlist, baseUrl) {
  return playlist
    .split(/\r?\n/)
    .map(line => {
      const trimmed = line.trim();

      if (!trimmed) return line;

      // Rewrite URI="..." attributes in HLS tags:
      // EXT-X-KEY, EXT-X-MAP, EXT-X-MEDIA,
      // EXT-X-I-FRAME-STREAM-INF, etc.

      if (trimmed.startsWith("#")) {
        return line.replace(
          /URI="([^"]+)"/gi,
          (match, value) => {
            const absolute = resolveUrl(value, baseUrl);

            if (!absolute) return match;

            return `URI="${proxyUrl(absolute)}"`;
          }
        );
      }

      // Rewrite normal segment and playlist URLs.

      const absolute = resolveUrl(trimmed, baseUrl);

      if (!absolute) return line;

      return proxyUrl(absolute);
    })
    .join("\n");
}

// --------------------------------------------------
// Safe response headers
// --------------------------------------------------

function setCommonHeaders(res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    ALLOWED_ORIGIN
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, HEAD, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Range, Content-Type"
  );

  res.setHeader(
    "Vary",
    "Origin"
  );

  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  res.setHeader(
    "Cache-Control",
    "no-store"
  );
}

function setUpstreamHeaders(response, res) {
  const allowed = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified"
  ];

  for (const name of allowed) {
    const value = response.headers.get(name);

    if (value) {
      res.setHeader(name, value);
    }
  }
}

// --------------------------------------------------
// Main Vercel serverless handler
// --------------------------------------------------

export default async function handler(req, res) {
  setCommonHeaders(res);

  // CORS preflight
  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(req)) {
      return res.status(403).send("Forbidden");
    }

    return res.status(204).end();
  }

  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD, OPTIONS");
    return res.status(405).send("Method not allowed");
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).send("Forbidden");
  }

  const input = req.query?.url;

  if (
    typeof input !== "string" ||
    !input ||
    input.length > MAX_URL_LENGTH
  ) {
    return res.status(400).send("Invalid or missing URL");
  }

  let upstream;

  try {
    const target = await validateTarget(input);

    upstream = await fetchUpstream(target, req);

    if (!upstream.ok) {
      await upstream.body?.cancel();

      return res
        .status(upstream.status)
        .send("Upstream error");
    }

    // HEAD: return metadata without downloading the body.
    if (req.method === "HEAD") {
      setUpstreamHeaders(upstream, res);
      return res.status(upstream.status).end();
    }

    // HLS playlist
    if (isPlaylist(upstream, target)) {
      const playlist = await readPlaylist(upstream);

      const rewritten = rewritePlaylist(
        playlist,
        target.href
      );

      res.status(200);

      res.setHeader(
        "Content-Type",
        "application/vnd.apple.mpegurl"
      );

      res.setHeader(
        "Cache-Control",
        "no-store"
      );

      res.setHeader(
        "Content-Length",
        Buffer.byteLength(rewritten)
      );

      return res.send(rewritten);
    }

    // Video segments, audio segments, keys and other files.
    setUpstreamHeaders(upstream, res);

    res.status(upstream.status);

    if (!upstream.body) {
      return res.end();
    }

    // Stream directly; do not buffer large segments.
    const stream = Readable.fromWeb(upstream.body);

    res.on("close", () => {
      if (!res.writableEnded) {
        stream.destroy();
      }
    });

    await pipeline(stream, res);

  } catch (err) {
    if (upstream?.body) {
      await upstream.body.cancel().catch(() => {});
    }

    if (res.headersSent) {
      res.destroy(err);
      return;
    }

    const message = err?.message || "";

    if (
      message.includes("Blocked") ||
      message.includes("Unsupported") ||
      message.includes("Invalid URL") ||
      message.includes("DNS resolution")
    ) {
      return res.status(403).send("Destination blocked");
    }

    if (message.includes("too large")) {
      return res.status(413).send("Playlist too large");
    }

    if (message.includes("Too many redirects")) {
      return res.status(502).send("Redirect limit exceeded");
    }

    if (err?.name === "AbortError") {
      return res.status(504).send("Upstream timeout");
    }

    console.error("[BOSTAFLIX HLS]", err);

    return res.status(502).send("Proxy error");
  }
}
