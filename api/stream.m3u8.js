export default function handler(req, res) {
  const SEGMENT_DURATION = 10;
  const WINDOW_SIZE = 6;
  const MAX_SEGMENTS = 203;

  const ANCHOR_TIME = new Date("2025-01-01T00:00:00Z").getTime();
  const now = Date.now();

  const elapsedSeconds = Math.floor((now - ANCHOR_TIME) / 1000);
  const segmentNumber = Math.floor(elapsedSeconds / SEGMENT_DURATION);

  // Sliding live window
  const firstSegment = segmentNumber - WINDOW_SIZE + 1;
  const mediaSequence = firstSegment;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MEDIA-SEQUENCE:${mediaSequence}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const segNum = firstSegment + i;

    // Handle negative start during very early time
    if (segNum < 0) continue;

    const fileIndex = segNum % MAX_SEGMENTS;

    // 🔥 CRITICAL FIX:
    // Insert discontinuity when loop wraps
    if (segNum > 0 && fileIndex === 0) {
      playlist += "#EXT-X-DISCONTINUITY\n";
    }

    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${fileIndex}.ts?v=${segNum}\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(playlist);
}
