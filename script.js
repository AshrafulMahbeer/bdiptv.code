const form = document.getElementById('proxy-form');
const urlInput = document.getElementById('url');
const resultDiv = document.getElementById('result');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const url = urlInput.value;

  // Create a new XMLHttpRequest instance
  const xhr = new XMLHttpRequest();

  // Set the request method and URL
  xhr.open('GET', `https://bosta-live.vercel.app/proxy/${encodeURIComponent(url)}`);

  // Set the response type to 'arraybuffer' to handle binary data
  xhr.responseType = 'arraybuffer';

  // Handle the response
  xhr.onload = () => {
    if (xhr.status === 200) {
      // Convert the response data to a Blob
      const blob = new Blob([xhr.response], { type: 'application/vnd.apple.mpegurl' });

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);

      // Create a new iframe to play the m3u8 content
      const iframe = document.createElement('iframe');
      iframe.src = url;

      // Append the iframe to the result div
      resultDiv.appendChild(iframe);
    } else {
      resultDiv.textContent = 'Error fetching m3u8 file: ' + xhr.statusText;
    }
  };

  // Send the request
  xhr.send();
});
