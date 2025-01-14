export default function handler(req, res) {
  const now = new Date();

  // Helper function to generate EXTINF lines
  const generateExtinf = (timestamp, duration) => {
    const timePart = timestamp.toISOString().replace(/[-:.TZ]/g, '/').slice(0, -4); // Matches format YYYY/MM/DD/HH/MM/SS
    const filename = `https://mtv.sunplex.live/MAASRANGA-TV/tracks-v1a1/${timePart}-${String(duration.toFixed(3)).replace('.', '').padStart(6, '')}.ts`;
    return `#EXTINF:${duration.toFixed(3)},\n${filename}`;
  };

  // Generate playlist content
  const durations = [1.200, 1.200, 1.200, 1.201]; // Example segment durations
  const targetDuration = Math.max(...durations); // Target duration
  const sequence = 5302088; // Start sequence number

  const playlist = [
    "#EXTM3U",
    `#EXT-X-TARGETDURATION:${Math.ceil(targetDuration)}`,
    "#EXT-X-VERSION:3",
    `#EXT-X-MEDIA-SEQUENCE:${sequence}`,
    `#EXT-X-PROGRAM-DATE-TIME:${now.toISOString()}`
  ];

  durations.forEach((duration, index) => {
    const timestamp = new Date(now.getTime() + index * duration * 1000); // Increment timestamp for each segment
    playlist.push(generateExtinf(timestamp, duration));
  });

  // Join playlist into the final response
  const responseContent = playlist.join("\n");

  // Set headers for M3U8 format
  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.status(200).send(responseContent);
}
