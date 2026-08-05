export default async function handler(req, res) {
  try {
    const { url, policy, signature } = req.query;

    if (!url || !policy || !signature) {
      return res.status(400).send("Missing url, policy or signature");
    }

    let target;

    try {
      target = new URL(url);
    } catch {
      return res.status(400).send("Invalid URL");
    }

    // Prevent this endpoint from becoming an open proxy.
    if (target.hostname !== "owrcovcrpy.gpcdn.net") {
      return res.status(403).send("Host not allowed");
    }

    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: {
        "edge-policy": String(policy),
        "edge-signature": String(signature),
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      },
      redirect: "follow"
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "");

      return res
        .status(upstream.status)
        .send(`Upstream HTTP ${upstream.status}\n${errorText.slice(0, 500)}`);
    }

    const contentType =
      upstream.headers.get("content-type") || "";

    const isPlaylist =
      target.pathname.endsWith(".m3u8") ||
      contentType.includes("mpegurl") ||
      contentType.includes("application/vnd.apple.mpegurl");

    if (!isPlaylist) {
      // Binary stream/segment
      const buffer = Buffer.from(await upstream.arrayBuffer());

      res.setHeader(
        "Content-Type",
        contentType || "video/mp2t"
      );

      res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
      );

      res.setHeader(
        "Cache-Control",
        "no-store"
      );

      return res.status(200).send(buffer);
    }

    // HLS playlist
    let playlist = await upstream.text();

    const base = new URL("./", target);

    const rewritten = playlist
      .split(/\r?\n/)
      .map(line => {
        const trimmed = line.trim();

        if (!trimmed) {
          return line;
        }

        // Normal URI line:
        // segment_001.ts
        if (!trimmed.startsWith("#")) {
          try {
            const absolute = new URL(trimmed, base).href;

            return makeProxyUrl(
              absolute,
              policy,
              signature
            );
          } catch {
            return line;
          }
        }

        // Handle URI="..." inside HLS tags such as:
        // #EXT-X-KEY:URI="..."
        // #EXT-X-MAP:URI="..."
        if (trimmed.includes('URI="')) {
          return trimmed.replace(
            /URI="([^"]+)"/g,
            (_, uri) => {
              try {
                const absolute = new URL(uri, base).href;

                return `URI="${makeProxyUrl(
                  absolute,
                  policy,
                  signature
                )}"`;
              } catch {
                return `URI="${uri}"`;
              }
            }
          );
        }

        return line;
      })
      .join("\n");

    res.setHeader(
      "Content-Type",
      "application/vnd.apple.mpegurl"
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return res.status(200).send(rewritten);

  } catch (err) {
    console.error("PROXY ERROR:", err);

    return res
      .status(500)
      .send(
        "Proxy crashed: " +
        (err?.message || String(err))
      );
  }
}


function makeProxyUrl(url, policy, signature) {
  return (
    "/api/proxy" +
    "?url=" + encodeURIComponent(url) +
    "&policy=" + encodeURIComponent(policy) +
    "&signature=" + encodeURIComponent(signature)
  );
}
