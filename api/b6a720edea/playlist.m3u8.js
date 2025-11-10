export default async function handler(req, res) {
  // Log useful request headers
  const referer = req.headers['referer'] || 'none';
  const userAgent = req.headers['user-agent'] || 'none';
  const origin = req.headers['origin'] || 'none';

  console.log('--- Request Info ---');
  console.log('Referer:', referer);
  console.log('User-Agent:', userAgent);
  console.log('Origin:', origin);
  console.log('IP:', req.headers['x-forwarded-for'] || req.socket.remoteAddress);
  console.log('--------------------');

  // Set headers for HLS
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Cache-Control', 'no-cache');

  // Your playlist
  const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:6.0,
https://bostaflix.vercel.app/segment.ts
#EXT-X-ENDLIST`;

  res.status(200).send(playlist);
}
