export default async function handler(req, res) {
  const id = String(req.query.id || "");

  if (!id) {
    return res.status(400).send("Missing channel id");
  }

  const playlistUrl = "https://biostartvworld.pages.dev/akashgo.m3u";

  let response;

  try {
    response = await fetch(playlistUrl, {
      cache: "no-store"
    });
  } catch (err) {
    return res.status(502).send("Failed to fetch akashgo.m3u");
  }

  if (!response.ok) {
    return res
      .status(502)
      .send(`akashgo.m3u returned HTTP ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const extinf = lines[i].trim();

    if (!extinf.startsWith("#EXTINF")) continue;

    const idMatch = extinf.match(/tvg-id="([^"]+)"/);

    if (!idMatch || idMatch[1] !== id) {
      continue;
    }

    const httpLine = (lines[i + 1] || "").trim();
    const url = (lines[i + 2] || "").trim();

    if (!httpLine.startsWith("#EXTHTTP:")) {
      return res.status(502).send("Credentials not found");
    }

    if (!/^https?:\/\//i.test(url)) {
      return res.status(502).send("Stream URL not found");
    }

    let credentials;

    try {
      credentials = JSON.parse(
        httpLine.substring("#EXTHTTP:".length)
      );
    } catch {
      return res.status(502).send("Invalid EXTHTTP JSON");
    }

    const edgePolicy = credentials["edge-policy"];
    const edgeSignature = credentials["edge-signature"];

    if (!edgePolicy || !edgeSignature) {
      return res.status(502).send("Missing edge credentials");
    }

    const proxyUrl =
      `/api/proxy?url=${encodeURIComponent(url)}` +
      `&policy=${encodeURIComponent(edgePolicy)}` +
      `&signature=${encodeURIComponent(edgeSignature)}`;

    return res.redirect(302, proxyUrl);
  }

  return res.status(404).send("Channel not found");
}
