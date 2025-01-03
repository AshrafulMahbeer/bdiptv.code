export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Missing required query parameter: url');
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch the M3U8 file');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType.includes('application/vnd.apple.mpegurl')) {
            return res.status(400).send('Provided URL does not point to a valid M3U8 file');
        }

        const m3u8Content = await response.text();
        const lines = m3u8Content.split('\n');
        let proxiedContent = '';

        for (const line of lines) {
            if (line.trim() === '' || line.startsWith('#')) {
                // Keep comments and empty lines as is
                proxiedContent += line + '\n';
            } else if (line.endsWith('.m3u8')) {
                // Handle nested M3U8 files
                const nestedResponse = await fetch(new URL(line, url).toString());

                if (!nestedResponse.ok) {
                    return res.status(nestedResponse.status).send('Failed to fetch nested M3U8 file');
                }

                proxiedContent += await nestedResponse.text();
                break;
            } else if (line.endsWith('.ts')) {
                // Media files (do not resolve them, just proxy the M3U8)
                proxiedContent += line + '\n';
            } else {
                proxiedContent += line + '\n';
            }
        }

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        return res.status(200).send(proxiedContent);
    } catch (error) {
        console.error('Error processing M3U8 file:', error);
        return res.status(500).send('Internal Server Error');
    }
}
