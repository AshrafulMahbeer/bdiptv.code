export default function handler(req, res) {
  const SEGMENT_DURATION = 10;
  const WINDOW_SIZE = 6;
  const MAX_SEGMENTS = 165;

  const now = new Date();

  // Only calculate from top of hour
  const secondsFromHour =
    now.getMinutes() * 60 + now.getSeconds();

  const segmentNumber =
    Math.floor(secondsFromHour / SEGMENT_DURATION);

  const currentFile =
    segmentNumber % MAX_SEGMENTS;

  const startFile =
    (currentFile - WINDOW_SIZE + 1 + MAX_SEGMENTS) % MAX_SEGMENTS;

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-MEDIA-SEQUENCE:${segmentNumber - WINDOW_SIZE + 1}
`;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const fileIndex =
      (startFile + i) % MAX_SEGMENTS;

    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `https://raw.githubusercontent.com/AshrafulMahbeer/bosta-cdn/refs/heads/main/hls/${fileIndex}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(playlist);
}
