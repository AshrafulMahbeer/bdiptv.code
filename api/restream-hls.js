import fetch from 'node-fetch';

export default async function handler(req, res) {
  const hlsUrl = "https://newhub247.store/themes/chunklist.m3u8?load=215218dc50b20e9ce79d8642721f2e2b6cf8e2f25b4033ab389a34ca296c3f26b315c93319e1b5570a6eaf72be322b964bb553d8ac22d9b6e6ca6c483ef02ebc008058f0eafeaaed2f8af02093d21f6e1bdeed9bdc60d4a5c73d5cb960ad48fbbb76712fd7ff731e1c698291c17e9b7f39483a68dbc13ce2849ca5f77d6ff89aaff6c893a05ec2ad0f2a88cc4795c77fe176953f3e595b3177a1c0197f5c66f732f38850029c064a868174957de9af1475f5327587d8cda2c56aecc656fb39ec66dbb5eb1c8f42e85e36aacefaf05cad0529264f4797bb1e23ae5541495e51bfd155817ef37a1c82fa6a545490244bcf3e1b24dd3875a9e30d451c31205045161dcb252d0a27a4b7e6daa835fcdc3b9bd99244c01b49157207b8bd9b3004d64d8d9d89bff3525529316e1a075c6bc531cfb4ff1a39f5c7e58e3f714c1f79d4d8e1946ea8e88e8cc723d0ed89f1576865b0f8134fda6aad57628b4ca2f93d4bf118e16a171f41ff838607fe54b00e44ad&token="; // Replace with your HLS URL

  try {
    // Fetch the HLS content
    const response = await fetch(hlsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch HLS stream: ${response.statusText}`);
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl'); // HLS MIME type
    res.setHeader('Cache-Control', 'no-cache');

    // Pipe the response data
    const streamData = await response.text();
    res.status(200).send(streamData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error restreaming HLS');
  }
}
