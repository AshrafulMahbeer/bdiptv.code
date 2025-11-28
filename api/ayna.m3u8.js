export default async function handler(req, res) {
  try {
    const response = await fetch("http://ayna-playlist.xfireflix.workers.dev/", {
      method: "GET",
      headers: {
        // VLC default headers
        "User-Agent": "VLC/3.0.16 LibVLC/3.0.16",
        "Accept": "*/*",
        "Connection": "keep-alive",
        "Icy-MetaData": "1"
      }
    });

    const text = await response.text();

    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(text);

  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
}
