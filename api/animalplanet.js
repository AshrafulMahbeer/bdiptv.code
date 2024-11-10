// api/animal-planet-proxy.js

export default async function handler(req, res) {
    const { method } = req;

    if (method !== 'GET') {
        res.status(405).json({ message: 'Method not allowed' });
        return;
    }

    // Define the target URL and headers
    const targetUrl = "https://bldcmprod-cdn.toffeelive.com/cdn/live/animal_planet_sd/playlist.m3u8";
    const headers = {
        'Origin': 'https://bldcmprod-cdn.toffeelive.com',
        'Referer': 'https://toffeelive.com',
        'User-Agent': '', // Add a custom User-Agent if needed
        'Cookie': 'Edge-Cache-Cookie=URLPrefix=aHR0cHM6Ly9ibGRjbXByb2QtY2RuLnRvZmZlZWxpdmUuY29tLw:Expires=1731385031:KeyName=prod_linear:Signature=un5qvy2PA3DwfLcQVhjWPf_8n2o1buheTyGLuxplwYrKxE1Bnojyy1lEJmKPSJj7V2SrY21E7eFQ7QEBQdmcDw',
    };

    try {
        // Send the request to the target URL
        const response = await fetch(targetUrl, { headers });

        // Check if the request was successful
        if (!response.ok) {
            res.status(response.status).json({ message: 'Failed to fetch the stream' });
            return;
        }

        // Get the stream data and headers
        const data = await response.text();
        const contentType = response.headers.get('Content-Type');

        // Send the response back to the client with appropriate headers
        res.setHeader('Content-Type', contentType);
        res.status(200).send(data);
    } catch (error) {
        // Handle any errors
        console.error('Error fetching stream:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
