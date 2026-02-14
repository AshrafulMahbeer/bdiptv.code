export default function handler(req, res) {
  const SEGMENT_DURATION = 6;      // seconds
  const WINDOW_SIZE = 10;          // number of segments in playlist
  const MAX_SEGMENTS = 300;        // loop after 300 segments

  const now = new Date();
  const secondsFromHour =
    now.getMinutes() * 60 + now.getSeconds();

  const segmentIndex = Math.floor(secondsFromHour / SEGMENT_DURATION);
  const currentSegment = segmentIndex % MAX_SEGMENTS;

  const startSegment = Math.max(0, currentSegment - WINDOW_SIZE + 1);

  let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-MEDIA-SEQUENCE:${startSegment}
`;

  for (let i = startSegment; i <= currentSegment; i++) {
    playlist += `#EXTINF:${SEGMENT_DURATION}.0,\n`;
    playlist += `/segments/${i}.ts\n`;
  }

  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(playlist);
}
