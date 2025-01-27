// Vercel serverless function in the /api folder
export default function handler(req, res) {
  const randomNum = Math.floor(Math.random() * 1000000); // Generate a random number
  const tsUrl = `https://allinonereborn.com/test.m3u8/ts.php?ts=https://starshare.live/live/KVSingh/KVSingh/433.ts?${randomNum}`;

  const m3u8Content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-PLAYLIST-TYPE:EVENT
#EXTINF:,
${tsUrl}
`;

  // Set headers for M3U8 content
  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.setHeader("Cache-Control", "no-cache");

  // Send M3U8 content
  res.status(200).send(m3u8Content);
}
