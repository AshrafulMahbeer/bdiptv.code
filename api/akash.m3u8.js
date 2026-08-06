export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).send("Missing url");
    }

    let target;
    try {
      target = new URL(url);
    } catch {
      return res.status(400).send("Invalid URL");
    }

    console.log("Fetching:", target.href);

    const upstream = await fetch(target.href, {
      redirect: "follow",
      headers: {
        Host: "owrcovcrpy.gpcdn.net",
        "edge-policy":
          "eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9vd3Jjb3ZjcnB5LmdwY2RuLm5ldC9icGstdHYvMTcxMS9vdXRwdXQvKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiRWRnZVRpbWUiOjE3ODU5OTYwNDN9fX1dfQ",
        "edge-signature":
          "x4TTwRqgxy5k4YK4CJ9wq0RxWRGoEQzqxtp9ZHgy~lA",
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    console.log("Final URL:", upstream.url);
    console.log("Status:", upstream.status);

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      if (
        ![
          "content-encoding",
          "content-length",
          "transfer-encoding",
          "connection"
        ].includes(key.toLowerCase())
      ) {
        res.setHeader(key, value);
      }
    });

    const body = Buffer.from(await upstream.arrayBuffer());
    res.send(body);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
      code: err.cause?.code,
      hostname: err.cause?.hostname,
      stack: err.stack
    });
  }
}
