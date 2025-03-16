import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Missing 'id' parameter" });
    }

    try {
        const targetUrl = `https://inv-ca1-c.nadeko.net/latest_version?id=${encodeURIComponent(id)}&itag=id`;

        // Fetch the URL but don't follow redirects
        const response = await fetch(targetUrl, { redirect: 'manual' });

        // Extract the actual redirected URL
        const location = response.headers.get('location');

        if (!location) {
            return res.status(500).json({ error: "No redirect URL found" });
        }

        // Redirect the user to the final URL
        res.writeHead(302, { Location: location });
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
}
