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

  const startSegment = absoluteSegment - WINDOW_SIZE + 1;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-MEDIA-SEQUENCE:${startSegment}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const abs = startSegment + i;

    let fileIndex = abs % MAX_SEGMENTS;

    // 🔥 Only modify file index during first 60s
    if (secondsFromHour < BRIDGE_SECONDS) {
      const previousHourBase =
        (absoluteSegment - Math.floor(secondsFromHour / SEGMENT_DURATION)) % MAX_SEGMENTS;

      fileIndex =
        (previousHourBase - (WINDOW_SIZE - 1 - i) + MAX_SEGMENTS) % MAX_SEGMENTS;
    }

    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${fileIndex}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(playlist);
}
