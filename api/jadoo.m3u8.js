export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Missing required query parameter: url');
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Referer': 'http://iptv.jadoodigital.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch the M3U8 file. Status: ${response.status} ${response.statusText}`);
            return res.status(response.status).send(`Failed to fetch the M3U8 file. Status: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/vnd.apple.mpegurl')) {
            console.error('Invalid content type:', contentType);
            return res.status(400).send('Provided URL does not point to a valid M3U8 file');
        }

        const m3u8Content = await response.text();
        const baseUrl = new URL(url);
        const lines = m3u8Content.split('\n');
        let proxiedContent = '';

        for (const line of lines) {
            if (line.trim() === '' || line.startsWith('#')) {
                // Keep comments and empty lines as is
                proxiedContent += line + '\n';
            } else if (line.endsWith('.m3u8')) {
                // Handle nested M3U8 files
                const nestedUrl = new URL(line, baseUrl).toString();
                const nestedResponse = await fetch(nestedUrl, {
                    headers: {
                        'Referer': 'http://iptv.jadoodigital.com',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (!nestedResponse.ok) {
                    console.error(`Failed to fetch nested M3U8 file. Status: ${nestedResponse.status} ${nestedResponse.statusText}`);
                    return res.status(nestedResponse.status).send(`Failed to fetch nested M3U8 file. Status: ${nestedResponse.status} ${nestedResponse.statusText}`);
                }

                const nestedContent = await nestedResponse.text();
                const nestedLines = nestedContent.split('\n');
                for (const nestedLine of nestedLines) {
                    if (nestedLine.trim() === '' || nestedLine.startsWith('#')) {
                        proxiedContent += nestedLine + '\n';
                    } else if (nestedLine.endsWith('.ts')) {
                        // Convert relative URLs to absolute
                        proxiedContent += new URL(nestedLine, nestedUrl).toString() + '\n';
                    } else {
                        proxiedContent += nestedLine + '\n';
                    }
                }
                break;
            } else if (line.endsWith('.ts')) {
                // Convert relative URLs to absolute
                proxiedContent += new URL(line, baseUrl).toString() + '\n';
            } else {
                proxiedContent += line + '\n';
            }
        }

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        return res.status(200).send(proxiedContent);
    } catch (error) {
        console.error('Error processing M3U8 file:', error.message);
        console.error(error.stack);
        return res.status(500).send('Internal Server Error: ' + error.message);
    }
}
