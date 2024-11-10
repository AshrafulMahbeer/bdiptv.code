export default async function handler(req, res) {
    const { query } = req; // Access query parameters
    const { cookie, drmLicense, drmScheme, link, logo, name, referer, referrer, userAgent } = req.body;

    // Construct the actual target URL using query parameters
    const targetUrl = link || `https://tvs1.aynaott.com/bz/durontotv/index.m3u8?hdnts=st=1731239578~exp=1731282778~acl=/durontotv/*~data=103.7.121.253-WEB~hmac=51d91716372b79eaf7115ea2997a30fbe29101eb43a9719afedc9f6d119b378b${query.duronto || 'index'}.m3u8`;

    try {
        // Fetch the resource from the specified target URL with custom headers
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Referer': referer || referrer || 'https://watch.aynaott.com/',
                'User-Agent': userAgent || 'Mozilla/5.0',
                'Cookie': cookie || ':',
                'drm-license': drmLicense || ':',
                'drm-scheme': drmScheme || ':'
            }
        });

        // Check if response is okay, else send an error message
        if (!response.ok) {
            throw new Error(`Failed to fetch the resource. Status: ${response.status}`);
        }

        // Stream the response back to the client
        const data = await response.arrayBuffer();
        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        res.setHeader('Content-Length', response.headers.get('Content-Length') || data.byteLength);
        res.status(response.status).send(Buffer.from(data));
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}
