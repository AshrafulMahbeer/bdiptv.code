export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing url");
  }

  const upstream = await fetch(url, {
    headers: {
      "edge-policy": "YOUR_EDGE_POLICY",
      "edge-signature": "YOUR_EDGE_SIGNATURE",
      "User-Agent": "Mozilla/5.0"
    }
  });

  res.status(upstream.status);

  upstream.headers.forEach((value, key) => {
    if (
      !["content-encoding", "content-length", "transfer-encoding"].includes(
        key.toLowerCase()
      )
    ) {
      res.setHeader(key, value);
    }
  });

  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.send(buffer);
}
