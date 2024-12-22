export default async function handler(req, res) {
    const fetch = await import('node-fetch'); // Use fetch API in Node.js

    const url = "https://api.jadoodigital.com/api/v2.1/user/channel/duronto_tv";

    const headers = {
        "Referer": "https://iptv.jadoodigital.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    };

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            return res.status(response.status).json({ error: "Failed to fetch the file." });
        }

        const data = await response.json(); // Or response.text() for plain text
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred.", details: error.message });
    }
}
