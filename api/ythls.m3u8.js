async function fetchM3U8(url, isFinal = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch M3U8 file: ${response.status} ${response.statusText}`);
        }
        let content = await response.text();
        let baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

        content = await Promise.all(
            content.split('\n').map(async line => {
                if (line.endsWith('.m3u8')) {
                    return await fetchM3U8(baseUrl + line, true);
                }
                return line;
            })
        );

        if (isFinal) {
            content = content.map(line => {
                if (line.endsWith('.ts')) {
                    return `https://allinonereborn.com/test.m3u8/ts.php?ts=${baseUrl}${line}`;
                }
                return line;
            });
        }

        return content.join('\n');
    } catch (error) {
        throw new Error(`Error processing M3U8 file: ${error.message}`);
    }
}

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send("Missing URL parameter");
    }

    try {
        const modifiedContent = await fetchM3U8(url, true);
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(modifiedContent);
    } catch (error) {
        res.status(500).send(error.message);
    }
}
