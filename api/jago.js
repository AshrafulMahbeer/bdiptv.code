// /api/jago.js

export default function handler(req, res) {
  const { url } = req.query;

  if (url === 'stream.m3u8') {
    // Set the response header to serve an m3u8 file
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

    // Generate the master m3u8 with the provided signed URL
    const signedM3U8 = `
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1280000
https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI/somoyt000011226615544544.stream/playlist.m3u8?wmsAuthSign=c2VydmVyX3RpbWU9MTAvMTcvMjAyNCA1OjQyOjQ4IEFNJmhhc2hfdmFsdWU9Q2ZiN0VPWnFEeVBvZ210Q0hQLytyUT09JnZhbGlkbWludXRlcz01MCZpZD01
    `;

    res.status(200).send(signedM3U8);
  } else {
    // If the requested URL is invalid, return a 404
    res.status(404).send('Stream not found');
  }
}
