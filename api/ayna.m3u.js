const SOURCE =
    "https://biostartvworld.pages.dev/akashgo.m3u";

function encodeB64(str) {
    return Buffer.from(str, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function proxify(slug, url, isFallback = false, channelObj = null, customExt = null) {
    if (!url) return "";

    if (url.includes("/api/key/")) {
        return url;
    }

    const lower = url.toLowerCase();

    const ext =
        customExt ||
        (lower.includes(".mpd")
            ? ".mpd"
            : lower.includes(".mp4")
            ? ".mp4"
            : lower.includes(".mp3")
            ? ".mp3"
            : ".m3u8");

    let payload = url;

    if (channelObj) {
        payload =
            url +
            "|||" +
            (channelObj.user_agent || "") +
            "|||" +
            JSON.stringify(channelObj.headers || {});
    }

    let filename = (slug || "channel") + ext;

    try {
        const urlObj = new URL(url.split("?")[0]);
        const pathname = urlObj.pathname;
        const fn = pathname.substring(pathname.lastIndexOf("/") + 1);

        if (fn) {
            filename = fn;
        }
    } catch (e) {}

    /*
     * Don't use window.location.origin in Vercel.
     * The hostname comes from the request.
     */
    return `/api/key/${encodeB64(payload)}/${filename}`;
}

export default async function handler(req, res) {
    try {
        const response = await fetch(SOURCE, {
            headers: {
                "User-Agent": "Mozilla/5.0"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            return res
                .status(response.status)
                .send("Unable to fetch source playlist");
        }

        const playlist = await response.text();

        /*
         * For authorized/non-DRM playlists, process the URLs here.
         *
         * The source playlist can contain:
         * #EXTINF
         * #KODIPROP
         * #EXTHTTP
         * stream URL
         *
         * Those directive lines are left untouched.
         */

        const lines = playlist.split(/\r?\n/);

        let currentChannel = null;

        const output = lines.map((line) => {
            const trimmed = line.trim();

            if (trimmed.startsWith("#EXTINF")) {
                const comma = trimmed.indexOf(",");

                const name =
                    comma >= 0
                        ? trimmed.substring(comma + 1).trim()
                        : "channel";

                const idMatch =
                    trimmed.match(/tvg-id="([^"]+)"/i);

                currentChannel = {
                    name,
                    slug: idMatch
                        ? idMatch[1]
                        : name,
                    user_agent: "",
                    headers: {}
                };

                return line;
            }

            /*
             * Preserve all M3U/Kodi directives.
             */
            if (
                !trimmed ||
                trimmed.startsWith("#")
            ) {
                return line;
            }

            /*
             * Stream URL.
             *
             * For a playlist that you are authorized to proxy,
             * proxify() can be applied here.
             */
            if (
                trimmed.startsWith("http://") ||
                trimmed.startsWith("https://")
            ) {
                /*
                 * Intentionally leave the source URL unchanged
                 * for the Widevine-protected Akash Go playlist.
                 *
                 * For your own/non-DRM stream:
                 *
                 * return proxify(
                 *     currentChannel?.slug || "channel",
                 *     trimmed,
                 *     false,
                 *     currentChannel
                 * );
                 */
                return trimmed;
            }

            return line;
        });

        const result = output.join("\n");

        res.status(200);

        res.setHeader(
            "Content-Type",
            "application/x-mpegURL; charset=utf-8"
        );

        res.setHeader(
            "Access-Control-Allow-Origin",
            "*"
        );

        res.setHeader(
            "Cache-Control",
            "public, s-maxage=30, stale-while-revalidate=60"
        );

        return res.send(result);

    } catch (error) {
        console.error(error);

        return res
            .status(500)
            .send("#EXTM3U\n#ERROR Source unavailable");
    }
}
