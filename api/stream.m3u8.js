export default function handler(req, res) {
  const SEGMENT_DURATION = 10;     // seconds
  const WINDOW_SIZE = 6;           // segments in playlist
  const MAX_SEGMENTS = 166;        // 0–164 files

  // 🔥 Fixed anchor time (DO NOT CHANGE after deploy)
  const ANCHOR_TIME = new Date("2025-01-01T00:00:00Z").getTime();

  const now = Date.now();

  const elapsedSeconds =
    Math.floor((now - ANCHOR_TIME) / 1000);

  const segmentNumber =
    Math.floor(elapsedSeconds / SEGMENT_DURATION);

  const currentFile =
    segmentNumber % MAX_SEGMENTS;

  const startSequence =
    segmentNumber - WINDOW_SIZE + 1;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-MEDIA-SEQUENCE:${startSequence}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const fileIndex =
      (currentFile - (WINDOW_SIZE - 1 - i) + MAX_SEGMENTS) % MAX_SEGMENTS;

    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${fileIndex}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(playlist);
}
