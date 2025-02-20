export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send("Missing video ID");
  }

  const webpageUrl = `https://inv.nadeko.net/watch?v=${id}`; // Replace with the actual webpage URL
  
  try {
    const response = await fetch(webpageUrl);
    const html = await response.text();
    
    const match = html.match(/<source src="(.*?)" type="application\/x-mpegURL"/);
    
    if (match && match[1]) {
      let redirectLink = match[1];
      
      // If the link is relative, add the origin URL
      if (!redirectLink.startsWith("http")) {
        const url = new URL(webpageUrl);
        redirectLink = url.origin + redirectLink;
      }
      
      res.redirect(302, redirectLink);
    } else {
      res.status(404).send("Stream link not found");
    }
  } catch (error) {
    res.status(500).send("Error fetching webpage");
  }
}
