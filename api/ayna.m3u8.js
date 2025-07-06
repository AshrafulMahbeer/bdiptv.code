const fs = require("fs");
const https = require("https");
const { URL } = require("url");
const path = require("path");

const APP_DATA_FOLDER = "/tmp";
const TOKEN_FILE = path.join(APP_DATA_FOLDER, "ayna_token.txt");
const CHANNEL_JSON_URL = "https://aynaott.yflix.top/fuck_api.json";
const TOKEN_API_URL = "https://aynatoken.linkchur.top/?action=token";
const STREAM_API_BASE = "https://web.aynaott.com/api/player/streams";

// Helper to make HTTPS GET requests and parse JSON
function httpsGetJson(url, headers = {}, params = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => u.searchParams.append(k, v));

    const options = {
      method: "GET",
      headers,
    };

    const req = https.request(u, options, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

// Get JWT token (cache if under 4 hours old)
async function getToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const stat = fs.statSync(TOKEN_FILE);
      const age = Date.now() - stat.mtimeMs;
      if (age < 4 * 3600 * 1000) {
        return fs.readFileSync(TOKEN_FILE, "utf8").trim();
      }
    }

    const json = await httpsGetJson(TOKEN_API_URL);
    const token = json.token;
    if (token) {
      fs.writeFileSync(TOKEN_FILE, token);
      return token;
    }
  } catch (e) {
    console.error("Token fetch failed:", e);
  }
  return null;
}

// Fetch the list of channels (id, name, image, etc.)
async function fetchChannelData() {
  try {
    const json = await httpsGetJson(CHANNEL_JSON_URL);
    const result = [];
    const blocks = json?.content?.data || [];

    for (const block of blocks) {
      for (const item of (block.items?.data || [])) {
        result.push({
          id: item.id,
          name: item.title,
          image: item.image || "",
          landscapeImage: item.landscapeImage || ""
        });
      }
    }
    return result;
  } catch (e) {
    console.error("Channel list fetch failed:", e);
    return [];
  }
}

// Get stream URL for a given media ID
async function fetchStreamUrl(media_id, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const params = {
    language: "en",
    operator_id: "1fb1b4c7-dbd9-469e-88a2-c207dc195869",
    device_id: "543EC512DAD9426545939C5DA824B619",
    density: 1.5,
    client: "browser",
    platform: "web",
    os: "windows",
    media_id
  };

  try {
    const json = await httpsGetJson(STREAM_API_BASE, headers, params);
    for (const item of json?.content || []) {
      const url = item?.src?.url;
      if (url) {
        const name = url.split("/")[3]?.split("?")[0] || "unknown";
        return { name, url };
      }
    }
  } catch (e) {
    console.error(`Stream fetch failed for ${media_id}:`, e);
  }
  return { name: null, url: null };
}

module.exports = async (req, res) => {
  const queryTitle = (req.query?.channel || "").toLowerCase().trim();

  if (!queryTitle) {
    return res.status(400).json({ error: "Missing ?channel=Channel Title query param" });
  }

  const token = await getToken();
  if (!token) {
    return res.status(500).json({ error: "Token fetch failed" });
  }

  const channels = await fetchChannelData();
  if (!channels.length) {
    return res.status(500).json({ error: "Channel list fetch failed" });
  }

  const match = channels.find(
    ch => ch.name.toLowerCase().trim() === queryTitle
  );

  if (!match) {
    return res.status(404).json({ error: `Channel "${queryTitle}" not found` });
  }

  const { name, url } = await fetchStreamUrl(match.id, token);
  if (!url) {
    return res.status(500).json({ error: "Stream not available" });
  }

  res.setHeader("Access-Control-Allow-Origin", "https://bostaflix.vercel.app/");
  res.redirect(302, url);
};
