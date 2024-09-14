// api/fetch-m3u8.js
import axios from 'axios';

export default async function handler(req, res) {
    const m3u8Url = req.query.url; // Get the URL from the query parameter

    try {
        const response = await axios.get(m3u8Url, {
            headers: {
                'Content-Type': 'application/vnd.apple.mpegurl',
            },
        });

        // Allow cross-origin requests
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.status(200).send(response.data);
    } catch (error) {
        console.error('Error fetching m3u8 file:', error.message);
        res.status(500).send('Failed to fetch m3u8 file');
    }
}
