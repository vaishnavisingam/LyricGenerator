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
const lineDuration = document.getElementById('line-duration');
const errorMessage = document.getElementById('error-message');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Audio file handling
let audioFile = null;
let mediaRecorder = null;
let recordedChunks = [];
let lyricsLines = [];
let audioDuration = 0;

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

audioUpload.addEventListener('change', function() {
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
    
    // Get audio duration once metadata is loaded
    audioPlayer.onloadedmetadata = function() {
        audioDuration = audioPlayer.duration;
        previewBtn.disabled = false;
        generateBtn.disabled = false;
        errorMessage.style.display = 'none';
    };
}

// Parse lyrics (no timestamps needed)
function parseLyrics(lyricsString) {
    const lines = lyricsString.trim().split('\n')
        .filter(line => line.trim() !== ''); // Remove empty lines
    
    return lines.map(line => ({text: line.trim()}));
}

// Automatically calculate line timings based on audio duration
function calculateLineTiming(lyrics, audioDuration, secondsPerLine) {
    const totalLines = lyrics.length;
    
    // If specified seconds per line would exceed audio duration, adjust it
    let actualSecondsPerLine = secondsPerLine;
    if (totalLines * secondsPerLine > audioDuration) {
        actualSecondsPerLine = audioDuration / totalLines;
    }
    
    // Calculate timestamp for each line
    let currentTime = 0;
    
    return lyrics.map((line, index) => {
        const timestamp = currentTime;
        
        // Increase current time for next line
        currentTime += actualSecondsPerLine;
        
        // Ensure we don't exceed audio duration for the last line
        if (index === totalLines - 1) {
            // Make the last line end exactly at the audio end
            actualSecondsPerLine = audioDuration - timestamp;
        }
        
        return {
            ...line,
            timestamp,
            duration: actualSecondsPerLine
        };
    });
}

// Preview functionality
previewBtn.addEventListener('click', function() {
    if (!audioFile) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please upload an audio file first.';
        return;
    }
    
    const rawLyrics = parseLyrics(lyricsText.value);
    
    if (rawLyrics.length === 0) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please enter lyrics (at least one line).';
        return;
    }
    
    // Calculate timing for each line
    lyricsLines = calculateLineTiming(rawLyrics, audioDuration, parseFloat(lineDuration.value));
    
    // Show preview
    previewContainer.style.display = 'block';
    lyricsDisplay.innerHTML = '';
    
    // Apply selected font
    lyricsDisplay.style.fontFamily = fontSelector.value;
    lyricsDisplay.style.color = textColor.value;
    
    // Create lyrics elements
    lyricsLines.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.className = 'lyrics-line';
        lineElement.textContent = line.text;
        lineElement.id = `line-${index}`;
        lyricsDisplay.appendChild(lineElement);
    });
    
    // Reset audio
    audioPlayer.currentTime = 0;
    
    // Start playback and sync lyrics
    audioPlayer.play();
    syncLyrics();
});

function syncLyrics() {
    let currentLineIndex = -1;
    
    audioPlayer.ontimeupdate = function() {
        const currentTime = audioPlayer.currentTime;
        
        // Find the current line based on timestamp
        let i = 0;
        while (i < lyricsLines.length && 
               (lyricsLines[i].timestamp + lyricsLines[i].duration) <= currentTime) {
            i++;
        }
        
        // Find the current line that should be shown
        let newLineIndex = -1;
        if (i < lyricsLines.length && lyricsLines[i].timestamp <= currentTime) {
            newLineIndex = i;
        }
        
        // Only update if the line changed
        if (newLineIndex !== currentLineIndex) {
            // Remove active class from previous line
            if (currentLineIndex >= 0) {
                const prevLine = document.getElementById(`line-${currentLineIndex}`);
                if (prevLine) {
                    if (animationSelector.value === 'fade') {
                        prevLine.classList.add('fade-out');
                        prevLine.classList.remove('active');
                    } else {
                        prevLine.classList.remove('active');
                    }
                }
            }
            
            // Add active class to new line
            if (newLineIndex >= 0) {
                const newLine = document.getElementById(`line-${newLineIndex}`);
                if (newLine) {
                    newLine.classList.add('active');
                    
                    // Apply different animations based on selection
                    if (animationSelector.value === 'zoom') {
                        newLine.style.transform = 'scale(0.5)';
                        setTimeout(() => {
                            newLine.style.transform = 'scale(1)';
                        }, 50);
                    } else if (animationSelector.value === 'bounce') {
                        newLine.style.animation = 'bounce 0.5s';
                    }
                }
            }
            
            currentLineIndex = newLineIndex;
        }
    };
    
    audioPlayer.onended = function() {
        // Reset active lines when audio ends
        document.querySelectorAll('.lyrics-line').forEach(line => {
            line.classList.remove('active');
            line.classList.remove('fade-out');
        });
    };
}

