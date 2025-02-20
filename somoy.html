<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://bosta-live.vercel.app/DPlayer.min.css" />
  <script src="https://bosta-live.vercel.app/DPlayer.min.js"></script>
  <script src="https://bosta-live.vercel.app/hls.min.js"></script>
</head>
<body>
  <div id="dplayer"></div>

  <script>
    let dp;

    function initPlayer() {
      dp = new DPlayer({
        container: document.getElementById('dplayer'),
        live: true,
        autoplay: true,
        video: {
          url: 'https://bosta-live.vercel.app/api/ythls.m3u8?id=4hAzkFtRp70',
          type: 'customHls',
          customType: {
            customHls: function(video, player) {
              if (Hls.isSupported()) {
                const hls = new Hls({
                  autoStartLoad: true
                });

                hls.loadSource(video.src);
                hls.attachMedia(video);
                
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                  console.log("Available qualities:", hls.levels);

                  hls.currentLevel = hls.levels.length - 1; // Force highest quality
                  hls.autoLevelEnabled = false; // Disable auto switching
                });

                hls.on(Hls.Events.ERROR, function (event, data) {
                  console.error("HLS.js Error:", data);
                });

                player.hls = hls;
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = video.src;
                video.play();
              }
            }
          }
        },
      });
    }

    initPlayer();
  </script>
</body>
</html>
