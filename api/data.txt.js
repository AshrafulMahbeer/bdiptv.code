export default async function handler(req, res) {

    // ---------------- CORS ----------------
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {

        // =========================
        // 1. DBC NEWS ARTICLES
        // =========================
        const dbcRes = await fetch("https://dbcnews.tv/api/articles?per-page=15", {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const dbcJson = await dbcRes.json();

        const dbcTitles = (dbcJson || [])
            .slice(0, 5)
            .map(a => a?.title)
            .filter(Boolean);

        // =========================
        // 2. SOMOY BREAKING
        // =========================
        const somoyRes = await fetch("https://www.somoynews.tv/api/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                operationName: null,
                variables: {},
                query: `{
                    topBreaking(timeInHours: 48) {
                        _id
                        title
                    }
                }`
            })
        });

        const somoyJson = await somoyRes.json();
        const somoyData = somoyJson?.data?.topBreaking || [];

        const somoyTitles = somoyData.map(x => x.title).filter(Boolean);

        // =========================
        // 3. CHANNEL24 BREAKING
        // =========================
        const chRes = await fetch("https://backoffice.channel24bd.tv/api/active-breaking");
        const chJson = await chRes.json();

        const chData =
            Array.isArray(chJson) ? chJson :
            chJson?.data ? chJson.data :
            [];

        const chTitles = chData.map(x => x.title).filter(Boolean);

        // =========================
        // 4. MERGE ALL TITLES
        // =========================
        const allTitles = [
            ...somoyTitles,
            ...chTitles,
            ...dbcTitles
        ].slice(0, 8);

        // =========================
        // 5. BREAKING CHECK
        // =========================
        const isBreaking =
            somoyTitles.length > 0 ||
            chTitles.length > 0;

        // =========================
        // 6. OUTPUT FORMAT
        // =========================
        let outputText;

        if (allTitles.length > 0) {

            outputText = (isBreaking ? "🔴 ব্রেকিং নিউজ >> " : "") +
                allTitles.join(" | ");

        } else {

            outputText = "BOSTAFLIX BDIX IPTV";
        }

        // =========================
        // 7. RESPONSE
        // =========================
        return res.status(200).json({
            text: outputText,
            breaking: isBreaking,
            count: allTitles.length
        });

    } catch (error) {

        return res.status(500).json({
            error: "Server Error",
            message: error.message
        });
    }
}
