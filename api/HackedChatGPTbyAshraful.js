export default async function handler(req, res) {
    // Parse query parameters
    const { prompt = "default", cors = "strict-origin" } = req.query;

    // Construct the target URL
    const targetUrl = `http://fredflix.rf.gd/?prompt=${encodeURIComponent(prompt)}`;

    // Set CORS headers
    if (cors === "all-origin") {
        res.setHeader("Access-Control-Allow-Origin", "*");
    } else {
        res.setHeader("Access-Control-Allow-Origin", "strict-origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return res.status(204).end(); // No Content for preflight requests
    }

    try {
        // Fetch the target URL
        const response = await fetch(targetUrl, {
            method: req.method,
        });

        // Forward the response back to the client
        const data = await response.text();
        res.status(response.status).send(data);
    } catch (error) {
        // Handle errors
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Failed to proxy request" });
    }
}
