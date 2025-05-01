// script.js
const audioUpload = document.getElementById('audio-upload');
const audioPlayer = document.getElementById('audio-player');
const lyricsText = document.getElementById('lyrics-text');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const lyricsDisplay = document.getElementById('lyrics-display');
const fontSelector = document.getElementById('font-selector');
const animationSelector = document.getElementById('animation-selector');
const lineDuration = document.getElementById('line-duration');
const textColorPicker = document.getElementById('text-color');
const backgroundType = document.getElementById('background-type');
const bgColorPicker = document.getElementById('bg-color-picker');

// Populate font options
const fonts = [
  'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Impact',
  'Trebuchet MS', 'Lucida Console', 'Tahoma', 'Palatino Linotype', 'Garamond', 'Book Antiqua',
  'Copperplate', 'Papyrus', 'Brush Script MT', 'Segoe UI', 'Roboto', 'Lobster', 'Bebas Neue',
  'Playfair Display', 'Open Sans', 'Montserrat', 'Raleway', 'Pacifico', 'Dancing Script',
  'Oswald', 'Merriweather', 'Ubuntu', 'Fjalla One'
];
fonts.forEach(font => {
  const option = document.createElement('option');
  option.value = font;
  option.textContent = font;
  fontSelector.appendChild(option);
});

// Populate animation options
const animations = [
  'fadeIn', 'zoomIn', 'slideInUp', 'bounceIn', 'flipInX', 'rotateIn', 'lightSpeedIn',
  'jackInTheBox', 'rollIn', 'bounceInDown', 'bounceInLeft', 'fadeInDown', 'fadeInLeft',
  'fadeInRight', 'fadeInUp', 'flipInY', 'slideInDown', 'slideInLeft', 'slideInRight',
  'zoomInDown', 'zoomInLeft', 'zoomInRight', 'zoomInUp', 'rotateInDownLeft',
  'rotateInDownRight', 'rotateInUpLeft', 'rotateInUpRight', 'slideInTop', 'slideInBottom',
  'expandIn'
];
animations.forEach(anim => {
  const option = document.createElement('option');
  option.value = anim;
  option.textContent = anim;
  animationSelector.appendChild(option);
});

// Handle audio upload
audioUpload.addEventListener('change', () => {
  const file = audioUpload.files[0];
  if (file) {
    audioPlayer.src = URL.createObjectURL(file);
    audioPlayer.style.display = 'block';
  }
});

// Handle background selector
backgroundType.addEventListener('change', () => {
  bgColorPicker.style.display = backgroundType.value === 'custom' ? 'inline-block' : 'none';
});

// Generate preview
generateBtn.addEventListener('click', () => {
  const lines = lyricsText.value.split('\n').filter(line => line.trim() !== '');
  const duration = parseInt(lineDuration.value);
  let currentIndex = 0;

  lyricsDisplay.innerHTML = '';
  audioPlayer.currentTime = 0;
  audioPlayer.play();

  const font = fontSelector.value;
  const animation = animationSelector.value;
  const textColor = textColorPicker.value;
  const bgColor = backgroundType.value === 'custom' ? bgColorPicker.value : backgroundType.value;

  document.getElementById('video-canvas').style.backgroundColor = bgColor;

  const interval = setInterval(() => {
    if (currentIndex >= lines.length) {
      clearInterval(interval);
      return;
    }

    lyricsDisplay.innerHTML = '';
    const line = document.createElement('div');
    line.className = `lyrics-line active animate__animated animate__${animation}`;
    line.textContent = lines[currentIndex];
    line.style.color = textColor;
    line.style.fontFamily = font;

    lyricsDisplay.appendChild(line);
    currentIndex++;
  }, duration * 1000);
});
