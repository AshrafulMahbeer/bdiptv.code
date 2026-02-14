export default function handler(req, res) {
  const SEGMENT_DURATION = 10;   // seconds
  const WINDOW_SIZE = 6;         // segments in playlist
  const MAX_SEGMENTS = 166;      // files 0–164
  const BRIDGE_SECONDS = 60;     // 60s smoothing

  const now = new Date();

  // ✅ ONLY hour-based clock
  const secondsFromHour =
    now.getMinutes() * 60 + now.getSeconds();

  const segmentInHour =
    Math.floor(secondsFromHour / SEGMENT_DURATION);

  // Absolute timeline inside hour only
  const absoluteSegment = segmentInHour;

  // Base file index (normal running)
  let baseFileIndex = absoluteSegment % MAX_SEGMENTS;

  // --------------------------------------------------
  // 🔥 BRIDGE 1: First 60 seconds of hour
  // Continue from previous hour position smoothly
  // --------------------------------------------------
  if (secondsFromHour < BRIDGE_SECONDS) {
    const segmentsPassed =
      Math.floor(secondsFromHour / SEGMENT_DURATION);

    baseFileIndex =
      (MAX_SEGMENTS - (WINDOW_SIZE - segmentsPassed)) % MAX_SEGMENTS;
  }

  // --------------------------------------------------
  // 🔥 BRIDGE 2: When loop wraps (164 → 0)
  // Smooth for 60 seconds
  // --------------------------------------------------
  const previousIndex =
    (absoluteSegment - 1 + MAX_SEGMENTS) % MAX_SEGMENTS;

  const wrapped =
    baseFileIndex < previousIndex;

  if (wrapped && secondsFromHour >= BRIDGE_SECONDS) {
    // Hold last sequence naturally
    baseFileIndex =
      (previousIndex + 1) % MAX_SEGMENTS;
  }

  // --------------------------------------------------
  // Build Playlist
  // --------------------------------------------------

  const startSequence = absoluteSegment - WINDOW_SIZE + 1;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-MEDIA-SEQUENCE:${startSequence}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const fileIndex =
      (baseFileIndex - (WINDOW_SIZE - 1 - i) + MAX_SEGMENTS) % MAX_SEGMENTS;

    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${fileIndex}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.status(200).send(playlist);
}
