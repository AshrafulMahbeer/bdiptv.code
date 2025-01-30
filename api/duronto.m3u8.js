export default function handler(req, res) {
    // Generate random numbers between 1 and 10
    const getRandomNumber = () => Math.floor(Math.random() * 10) + 1;
    
    // M3U8 playlist content
    const m3u8Content = `#EXTM3U
#EXTINF:,
https://allinonereborn.com/test.m3u8/ts.php?ts=https://starshare.live/live/KVSingh/KVSingh/433.ts?${getRandomNumber()}
#EXTINF:,
https://allinonereborn.com/test.m3u8/ts.php?ts=https://starshare.live/live/KVSingh/KVSingh/433.ts?${getRandomNumber()}
#EXTINF:,
https://allinonereborn.com/test.m3u8/ts.php?ts=https://starshare.live/live/KVSingh/KVSingh/433.ts?${getRandomNumber()}
#EXTINF:,
https://allinonereborn.com/test.m3u8/ts.php?ts=https://starshare.live/live/KVSingh/KVSingh/433.ts?${getRandomNumber()}`;
    
    // Set response headers
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(m3u8Content);
}
