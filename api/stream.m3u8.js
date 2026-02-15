export default function handler(req, res) {
  const SEGMENT_DURATION = 10;
  const WINDOW_SIZE = 3;
  const MAX_SEGMENTS = 166;

  const ANCHOR_TIME = new Date("2025-01-01T00:00:00Z").getTime();
  const now = Date.now();

  const elapsedSeconds = Math.floor((now - ANCHOR_TIME) / 1000);
  const segmentNumber = Math.floor(elapsedSeconds / SEGMENT_DURATION);

  const currentFile = segmentNumber % MAX_SEGMENTS;
  const mediaSequence = segmentNumber;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-MEDIA-SEQUENCE:${mediaSequence}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const fileIndex = (currentFile + i) % MAX_SEGMENTS;

    // Make each segment look like real broadcast time
    const programDateTime = new Date(
      ANCHOR_TIME + (segmentNumber + i) * SEGMENT_DURATION * 1000
    ).toISOString();

    playlist += `#EXT-X-PROGRAM-DATE-TIME:${programDateTime}\n`;
    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${fileIndex}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(playlist);
}
