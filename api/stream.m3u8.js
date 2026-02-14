export default function handler(req, res) {
  const SEGMENT_DURATION = 10;   // seconds
  const WINDOW_SIZE = 6;         // playlist window
  const MAX_SEGMENTS = 165;      // 0–164

  const now = new Date();

  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const secondsFromHour = minutes * 60 + seconds;

  // Current hour absolute segment
  const currentHourSegment = Math.floor(secondsFromHour / SEGMENT_DURATION);

  // Previous hour final segment position
  const segmentsPerHour = Math.floor(3600 / SEGMENT_DURATION); // 360 if 10s
  const previousHourFinal = segmentsPerHour - 1;

  let baseSegment;

  // 🔥 BRIDGE MODE (first 60 seconds)
  if (secondsFromHour < 60) {
    const carryOffset = Math.floor(secondsFromHour / SEGMENT_DURATION);
    baseSegment = previousHourFinal + carryOffset + 1;
  } else {
    baseSegment = currentHourSegment;
  }

  const startSegment = baseSegment - WINDOW_SIZE + 1;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-MEDIA-SEQUENCE:${startSegment}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const absSegment = startSegment + i;
    const fileIndex = ((absSegment % MAX_SEGMENTS) + MAX_SEGMENTS) % MAX_SEGMENTS;

    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${fileIndex}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.status(200).send(playlist);
}
