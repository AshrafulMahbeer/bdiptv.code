export default async function handler(req, res) {
  const target = req.query.url;
  const policy = req.query.policy;
  const signature = req.query.signature;

  if (!target || !policy || !signature) {
    return res.status(400).send("Missing proxy parameters");
  }

  let upstream;

  try {
    upstream = new URL(target);
  } catch {
    return res.status(400).send("Invalid URL");
  }

  // Basic SSRF protection: only allow the expected CDN.
  if (upstream.hostname !== "owrcovcrpy.gpcdn.net") {
    return res.status(403).send("Host not allowed");
  }

  const response = await fetch(upstream, {
    headers: {
      "edge-policy": policy,
      "edge-signature": signature
    }
  });

  if (!response.ok) {
    return res
      .status(response.status)
      .send(`Upstream returned ${response.status}`);
  }

  const contentType =
    response.headers.get("content-type") ||
    "application/vnd.apple.mpegurl";

  let body = await response.text();

  // Rewrite HLS URLs through our proxy.
  const base = new URL(".", upstream);

  body = body
    .split("\n")
    .map(line => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return line;
      }

      let absolute;

      try {
        absolute = new URL(trimmed, base).href;
      } catch {
        return line;
      }

      return (
        "/api/proxy" +
        "?url=" + encodeURIComponent(absolute) +
        "&policy=" + encodeURIComponent(policy) +
        "&signature=" + encodeURIComponent(signature)
      );
    })
    .join("\n");

  res.setHeader("Content-Type", contentType);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).send(body);
}
