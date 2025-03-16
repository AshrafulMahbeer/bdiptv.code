export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing 'id' parameter" });
    }

    try {
        const targetUrl = `https://inv-ca1-c.nadeko.net/latest_version?id=${encodeURIComponent(id)}&itag=id`;

        // Fetch the content from the original URL
        const response = await fetch(targetUrl);

        // Copy status code from the origin response
        res.status(response.status);

        // Copy headers from the origin response
        response.headers.forEach((value, name) => res.setHeader(name, value));

        // Read body as ArrayBuffer and send it as a Buffer
        const body = await response.arrayBuffer();
        res.send(Buffer.from(body));

    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
}
