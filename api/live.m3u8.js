export default function handler(req, res) {
    const targetDuration = 6;
    const variation = 0.1;
    const version = 3;
    const sequence = Math.floor(Date.now() / 6000); // Change every 6 secs
    const now = new Date();
    const formattedTime = now.toISOString().replace(/\.\d+Z$/, "Z"); // Format time

    // ** Get Custom Prefix from Query Parameters **
    let server = req.query.server || "https://default.cdn.com";
    let path = req.query.path || "/defaultpath/";

    // Ensure path ends with a `/`
    if (!path.endsWith("/")) path += "/";

    // Generate 5 dynamic segments
    let segments = [];
    for (let i = 0; i < 5; i++) {
        let duration = (targetDuration + (Math.random() * variation * 2 - variation)).toFixed(3);
        let segmentTime = new Date(now.getTime() - (i * targetDuration * 1000));
        let timestamp = segmentTime.toISOString().replace(/[-:T]/g, "/").split(".")[0];

        // Construct segment URL dynamically
        let segmentUrl = `${server}${path}${timestamp}-${duration.replace(".", "")}.ts`;

        segments.push(`#EXTINF:${duration},\n${segmentUrl}`);
    }

    // Construct the M3U8 playlist
    const playlist = `#EXTM3U
#EXT-X-TARGETDURATION:${targetDuration}
#EXT-X-VERSION:${version}
#EXT-X-MEDIA-SEQUENCE:${sequence}
#EXT-X-PROGRAM-DATE-TIME:${formattedTime}
${segments.reverse().join("\n")}
`;

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(playlist);
}
