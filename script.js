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
            
            previewBtn.disabled = false;
            generateBtn.disabled = false;
            errorMessage.style.display = 'none';
        }
        
        // Parse lyrics with timestamps
        function parseLyrics(lyricsString) {
            const lines = lyricsString.trim().split('\n');
            const parsedLines = [];
            
            for (const line of lines) {
                // Match timestamp pattern [MM:SS] or [MM:SS.ms]
                const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/);
                
                if (match) {
                    const minutes = parseInt(match[1], 10);
                    const seconds = parseInt(match[2], 10);
                    const milliseconds = match[3] ? parseInt(match[3], 10) : 0;
                    
                    const timestamp = (minutes * 60 + seconds) + (milliseconds / 1000);
                    const text = match[4].trim();
                    
                    if (text) {
                        parsedLines.push({
                            timestamp,
                            text
                        });
                    }
                }
            }
            
            // Sort by timestamp
            return parsedLines.sort((a, b) => a.timestamp - b.timestamp);
        }
        
        // Preview functionality
        previewBtn.addEventListener('click', function() {
            if (!audioFile) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Please upload an audio file first.';
                return;
            }
            
            lyricsLines = parseLyrics(lyricsText.value);
            
            if (lyricsLines.length === 0) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Please enter lyrics with valid timestamps.';
                return;
            }
            
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
                while (i < lyricsLines.length && lyricsLines[i].timestamp <= currentTime) {
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
            
            lyricsLines = parseLyrics(lyricsText.value);
            
            if (lyricsLines.length === 0) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Please enter lyrics with valid timestamps.';
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
            
            mediaRecorder.ondataavailable = function(e) {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = function() {
                // Create video blob
                const blob = new Blob(recordedChunks, {
                    type: 'video/webm'
                });
                
                // Create download link
                const url = URL.createObjectURL(blob);
                downloadBtn.onclick = function() {
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
            const selectedAnimation = animationSelector.value;
            
            // Start playback
            audioPlayer.play();
            
            // Animation frame loop
            function drawFrame() {
                // Clear canvas
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const currentTime = audioPlayer.currentTime;
                
                // Find current line
                let i = 0;
                while (i < lyricsLines.length && lyricsLines[i].timestamp <= currentTime) {
                    i++;
                }
                
                const newLineIndex = i > 0 ? i - 1 : -1;
                
                if (newLineIndex >= 0) {
                    // Calculate how long this line has been displayed
                    const currentLineStartTime = lyricsLines[newLineIndex].timestamp;
                    const timeInCurrentLine = currentTime - currentLineStartTime;
                    
                    // Next line timestamp (for fade out calculation)
                    const nextLineTime = newLineIndex < lyricsLines.length - 1 
                        ? lyricsLines[newLineIndex + 1].timestamp 
                        : audioPlayer.duration;
                    
                    const timeToNextLine = nextLineTime - currentTime;
                    
                    // Calculate fade in/out opacity
                    let opacity = 1;
                    if (timeInCurrentLine < 0.5) {
                        // Fade in during first 0.5 seconds
                        opacity = timeInCurrentLine / 0.5;
                    } else if (timeToNextLine < 0.5) {
                        // Fade out during last 0.5 seconds
                        opacity = timeToNextLine / 0.5;
                    }
                    
                    // Set text properties
                    ctx.font = '36px ' + selectedFont;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Apply text color with opacity
                    ctx.fillStyle = hexToRgba(selectedColor, opacity);
                    
                    // Get current line text
                    const text = lyricsLines[newLineIndex].text;
                    
                    // Apply different animations
                    let yOffset = 0;
                    let scale = 1;
                    
                    if (selectedAnimation === 'slide') {
                        // Slide up animation
                        yOffset = timeInCurrentLine < 0.5 ? (0.5 - timeInCurrentLine) * 50 : 0;
                    } else if (selectedAnimation === 'zoom') {
                        // Zoom in animation
                        scale = timeInCurrentLine < 0.5 ? 0.5 + timeInCurrentLine : 1;
                    } else if (selectedAnimation === 'bounce') {
                        // Bounce animation
                        if (timeInCurrentLine < 0.5) {
                            yOffset = Math.sin(timeInCurrentLine * Math.PI * 4) * (0.5 - timeInCurrentLine) * 30;
                        }
                    }
                    
                    // Apply transform
                    ctx.save();
                    ctx.translate(canvas.width / 2, canvas.height / 2 + yOffset);
                    ctx.scale(scale, scale);
                    
                    // Draw text with shadow for better visibility
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    // Draw the text
                    ctx.fillText(text, 0, 0);
                    
                    ctx.restore();
                }
                
                // Continue animation loop if recording
                if (mediaRecorder.state === 'recording') {
                    if (!audioPlayer.ended && !audioPlayer.paused) {
                        requestAnimationFrame(drawFrame);
                    } else {
                        // End recording when audio ends
                        mediaRecorder.stop();
                    }
                }
            }
            
            // Start animation loop
            drawFrame();
        }
        
        // Helper function to convert hex color to rgba
        function hexToRgba(hex, opacity) {
            hex = hex.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        // Add animation styles
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerHTML = `
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
            }
        `;
        document.head.appendChild(styleSheet);