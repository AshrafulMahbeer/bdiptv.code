const { format } = require('date-fns');

module.exports = async (req, res) => {
  try {
    const baseUrl = 'mtv.sunplex.live/MASRANGA-TV/tracks-v1a1';
    const targetDuration = 2;
    const version = 3;
    const sequence = 5302088; // Starting media sequence number
    const now = new Date();

    // Helper function to generate a media file path based on current time
    const generateFilePath = (timestamp, index) => {
      const formattedDate = format(timestamp, 'yyyy/MM/dd/HH/mm');
      const paddedIndex = index.toString().padStart(5, '0');
      return `${baseUrl}/${formattedDate}-${paddedIndex}.ts`;
    };

    // Generate 4 media file entries
    const mediaEntries = Array.from({ length: 4 }, (_, i) => {
      const segmentDuration = i === 3 ? 1.201 : 1.200; // Adjust last segment's duration
      const timestamp = new Date(now.getTime() + i * 1000);
      return {
        duration: segmentDuration,
        path: generateFilePath(timestamp, 1200 + i),
      };
    });

    // Construct the M3U8 playlist
    const playlist = [
      '#EXTM3U',
      `#EXT-X-TARGETDURATION:${targetDuration}`,
      `#EXT-X-VERSION:${version}`,
      `#EXT-X-MEDIA-SEQUENCE:${sequence}`,
      `#EXT-X-PROGRAM-DATE-TIME:${format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'")}`,
      ...mediaEntries.map(
        (entry) => `#EXTINF:${entry.duration},\n${entry.path}`
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.status(200).send(playlist);
  } catch (error) {
    console.error('Error generating M3U8:', error);
    res.status(500).send('Internal Server Error');
  }
};
