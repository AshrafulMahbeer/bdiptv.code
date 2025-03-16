export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing 'id' parameter" });
    }

    try {
        const targetUrl = `https://inv-ca1-c.nadeko.net/latest_version?id=${encodeURIComponent(id)}&itag=id`;

        // Fetch URL without following redirects
        const response = await fetch(targetUrl, { method: 'HEAD' });

        // Get the redirected URL from the Location header
        const location = response.headers.get('location');

        if (!location) {
            return res.status(500).json({ error: "No redirect URL found" });
        }

        // Redirect user to the final location
        res.writeHead(302, { Location: location });
        res.end();

    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
}
