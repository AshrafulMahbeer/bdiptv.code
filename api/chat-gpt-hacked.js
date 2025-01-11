export default async function handler(req, res) {
    const { query, headers, method } = req;

    // Extract parameters
    const prompt = query.prompt || "default";
    const cors = query.cors || "strict-origin"; // Default to strict-origin if not provided

    // Determine the target URL
    const targetUrl = `http://fredflix.rf.gd/?prompt=${encodeURIComponent(prompt)}`;

    try {
        // Forward the request to the target URL
        const response = await fetch(targetUrl, {
            method,
            headers: {
                ...headers,
                Origin: cors === "all-origin" ? "*" : "strict-origin",
            },
        });

        // Retrieve the response
        const data = await response.text();

        // Set appropriate CORS headers in the response
        res.setHeader("Access-Control-Allow-Origin", cors === "all-origin" ? "*" : "strict-origin");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        // Send back the proxied response
        res.status(response.status).send(data);
    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Failed to proxy request" });
    }
}
