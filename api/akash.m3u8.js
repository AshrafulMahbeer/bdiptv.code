export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing url");
  }

  const upstream = await fetch(url, {
   headers: {
        "edge-policy":
          "eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9vd3Jjb3ZjcnB5LmdwY2RuLm5ldC9icGstdHYvMTcxMS9vdXRwdXQvKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiRWRnZVRpbWUiOjE3ODU5OTYwNDN9fX1dfQ",
        "edge-signature":
          "x4TTwRqgxy5k4YK4CJ9wq0RxWRGoEQzqxtp9ZHgy~lA",
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
