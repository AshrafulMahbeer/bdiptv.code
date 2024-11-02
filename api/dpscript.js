// Function to set the iframe to a specific channel page
function loadChannel(page) {
    const playerContainer = document.getElementById('player-embed');
    playerContainer.src = page;  // Loads the selected channel page in the iframe
}

// Function to populate the playlist with channel names, logos, etc.
function populatePlaylist() {
    const playlist = document.getElementById('playlist');
    playlist.innerHTML = ''; // Clear the previous playlist to avoid duplication

    // Example channel data for hardcoded playlist
    const channels = [
        { name: 'Channel 1', logo: 'logo1.png', page: 'channel1.html' },
        { name: 'Channel 2', logo: 'logo2.png', page: 'channel2.html' },
        { name: 'Channel 3', logo: 'logo3.png', page: 'channel3.html' },
        // Add more channels as needed
    ];

    channels.forEach(channel => {
        // Create a row container for each channel
        const row = document.createElement('div');
        row.className = 'playlist-row';
        
        // Set up click event to load the specific channel page in the iframe
        row.addEventListener('click', () => {
            loadChannel(channel.page);
        });

        // Channel logo
        const logo = document.createElement('img');
        logo.className = 'playlist-logo';
        logo.src = channel.logo || 'https://via.placeholder.com/60';

        // Channel info container
        const infoContainer = document.createElement('div');
        infoContainer.className = 'channel-info';

        // Channel name
        const name = document.createElement('div');
        name.className = 'channel-name';
        name.textContent = channel.name;

        // Live text
        const liveText = document.createElement('div');
        liveText.className = 'live-text';
        liveText.textContent = 'LIVE';

        // Append elements to create the playlist item
        infoContainer.appendChild(name);
        infoContainer.appendChild(liveText);
        row.appendChild(logo);
        row.appendChild(infoContainer);

        playlist.appendChild(row);
    });
}

// Call populatePlaylist on page load
window.onload = populatePlaylist;
