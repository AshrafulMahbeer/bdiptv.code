import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Check the request method
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Define the directory to scan for media files
  const scanDirectory = './public'; // Adjust to the correct root directory for your project
  const mediaExtensions = ['.mp4', '.mp3', '.wav', '.aac', '.m4a'];

  try {
    // Recursively find files in the directory
    const findMediaFiles = (directory) => {
      const entries = fs.readdirSync(directory, { withFileTypes: true });
      return entries.flatMap((entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          return findMediaFiles(fullPath); // Recursive call for subdirectories
        }
        return fullPath;
      });
    };

    // Get all files from the directory
    const allFiles = findMediaFiles(scanDirectory);

    // Filter for files containing media extensions anywhere in the name
    const mediaFiles = allFiles.filter((file) =>
      mediaExtensions.some((ext) => file.toLowerCase().includes(ext))
    );

    if (mediaFiles.length === 0) {
      res.status(404).json({ error: 'No media files found' });
      return;
    }

    // Construct URLs assuming files are served from the public folder
    const mediaLinks = mediaFiles.map((file) =>
      file.replace(scanDirectory, '').replace(/\\/g, '/')
    );

    // Respond with the media file links
    res.status(200).json({ files: mediaLinks });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
