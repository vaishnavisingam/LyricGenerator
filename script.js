// DOM Elements
const dropArea = document.getElementById('drop-area');
const audioUpload = document.getElementById('audio-upload');
const audioPlayer = document.getElementById('audio-player');
const fileName = document.getElementById('file-name');
const lyricsText = document.getElementById('lyrics-text');
const previewBtn = document.getElementById('preview-btn');
const generateBtn = document.getElementById('generate-btn');
const previewContainer = document.getElementById('preview-container');
const lyricsDisplay = document.getElementById('lyrics-display');
const downloadSection = document.getElementById('download-section');
const downloadBtn = document.getElementById('download-btn');
const fontSelector = document.getElementById('font-selector');
const animationSelector = document.getElementById('animation-selector');
const textColor = document.getElementById('text-color');
const errorMessage = document.getElementById('error-message');

// Audio file handling
let audioFile = null;
let mediaRecorder = null;
let recordedChunks = [];
let lyricsLines = [];

// Drag and drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add('dragover');
}

function unhighlight() {
    dropArea.classList.remove('dragover');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0 && files[0].type.startsWith('audio/')) {
        handleAudioFile(files[0]);
    } else {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please upload an audio file.';
    }
}

audioUpload.addEventListener('change', function () {
    if (this.files.length > 0) {
        handleAudioFile(this.files[0]);
    }
});

function handleAudioFile(file) {
    audioFile = file;
    fileName.textContent = file.name;

    const audioURL = URL.createObjectURL(file);
    audioPlayer.src = audioURL;
    audioPlayer.style.display = 'block';

    previewBtn.disabled = false;
    generateBtn.disabled = false;
    errorMessage.style.display = 'none';
}

// Preview functionality
previewBtn.addEventListener('click', function () {
    if (!audioFile) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please upload an audio file first.';
        return;
    }

    const lyricsTextValue = lyricsText.value.trim();
    if (!lyricsTextValue) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please enter some lyrics.';
        return;
    }

    // Split the lyrics into lines and create a visual representation
    lyricsLines = lyricsTextValue.split('\n');

    previewContainer.style.display = 'block';
    lyricsDisplay.innerHTML = '';

    // Apply selected font
    lyricsDisplay.style.fontFamily = fontSelector.value;
    lyricsDisplay.style.color = textColor.value;

    // Create lyrics elements
    lyricsLines.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.className = 'lyrics-line';
        lineElement.textContent = line;
        lineElement.id = `line-${index}`;
        lyricsDisplay.appendChild(lineElement);
    });

    // Reset audio
    audioPlayer.currentTime = 0;

    // Start playback and sync lyrics (no timestamps, just user input)
    audioPlayer.play();
    syncLyrics();
});

function syncLyrics() {
    let currentLineIndex = -1;
    let lineStartTimes = []; // Track when each lyric should appear

    // Simple example of letting the user decide when each line should appear
    // (This could be done via input fields for time or via a slider interface)
    lyricsLines.forEach((line, index) => {
        // Here, assume user inputs the time delay for each line (this can be a slider input)
        const lineTime = parseFloat(prompt(`Enter time delay for line "${line}" (in seconds):`));
        lineStartTimes.push(lineTime);
    });

    audioPlayer.ontimeupdate = function () {
        const currentTime = audioPlayer.currentTime;

        // Find which line should be displayed based on the current audio time
        let i = 0;
        while (i < lineStartTimes.length && lineStartTimes[i] <= currentTime) {
            i++;
        }

        // The current line is the previous one (or none if i=0)
        const newLineIndex = i > 0 ? i - 1 : -1;

        // Only update if the line changed
        if (newLineIndex !== currentLineIndex) {
            // Remove active class from previous line
            if (currentLineIndex >= 0) {
                const prevLine = document.getElementById(`line-${currentLineIndex}`);
                if (prevLine) {
                    prevLine.classList.remove('active');
                }
            }

            // Add active class to new line
            if (newLineIndex >= 0) {
                const newLine = document.getElementById(`line-${newLineIndex}`);
                if (newLine) {
                    newLine.classList.add('active');
                    applyAnimations(newLine, animationSelector.value);
                }
            }

            currentLineIndex = newLineIndex;
        }
    };

    audioPlayer.onended = function () {
        // Reset active lines when audio ends
        document.querySelectorAll('.lyrics-line').forEach(line => {
            line.classList.remove('active');
        });
    };
}

// Apply animation effect based on user selection
function applyAnimations(lineElement, animationType) {
    if (animationType === 'zoom') {
        lineElement.style.transform = 'scale(0.5)';
        setTimeout(() => {
            lineElement.style.transform = 'scale(1)';
        }, 50);
    } else if (animationType === 'bounce') {
        lineElement.style.animation = 'bounce 0.5s';
    }
}

// Generate video functionality
generateBtn.addEventListener('click', async function () {
    if (!audioFile) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please upload an audio file first.';
        return;
    }

    // Show preview if not already shown
    if (previewContainer.style.display !== 'block') {
        previewBtn.click();
    }

    // Start recording the canvas
    startRecording();

    // Show download section
    downloadSection.style.display = 'block';
});

// Canvas recording
async function startRecording() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size (16:9 aspect ratio)
    canvas.width = 1280;
    canvas.height = 720;

    // Create a stream from the canvas
    const stream = canvas.captureStream(30); // 30 FPS

    // Add audio track to the stream
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaElementSource(audioPlayer);
    const audioDestination = audioContext.createMediaStreamDestination();
    audioSource.connect(audioDestination);
    audioSource.connect(audioContext.destination);

    stream.getAudioTracks().forEach(track => stream.removeTrack(track));
    audioDestination.stream.getAudioTracks().forEach(track => stream.addTrack(track));

    // Create MediaRecorder
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
    });

    recordedChunks = [];

    mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };

    mediaRecorder.onstop = function () {
        // Create video blob
        const blob = new Blob(recordedChunks, {
            type: 'video/webm'
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        downloadBtn.onclick = function () {
            const a = document.createElement('a');
            const fileName = audioFile.name.replace(/\.[^/.]+$/, '') + '-lyrics.webm';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    };

    // Start recording
    mediaRecorder.start();

    // Reset audio
    audioPlayer.currentTime = 0;

    // Start drawing frames and playing audio
    let currentLineIndex = -1;
    const startTime = performance.now();

    // Apply selected font and color
    const selectedFont = fontSelector.value;
    const selectedColor = textColor.value;

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw lyrics
        lyricsLines.forEach((line, index) => {
            ctx.font = selectedFont;
            ctx.fillStyle = selectedColor;
            ctx.textAlign = 'center';
            const y = 100 + index * 50;
            ctx.fillText(line, canvas.width / 2, y);
        });

        // Continue drawing until the audio ends
        if (audioPlayer.currentTime < audioPlayer.duration) {
            requestAnimationFrame(draw);
        } else {
            mediaRecorder.stop();
        }
    }

    draw();
}

// Download video functionality
downloadBtn.addEventListener('click', function () {
    // Initiate download of the generated video
});
