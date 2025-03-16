export default async function handler(req, res) {
    try {
        const { id } = req.query;

        if (!id) {
            console.error("Missing 'id' parameter");
            return res.status(400).json({ error: "Missing 'id' parameter" });
        }

        const targetUrl = `https://inv-ca1-c.nadeko.net/latest_version?id=${encodeURIComponent(id)}&itag=id`;
        console.log(`Fetching: ${targetUrl}`);

        // Fetch the original content
        const response = await fetch(targetUrl);

        if (!response.ok) {
            console.error(`Error fetching ${targetUrl}: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ error: `Fetch error: ${response.statusText}` });
        }

        // Read body as ArrayBuffer and send it as a Buffer
        const body = await response.arrayBuffer();
        res.status(response.status).send(Buffer.from(body));

    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