// Generate video functionality
generateBtn.addEventListener('click', async function() {
    if (!audioFile) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please upload an audio file first.';
        return;
    }
    
    const rawLyrics = parseLyrics(lyricsText.value);
    
    if (rawLyrics.length === 0) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Please enter lyrics (at least one line).';
        return;
    }
    
    // Calculate timing for each line
    lyricsLines = calculateLineTiming(rawLyrics, audioDuration, parseFloat(lineDuration.value));
    
    // Show preview if not already shown
    if (previewContainer.style.display !== 'block') {
        previewContainer.style.display = 'block';
        lyricsDisplay.innerHTML = '';
        
        // Apply selected font
        lyricsDisplay.style.fontFamily = fontSelector.value;
        lyricsDisplay.style.color = textColor.value;
        
        // Create lyrics elements
        lyricsLines.forEach((line, index) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'lyrics-line';
            lineElement.textContent = line.text;
            lineElement.id = `line-${index}`;
            lyricsDisplay.appendChild(lineElement);
        });
    }
    
    // Disable button and show processing message
    generateBtn.disabled = true;
    generateBtn.textContent = 'Processing... Please wait';
    progressContainer.style.display = 'block';
    
    // Check for MediaRecorder API support
    if (typeof MediaRecorder === 'undefined') {
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Your browser does not support MediaRecorder API. Please try Chrome, Firefox or Edge.';
        generateBtn.textContent = 'Generate Video';
        generateBtn.disabled = false;
        progressContainer.style.display = 'none';
        return;
    }
    
    try {
        // Start recording the canvas
        await startRecording();
        
        // Show download section
        downloadSection.style.display = 'block';
    } catch (error) {
        console.error('Video generation error:', error);
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Error generating video: ' + error.message + '. Please try again.';
        generateBtn.textContent = 'Generate Video';
        generateBtn.disabled = false;
        progressContainer.style.display = 'none';
    }
});

