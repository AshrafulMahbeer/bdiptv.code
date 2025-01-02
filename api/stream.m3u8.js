export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Only GET requests are allowed");
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).send("Missing 'url' query parameter");
  }

  try {
    // Fetch the m3u8 file content
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(500).send("Failed to fetch the m3u8 file");
    }

    const content = await response.text();

    // Remove occurrences of "php" from the m3u8 file lines
    const updatedContent = content
      .split("\n")
      .map(line => line.replace(/php/g, ""))
      .join("\n");

    // Send the modified m3u8 file content as a response
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(updatedContent);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing the m3u8 file");
  }
}
