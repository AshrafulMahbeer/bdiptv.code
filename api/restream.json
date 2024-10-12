const axios = require('axios');
const urlLib = require('url'); // To handle URL manipulations

// Cache to store media chunks for 6 seconds
const chunkCache = new Map();

module.exports = async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  // Check if the M3U8 is cached
  const cachedM3U8 = await getCachedM3U8(url);
  if (cachedM3U8) {
    // Serve the cached M3U8 file in JSON format
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).json({ playlist: cachedM3U8 });
  }

  try {
    // Fetch and resolve the final M3U8 file, following any redirects
    const finalM3U8 = await fetchAndResolveM3U8(url);

    // Transform relative URLs to absolute URLs
    const transformedM3U8 = transformPlaylistUrls(url, finalM3U8);

    // Cache the transformed M3U8 playlist
    await cacheM3U8(url, transformedM3U8);

    // Serve the M3U8 as JSON and cache it
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).json({ playlist: transformedM3U8 });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch M3U8 playlist' });
  }
};

// Recursive function to resolve M3U8 redirects
async function fetchAndResolveM3U8(url, depth = 0) {
  if (depth > 5) {
    throw new Error('Too many redirects');
  }

  let m3u8Response;
  try {
    m3u8Response = await axios.get(url, { maxRedirects: 0 });
  } catch (error) {
    // Handle redirect manually if it's another M3U8 file
    if (error.response && error.response.status === 302) {
      const redirectUrl = error.response.headers.location;
      return fetchAndResolveM3U8(redirectUrl, depth + 1);
    }
    throw error;
  }

  const contentType = m3u8Response.headers['content-type'];
  if (contentType && contentType.includes('application/x-mpegURL')) {
    return m3u8Response.data;
  } else {
    throw new Error('Invalid M3U8 playlist');
  }
}

// Transform relative URLs in the M3U8 playlist to absolute URLs
function transformPlaylistUrls(originalUrl, m3u8Data) {
  const baseUrl = urlLib.resolve(originalUrl, '/'); // Get base URL from original M3U8 URL

  // Replace relative paths with absolute paths
  return m3u8Data.replace(/(^(?!http|https|#).+)/gm, (match) => {
    return urlLib.resolve(baseUrl, match); // Make relative URLs absolute
  });
}

// Function to cache the M3U8 file (e.g., store in a DB, Redis, etc.)
async function cacheM3U8(url, m3u8Data) {
  // Implement caching logic (e.g., store in Redis, database, etc.)
}

// Function to retrieve the cached M3U8 file
async function getCachedM3U8(url) {
  // Implement caching retrieval logic
  return null;
}

// Function to cache media chunks for 6 seconds
async function cacheMediaChunk(chunkUrl, chunkData) {
  const cacheKey = chunkUrl;
  const currentTime = Date.now();
  
  // Cache the chunk and set expiration time (6 seconds)
  chunkCache.set(cacheKey, {
    data: chunkData,
    expiresAt: currentTime + 6000, // 6 seconds
  });
}

// Function to get cached media chunks
async function getCachedMediaChunk(chunkUrl) {
  const cacheEntry = chunkCache.get(chunkUrl);
  const currentTime = Date.now();

  // If chunk is cached and not expired, return it
  if (cacheEntry && cacheEntry.expiresAt > currentTime) {
    return cacheEntry.data;
  }

  // If chunk is not cached or has expired, return null
  return null;
}
