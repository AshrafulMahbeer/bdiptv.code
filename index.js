const got = require('got'); // HTTP request library
const through2 = require('through2'); // Stream manipulation library

async function handleRequest(request, response) {
  try {
    // Replace 'https://your-remote-stream-url' with the actual URL of your stream
    const remoteStream = got.stream('https://livess.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI2/rtv-sg.stream/playlist.m3u8');

    // Create a pass-through stream to forward data to the client
    const passThroughStream = through2((chunk, enc, cb) => {
      response.write(chunk); // Write received data to the response
      cb(); // Signal that the chunk has been processed
    });

    // Pipe the remote stream to the pass-through stream and then to the response
    remoteStream.pipe(passThroughStream).pipe(response);

    // Handle the end of the remote stream (optional restart or handle as needed)
    remoteStream.on('end', () => {
      console.log('Remote stream ended');
    });

    // Handle errors during fetching the remote stream
    remoteStream.on('error', (error) => {
      console.error('Error fetching remote stream:', error);
      response.statusCode = 500;
      response.end('Internal Server Error');
    });
  } catch (error) {
    console.error('Error handling request:', error);
    response.statusCode = 500;
    response.end('Internal Server Error');
  }
}

module.exports = { handleRequest };
