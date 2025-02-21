export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send("Missing URL parameter");
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(500).send(`Failed to fetch M3U8 file: ${response.status} ${response.statusText}`);
        }
        
        let content = await response.text();
        let baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

        content = content.split('\n').map(line => {
            if (line.endsWith('.m3u8')) {
                return baseUrl + line;
            } else if (line.endsWith('.ts')) {
                return `https://allinonereborn.com/test.m3u8/ts.php?ts=${baseUrl}${line}`;
            }
            return line;
        }).join('\n');

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(content);
    } catch (error) {
        res.status(500).send(`Error processing M3U8 file: ${error.message}`);
    }
}
