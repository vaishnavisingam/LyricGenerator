document.getElementById('audio-upload').addEventListener('change', function () {
    const player = document.getElementById('audio-player');
    player.src = URL.createObjectURL(this.files[0]);
    player.style.display = 'block';
});

document.getElementById('generate-btn').addEventListener('click', () => {
    const lyricsText = document.getElementById('lyrics-text').value.trim();
    const lines = lyricsText.split('\n').filter(l => l.trim());
    const lyricsDisplay = document.getElementById('lyrics-display');
    const font = document.getElementById('font-selector').value;
    const fontSize = document.getElementById('font-size-selector').value;
    const isBold = document.getElementById('bold-option').checked;
    const animation = document.getElementById('animation-selector').value;
    const bgColor = document.getElementById('bg-color').value;
    const textColor = document.getElementById('text-color').value;
    const screenMode = document.querySelector('input[name="screen-mode"]:checked').value;

    lyricsDisplay.innerHTML = '';
    lines.forEach((line, index) => {
        const div = document.createElement('div');
        div.textContent = line;
        div.className = `lyrics-line ${animation}`;
        div.style.fontFamily = font;
        div.style.fontSize = fontSize;
        div.style.fontWeight = isBold ? 'bold' : 'normal';
        div.style.color = textColor;
        lyricsDisplay.appendChild(div);
    });

    const videoCanvas = document.getElementById('video-canvas');
    videoCanvas.style.backgroundColor = screenMode === 'black' ? '#000' : '#fff';
    videoCanvas.style.backgroundColor = bgColor;

    document.getElementById('preview-container').style.display = 'block';
    document.getElementById('download-section').style.display = 'block';
});

document.getElementById('download-btn').addEventListener('click', () => {
    // This logic would involve server-side rendering or FFmpeg to generate video file
    alert("Video download functionality requires rendering the video using server-side tools like FFmpeg.");
});
