export default async function handler(req, res) {
    try {
        const { id } = req.query;

        if (!id) {
            console.error("Missing 'id' parameter");
            return res.status(400).json({ error: "Missing 'id' parameter" });
        }

        const targetUrl = `https://inv-ca1-c.nadeko.net/latest_version?id=${encodeURIComponent(id)}&itag=18`;
        console.log(`Fetching: ${targetUrl}`);

        // Custom headers as requested
        const customHeaders = {
            "Accept": "*/*",
            "Accept-Encoding": "identity;q=1, *;q=0",
            "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Cookie": "INVIDIOUS_SERVER_ID=2",
            "DNT": "1",
            "Host": "inv-ca1-c.nadeko.net",
            "Pragma": "no-cache",
            "Range": "bytes=0-",
            "Sec-CH-UA": `"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"`,
            "Sec-CH-UA-Mobile": "?1",
            "Sec-CH-UA-Platform": `"Android"`,
            "Sec-Fetch-Dest": "video",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36"
        };

        // Fetch the content from the original URL with custom headers
        const response = await fetch(targetUrl, { headers: customHeaders });

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
