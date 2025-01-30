export default function handler(req, res) {
   
    // M3U8 playlist content
    const m3u8Content = `#EXTM3U
#EXTINF:,
https://allinonereborn.com/test.m3u8/ts.php?ts=https://starshare.live/live/KVSingh/KVSingh/433.ts
    
    // Set response headers
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(m3u8Content);
}
