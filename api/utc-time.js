export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "GET"); // Allow GET requests only

  const nowUTC = new Date();
  res.status(200).json({
    utc: nowUTC.toISOString()
  });
}