// Canvas recording
async function startRecording() {
    return new Promise(async (resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size (16:9 aspect ratio)
            canvas.width = 1280;
            canvas.height = 720;
            
            // Add canvas to document for debugging (will be hidden)
            canvas.style.position = 'absolute';
            canvas.style.left = '-9999px';
            document.body.appendChild(canvas);
            
            // Create a stream from the canvas
            let stream;
            try {
                // Check if captureStream method exists
                if (typeof canvas.captureStream !== 'function') {
                    // Fallback for some browsers
                    if (typeof canvas.mozCaptureStream === 'function') {
                        stream = canvas.mozCaptureStream(30);
                    } else {
                        throw new Error('Canvas streaming not supported in this browser');
                    }
                } else {
                    stream = canvas.captureStream(30); // 30 FPS
                }
            } catch (err) {
                throw new Error('Canvas stream creation failed. Try a different browser: ' + err.message);
            }
            
            // Add audio track to the stream
            let audioContext, audioSource, audioDestination;
            try {
                audioContext = new AudioContext();
                audioSource = audioContext.createMediaElementSource(audioPlayer);
                audioDestination = audioContext.createMediaStreamDestination();
                audioSource.connect(audioDestination);
                audioSource.connect(audioContext.destination);
                
                stream.getAudioTracks().forEach(track => stream.removeTrack(track));
                audioDestination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
            } catch (err) {
                throw new Error('Audio processing failed: ' + err.message);
            }
            
            // Determine supported MIME type
            let mimeType = 'video/webm';
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                mimeType = 'video/webm;codecs=vp8';
            } else if (!MediaRecorder.isTypeSupported('video/webm')) {
                throw new Error('No supported video format found in your browser');
            }
            
            // Create MediaRecorder
            try {
                mediaRecorder = new MediaRecorder(stream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: 2500000
                });
            } catch (err) {
                throw new Error('MediaRecorder creation failed: ' + err.message);
            }
            
            recordedChunks = [];
            
            mediaRecorder.ondataavailable = function(e) {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };
            
            // Error handling during recording
            mediaRecorder.onerror = function(event) {
                reject(new Error('Recording error: ' + event.error));
            };
            
            mediaRecorder.onstop = function() {
                // Remove debug canvas
                if (document.body.contains(canvas)) {
                    document.body.removeChild(canvas);
                }
                
                if (recordedChunks.length === 0) {
                    reject(new Error('No data was recorded'));
                    return;
                }
                
                try {
                    // Create video blob
                    const blob = new Blob(recordedChunks, {
                        type: 'video/webm'
                    });
                    
                    if (blob.size === 0) {
                        reject(new Error('Generated video has no data'));
                        return;
                    }
                    
                    // Create download link
                    const url = URL.createObjectURL(blob);
                    
                    // Create video element to verify content
                    const videoElement = document.createElement('video');
                    videoElement.src = url;
                    videoElement.style.display = 'none';
                    document.body.appendChild(videoElement);
                    
                    videoElement.onloadedmetadata = function() {
                        document.body.removeChild(videoElement);
                        
                        downloadBtn.onclick = function() {
                            const a = document.createElement('a');
                            const fileName = audioFile.name.replace(/\.[^/.]+$/, '') + '-lyrics.webm';
                            a.href = url;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        };
                        
                        // Add preview video
                        const previewVideo = document.createElement('video');
                        previewVideo.src = url;
                        previewVideo.controls = true;
                        previewVideo.style.width = '100%';
                        previewVideo.style.marginTop = '20px';
                        previewVideo.style.borderRadius = '5px';
                        downloadSection.appendChild(previewVideo);
                        
                        // Reset UI
                        generateBtn.disabled = false;
                        generateBtn.textContent = 'Generate Video';
                        progressContainer.style.display = 'none';
                        progressBar.style.width = '100%';
                        progressText.textContent = 'Processing complete!';
                        
                        resolve();
                    };
                    
                    videoElement.onerror = function() {
                        document.body.removeChild(videoElement);
                        reject(new Error('Generated video cannot be played'));
                    };
                } catch (err) {
                    reject(new Error('Error creating video: ' + err.message));
                }
            };
            
            // Start recording
            mediaRecorder.start(1000); // Collect data in 1-second chunks
            
            // Reset audio
            audioPlayer.currentTime = 0;
            
            // Start drawing frames and playing audio
            let currentLineIndex = -1;
            
            // Apply selected font and color
            const selectedFont = fontSelector.value;
            const selectedColor = textColor.value;
            const selectedAnimation = animationSelector.value;
            
            // Start playback
            audioPlayer.play();
            
            // Update progress bar
            let lastTime = 0;
            audioPlayer.ontimeupdate = function() {
                const progress = (audioPlayer.currentTime / audioDuration) * 100;
                progressBar.style.width = progress + '%';
                progressText.textContent = `Processing: ${Math.round(progress)}%`;
                lastTime = audioPlayer.currentTime;
            };
            
            // Animation frame loop
            function drawFrame() {
                // Clear canvas
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const currentTime = audioPlayer.currentTime;
                
                // Find the current line that should be shown
                let newLineIndex = -1;
                for (let i = 0; i < lyricsLines.length; i++) {
                    const line = lyricsLines[i];
                    if (currentTime >= line.timestamp && 
                        currentTime < (line.timestamp + line.duration)) {
                        newLineIndex = i;
                        break;
                    }
                }
                
                // Add some visual elements like a subtle gradient background
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#111111');
                gradient.addColorStop(1, '#000000');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add subtle visual elements
                drawVisualizationElements(ctx, canvas, currentTime);
                
                // Set font based on user selection
                const mainFont = `bold 36px ${selectedFont}`;
                const secondaryFont = `24px ${selectedFont}`;
                
                if (newLineIndex >= 0) {
                    // Display the current line
                    const currentLine = lyricsLines[newLineIndex];
                    
                    // Calculate progress within the current line
                    const lineProgress = (currentTime - currentLine.timestamp) / currentLine.duration;
                    
                    // Draw text with animation effects based on selected animation
                    const x = canvas.width / 2;
                    const y = canvas.height / 2;
                    
                    // Apply text effects based on selected animation
                    if (selectedAnimation === 'fade') {
                        const fadeInDuration = 0.3; // seconds
                        const fadeOutDuration = 0.3; // seconds
                        
                        let opacity = 1;
                        if (lineProgress < fadeInDuration) {
                            opacity = lineProgress / fadeInDuration;
                        } else if (lineProgress > (1 - fadeOutDuration)) {
                            opacity = (1 - lineProgress) / fadeOutDuration;
                        }
                        
                        // Apply opacity
                        ctx.globalAlpha = Math.max(0.1, opacity);
                    } else if (selectedAnimation === 'zoom') {
                        const zoomInDuration = 0.3; // seconds
                        let scale = 1;
                        
                        if (lineProgress < zoomInDuration) {
                            scale = 0.8 + 0.2 * (lineProgress / zoomInDuration);
                        }
                        
                        // Apply scaling
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.scale(scale, scale);
                        ctx.translate(-x, -y);
                    }
                    
                    // Text settings
                    ctx.font = mainFont;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Text shadow for better readability
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    // Draw main text
                    ctx.fillStyle = selectedColor;
                    ctx.fillText(currentLine.text, x, y);
                    
                    // Remove shadow for other elements
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    
                    // Draw progress bar
                    const textWidth = Math.min(ctx.measureText(currentLine.text).width, canvas.width * 0.8);
                    const barHeight = 6;
                    const barY = y + 30;
                    
                    // Background of progress bar
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(x - textWidth/2, barY, textWidth, barHeight);
                    
                    // Foreground of progress bar
                    const highlightWidth = textWidth * lineProgress;
                    ctx.fillStyle = selectedColor !== '#ffffff' ? selectedColor : '#00AAFF'; // Use selected color or default blue
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(x - textWidth/2, barY, highlightWidth, barHeight);
                    ctx.globalAlpha = 1;
                    
                    // Reset transform if we're using zoom
                    if (selectedAnimation === 'zoom') {
                        ctx.restore();
                    }
                }
                
                // Display previous and next lines with adjustments
                ctx.font = secondaryFont;
                ctx.globalAlpha = 0.6;
                
                // Previous line
                if (newLineIndex > 0) {
                    const prevLine = lyricsLines[newLineIndex - 1];
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.fillText(prevLine.text, canvas.width / 2, canvas.height / 2 - 60);
                }
                
                // Next line
                if (newLineIndex < lyricsLines.length - 1) {
                    const nextLine = lyricsLines[newLineIndex + 1];
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.fillText(nextLine.text, canvas.width / 2, canvas.height / 2 + 60);
                }
                
                // Reset opacity
                ctx.globalAlpha = 1.0;
                
                // Request next animation frame
                requestAnimationFrame(drawFrame);
            }
            
            // Helper function to draw visual elements
            function drawVisualizationElements(ctx, canvas, currentTime) {
                // Draw subtle audio-like visualization elements
                const maxBars = 24;
                const barWidth = 10;
                const totalWidth = maxBars * (barWidth + 2); // 2px spacing
                const startX = (canvas.width - totalWidth) / 2;
                const baseHeight = 40;
                const maxHeight = 80;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                
                for (let i = 0; i < maxBars; i++) {
                    // Generate pseudo-random heights that change with time
                    const heightRatio = 0.3 + 0.7 * Math.sin((currentTime * 2) + (i * 0.2));
                    const height = baseHeight + (heightRatio * maxHeight);
                    
                    const x = startX + i * (barWidth + 2);
                    const y = canvas.height - 100;
                    
                    // Draw bar
                    ctx.globalAlpha = 0.1 + (heightRatio * 0.2);
                    ctx.fillRect(x, y, barWidth, -height);
                }
                
                ctx.globalAlpha = 1.0;
                
                // Add subtle pulsing circle in the background
                const center = { x: canvas.width / 2, y: canvas.height / 2 };
                const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
                const pulseSpeed = 1; // speed of pulse
                
                // Create gradient for circle
                const circleGradient = ctx.createRadialGradient(
                    center.x, center.y, 0,
                    center.x, center.y, maxRadius
                );
                
                circleGradient.addColorStop(0, 'rgba(40, 40, 40, 0.1)');
                circleGradient.addColorStop(0.8, 'rgba(20, 20, 20, 0.05)');
                circleGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                // Pulse radius based on time
                const pulseRatio = 0.8 + 0.2 * Math.sin(currentTime * pulseSpeed);
                const radius = maxRadius * pulseRatio;
                
                // Draw circle
                ctx.fillStyle = circleGradient;
                ctx.beginPath();
                ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Start the animation loop
            requestAnimationFrame(drawFrame);
            
            // Handle end of audio
            audioPlayer.onended = function() {
                // Stop recording when audio ends
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            };
        } catch (error) {
            reject(error);
        }
    });
}