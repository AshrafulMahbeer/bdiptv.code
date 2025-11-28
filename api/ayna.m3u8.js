export default async function handler(req, res) {
  try {
    const response = await fetch("http://ayna-playlist.xfireflix.workers.dev/");
    const data = await response.text();

    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(data);

  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
}
