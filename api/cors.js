{
  "headers": [
    {
      "source": "/(.*).m3u8",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "X-Requested-With, Content-Type, Authorization" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/index.m3u8",
      "destination": "https://example.com/index.m3u8"
    }
  ]
}
