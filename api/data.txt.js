export default async function handler(req, res) {
export default async function handler(req, res) {

    // ---------------- CORS ----------------
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {

        // =========================
        // 1. DBC NEWS
        // =========================
        const dbcRes = await fetch("https://dbcnews.tv/api/articles?per-page=15");
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
                        title
                    }
                }`
            })
        });

        const somoyJson = await somoyRes.json();
        const somoyTitles = (somoyJson?.data?.topBreaking || [])
            .map(x => x.title)
            .filter(Boolean);

        // =========================
        // 3. CHANNEL24 BREAKING
        // =========================
        const chRes = await fetch("https://backoffice.channel24bd.tv/api/active-breaking");
        const chJson = await chRes.json();

        const chData =
            Array.isArray(chJson) ? chJson :
            chJson?.data ? chJson.data :
            [];

        const chTitles = chData
            .map(x => x.title)
            .filter(Boolean);

        // =========================
        // 4. MERGE
        // =========================
        const allTitles = [
            ...somoyTitles,
            ...chTitles,
            ...dbcTitles
        ].slice(0, 8);

        // =========================
        // 5. OUTPUT STRING ONLY
        // =========================
        let output;

        if (allTitles.length > 0) {
            output = "              শীর্ষ সংবাদ>> " + allTitles.join(" | ");
        } else {
            output = "              শীর্ষ সংবাদ>> BOSTAFLIX BDIX IPTV";
        }

        return res.status(200).send(output);

    } catch (error) {
        return res.status(500).send("শীর্ষ সংবাদ>>Server Error");
    }
}
