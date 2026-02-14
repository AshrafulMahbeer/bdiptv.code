export default function handler(req, res) {
  const SEGMENT_DURATION = 10;   // seconds
  const WINDOW_SIZE = 6;         // playlist window size
  const MAX_SEGMENTS = 166;      // 0–164 files
  const BRIDGE_SECONDS = 60;     // smooth bridge time

  const now = new Date();

  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const secondsFromHour = minutes * 60 + seconds;

  const segmentsPerHour = Math.floor(3600 / SEGMENT_DURATION);

  // Absolute segment counter since midnight (continuous)
  const secondsFromMidnight =
    now.getHours() * 3600 +
    now.getMinutes() * 60 +
    now.getSeconds();

  const absoluteSegment = Math.floor(secondsFromMidnight / SEGMENT_DURATION);

  // Detect hour boundary bridge
  const inHourBridge = secondsFromHour < BRIDGE_SECONDS;

  // Detect file loop bridge (when wrapping MAX_SEGMENTS)
  const fileIndex = absoluteSegment % MAX_SEGMENTS;
  const previousFileIndex = (absoluteSegment - 1) % MAX_SEGMENTS;

  const loopJustWrapped =
    fileIndex < previousFileIndex;

  let effectiveSegment = absoluteSegment;

  // 🔥 Hour Bridge
  if (inHourBridge) {
    effectiveSegment =
      absoluteSegment - segmentsPerHour;
  }

  // 🔥 Loop Bridge
  if (loopJustWrapped && secondsFromHour < BRIDGE_SECONDS) {
    effectiveSegment =
      absoluteSegment - MAX_SEGMENTS;
  }

  const startSegment = effectiveSegment - WINDOW_SIZE + 1;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-MEDIA-SEQUENCE:${startSegment}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const abs = startSegment + i;
    const safeIndex =
      ((abs % MAX_SEGMENTS) + MAX_SEGMENTS) % MAX_SEGMENTS;

    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${safeIndex}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.status(200).send(playlist);
}
