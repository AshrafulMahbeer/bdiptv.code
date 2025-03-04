export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Enable CORS
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    const defaultDuration = 6;
    const variation = 0.1;
    const version = 3;

    // ** Get Query Parameters **
    let server = req.query.server || "https://default.cdn.com";
    let path = req.query.path || "/defaultpath/";
    let duration = parseFloat(req.query.duration) || defaultDuration;
    let tzOffset = parseFloat(req.query.tz) || 0; // Timezone offset in hours

    // ** Validate duration (between 2 and 10 sec) **
    if (duration < 2 || duration > 10) duration = defaultDuration;

    // Ensure path ends with a `/`
    if (!path.endsWith("/")) path += "/";

    // Calculate current time with timezone offset
    let now = new Date();
    now.setHours(now.getHours() + tzOffset); // Adjust for timezone
    const formattedTime = now.toISOString().replace(/\.\d+Z$/, "Z"); // Format time

    // Sequence number changes based on time
    const sequence = Math.floor(Date.now() / (duration * 1000));

    // Generate 5 dynamic segments
    let segments = [];
    for (let i = 0; i < 5; i++) {
        let segmentDuration = (duration + (Math.random() * variation * 2 - variation)).toFixed(3);
        let segmentTime = new Date(now.getTime() - (i * duration * 1000));

        // Format timestamp as `YYYY/MM/DD/HH/mm/ss`
        let timestamp = segmentTime.toISOString().replace(/[-:T]/g, "/").split(".")[0];

        // Construct segment URL dynamically
        let segmentUrl = `${server}${path}${timestamp}-${segmentDuration.replace(".", "")}.ts`;

        segments.push(`#EXTINF:${segmentDuration},\n${segmentUrl}`);
    }

    // Construct the M3U8 playlist
    const playlist = `#EXTM3U
#EXT-X-TARGETDURATION:${Math.ceil(duration)}
#EXT-X-VERSION:${version}
#EXT-X-MEDIA-SEQUENCE:${sequence}
#EXT-X-PROGRAM-DATE-TIME:${formattedTime}
${segments.reverse().join("\n")}
`;

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(playlist);
}
