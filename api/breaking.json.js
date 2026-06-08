export default async function handler(req, res) {
    try {

        // -------------------------------
        // 1. SOMOY GRAPHQL REQUEST
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
        // 2. CHANNEL24 REQUEST
        // -------------------------------
        const channelRes = await fetch("https://backoffice.channel24bd.tv/api/active-breaking");
        const channelJson = await channelRes.json();

        const channelData =
            Array.isArray(channelJson) ? channelJson :
            channelJson?.data ? channelJson.data :
            [];

        // -------------------------------
        // 3. CHECK IF ANY HAS DATA
        // -------------------------------
        const hasSomoy = somoyData.length > 0;
        const hasChannel = channelData.length > 0;

        let output;

        if (hasSomoy || hasChannel) {
            output = [
                "BREAKING NEWS",
                "BOSTAFLIX BDIX IPTV"
            ];
        } else {
            output = [
                "BOSTAFLIX BDIX IPTV"
            ];
        }

        // -------------------------------
        // 4. RESPONSE
        // -------------------------------
        return res.status(200).json(output);

    } catch (error) {
        return res.status(500).json({
            error: "Server Error",
            message: error.message
        });
    }
}
