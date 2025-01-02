// Vercel Serverless Function
export default async function handler(req, res) {
    const { id, e } = req.query; // Extract parameters from query string

    if (!id || !e) {
        return res.status(400).send("Missing required parameters: 'id' and 'e'");
    }

    // Construct the target URL
    const targetUrl = `https://mafiatv.live/youtube/live.php?id=${id}&e=${e}`;

    try {
        // Fetch the M3U8 file with the correct referer
        const response = await fetch(targetUrl, {
            headers: {
                Referer: "https://mafiatv.live",
            },
        });

        if (!response.ok) {
            return res.status(response.status).send("Failed to fetch M3U8 file");
        }

        // Get the M3U8 content
        const content = await response.text();

        // Process the content
        const processedContent = content.split("\n").map(line => {
            if (line.startsWith("#")) {
                // Comments or metadata lines; pass through
                return line;
            } else if (line.endsWith(".m3u8")) {
                // Proxy M3U8 URLs
                const fullUrl = new URL(line, targetUrl).href;
                return `https://bosta-live.vercel.app/api/proxy.m3u8?url=${encodeURIComponent(fullUrl)}`;
            } else if (line.endsWith(".ts")) {
                // Ensure full URLs for TS segments
                return new URL(line, targetUrl).href;
            } else {
                // Pass other lines through
                return line;
            }
        }).join("\n");

        // Return the modified M3U8 content
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        return res.status(200).send(processedContent);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal server error");
    }
}
