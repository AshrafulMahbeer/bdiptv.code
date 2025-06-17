// File: api/fetch-page.js

const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      res.statusCode = 400;
      return res.end('Missing "url" query parameter.');
    }

    const parsedUrl = new URL(targetUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiODQyNThiOTctYjY4ZS00N2U0LTk3NDgtMmU0ZTAyMTM3ZDY0Iiwib3BlcmF0b3JJZCI6IjFmYjFiNGM3LWRiZDktNDY5ZS04OGEyLWMyMDdkYzE5NTg2OSIsImdlb0lwUnVsZXMiOnsiZDE3MjUwYTMtMzk4NS00OWJjLWFlOGMtZmU3Y2JiNjA0MDhjIjp0cnVlfSwiZ2VvTG9jYXRpb24iOnsiY291bnRyeSI6IkJEIiwiY2l0eSI6IkdyZWVuIE1vZGVsIFRvd24iLCJpcCI6IjEwMy4xODUuMjUxLjY4In0sImRldmljZUlkIjoiRkM2QThCNjc1RDhFRjFFRUFFNkZBQTQ1NTgyRDhBMUYifSwiaWF0IjoxNzUwMTU2MjkzLCJleHAiOjE3NTAxOTk0OTN9.nz_UJ1sKv8Y0t4t-lxzoyqW-Xjg8z_LEwtRz6AM9iNo',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'DNT': '1',
        'Host': 'web.aynaott.com',
        'Pragma': 'no-cache',
        'Referer': 'https://web.aynaott.com/channels',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'X-User-Id': '84258b97-b68e-47e4-9748-2e4e02137d64',
      }
    };

    protocol.get(targetUrl, options, (response) => {
      let data = [];

      response.on('data', chunk => data.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(data);
        res.statusCode = response.statusCode;
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        res.end(buffer);
      });
    }).on('error', (err) => {
      res.statusCode = 500;
      res.end('Fetch error: ' + err.message);
    });

  } catch (error) {
    res.statusCode = 500;
    res.end('Server error: ' + error.message);
  }
};
