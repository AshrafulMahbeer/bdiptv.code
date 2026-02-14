export default function handler(req, res) {
  const SEGMENT_DURATION = 10;
  const WINDOW_SIZE = 6;
  const MAX_SEGMENTS = 165;
  const BRIDGE_SECONDS = 60;

  const now = new Date();

  const secondsFromMidnight =
    now.getHours() * 3600 +
    now.getMinutes() * 60 +
    now.getSeconds();

  const absoluteSegment = Math.floor(secondsFromMidnight / SEGMENT_DURATION);

  const secondsFromHour =
    now.getMinutes() * 60 + now.getSeconds();

  let effectiveSegment = absoluteSegment;

  // 🔥 ONLY adjust during first 60 seconds
  if (secondsFromHour < BRIDGE_SECONDS) {

    // How many segments have passed in this hour?
    const hourSegment = Math.floor(secondsFromHour / SEGMENT_DURATION);

    // Subtract ONLY that amount
    effectiveSegment = absoluteSegment - hourSegment;
  }

  const startSegment = effectiveSegment - WINDOW_SIZE + 1;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-MEDIA-SEQUENCE:${startSegment}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const abs = startSegment + i;

    const fileIndex =
      ((abs % MAX_SEGMENTS) + MAX_SEGMENTS) % MAX_SEGMENTS;

    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${fileIndex}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(playlist);
}
