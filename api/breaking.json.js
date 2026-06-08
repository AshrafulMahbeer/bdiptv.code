export default async function handler(req, res) {

    // -------------------------------
    // CORS HEADERS (IMPORTANT)
    // -------------------------------
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight request (CORS)
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {

        // -------------------------------
        // SOMOY GRAPHQL
        // -------------------------------
        const somoyRes = await fetch("https://www.somoynews.tv/api/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                operationName: null,
                variables: {},
                query: `{
                    topBreaking(timeInHours: 48) {
                        _id
                        title
                        link
                        status
                        createdAt
                    }
                }`
            })
        });

        const somoyJson = await somoyRes.json();
        const somoyData = somoyJson?.data?.topBreaking || [];

        // -------------------------------
        // CHANNEL24 API
        // -------------------------------
        const channelRes = await fetch("https://backoffice.channel24bd.tv/api/active-breaking");
        const channelJson = await channelRes.json();

        const channelData =
            Array.isArray(channelJson) ? channelJson :
            channelJson?.data ? channelJson.data :
            [];

        // -------------------------------
        // LOGIC
        // -------------------------------
        const hasData = somoyData.length > 0 || channelData.length > 0;

        const output = hasData
            ? ["BREAKING NEWS", "BOSTAFLIX BDIX IPTV"]
            : ["BOSTAFLIX BDIX IPTV"];

        // -------------------------------
        // RESPONSE
        // -------------------------------
        return res.status(200).json(output);

    } catch (error) {

        return res.status(500).json({
            error: "Server Error",
            message: error.message
        });
    }
}
