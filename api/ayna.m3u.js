import fs from "fs";
import path from "path";

const encodeB64 = (str) =>
    Buffer.from(str, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

function proxify(slug, url, channelObj = null, customExt = null) {
    if (!url) return "";

    // Don't proxy existing key URLs
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

    return `/api/key/${encodeB64(payload)}/${filename}`;
}

export default function handler(req, res) {
    try {
        const file = path.join(process.cwd(), "https://biostartvworld.pages.dev/akashgo.m3u");

        let m3u = fs.readFileSync(file, "utf8");

        const lines = m3u.split(/\r?\n/);

        let currentChannel = null;

        const output = lines.map((line) => {
            const trimmed = line.trim();

            // EXTINF line
            if (trimmed.startsWith("#EXTINF")) {
                const comma = trimmed.indexOf(",");

                let name = "";

                if (comma !== -1) {
                    name = trimmed.substring(comma + 1).trim();
                }

                currentChannel = {
                    name,
                    user_agent: "",
                    headers: {}
                };

                // Read tvg-id as slug if available
                const idMatch = trimmed.match(/tvg-id="([^"]+)"/i);

                if (idMatch) {
                    currentChannel.slug = idMatch[1];
                }

                // Read user-agent if present
                const uaMatch = trimmed.match(
                    /(?:user-agent|user_agent)="([^"]+)"/i
                );

                if (uaMatch) {
                    currentChannel.user_agent = uaMatch[1];
                }

                return line;
            }

            // Preserve comments/directives
            if (!trimmed || trimmed.startsWith("#")) {
                return line;
            }

            // This should be the stream URL
            if (
                trimmed.startsWith("http://") ||
                trimmed.startsWith("https://")
            ) {
                const slug =
                    currentChannel?.slug ||
                    currentChannel?.name ||
                    "channel";

                return proxify(slug, trimmed, currentChannel);
            }

            return line;
        });

        const result = output.join("\n");

        res.setHeader("Content-Type", "application/x-mpegURL; charset=utf-8");
        res.setHeader(
            "Cache-Control",
            "public, s-maxage=30, stale-while-revalidate=60"
        );
        res.status(200).send(result);
    } catch (err) {
        console.error(err);

        res.status(500).send(
            "#EXTM3U\n#ERROR Failed to generate playlist"
        );
    }
}
