export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).send("Missing 'url' parameter.");
    return;
  }

  try {
    const targetUrl = new URL(url);
    const response = await fetch(targetUrl, {
      headers: {
        Referer: targetUrl.origin,
        "User-Agent": req.headers["user-agent"] || "default",
      },
    });

    if (!response.ok) {
      res.status(response.status).send("Failed to fetch the URL.");
      return;
    }

    const contentType = response.headers.get("content-type") || "";

    // Handle M3U8 files
    if (contentType.includes("application/vnd.apple.mpegurl") || url.endsWith(".m3u8")) {
      const originalM3U8 = await response.text();
      const processedM3U8 = originalM3U8
        .split("\n")
        .map((line) => {
          if (line.startsWith("#") || line.trim() === "") {
            return line;
          }
          const isTsFile = line.endsWith(".ts");
          return isTsFile
            ? new URL(line, targetUrl).href
            : `https://bosta-live.vercel.app/api/proxy.m3u8?url=${new URL(
                line,
                targetUrl
              ).href}`;
        })
        .join("\n");

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.send(processedM3U8);
    } 
    // Handle TS files
    else if (contentType.includes("video/mp2t") || url.endsWith(".ts")) {
      res.setHeader("Content-Type", "video/mp2t");
      response.body.pipe(res);
    } 
    // Handle unknown content types
    else {
      res.status(400).send("Invalid file type or unsupported URL.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
  }
}
