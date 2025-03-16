export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing 'id' parameter" });
    }

    try {
        const targetUrl = `https://inv-ca1-c.nadeko.net/latest_version?id=${encodeURIComponent(id)}&itag=id`;

        // Fetch the content from the original URL
        const response = await fetch(targetUrl);

        // Forward the response headers
        response.headers.forEach((value, name) => res.setHeader(name, value));

        // Stream the response body
        res.status(response.status);
        response.body.pipe(res);
        
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
}
