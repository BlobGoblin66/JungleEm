// ===============================
// AUDIO CONTEXT (ENGINE)
// ===============================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ===============================
// NOTIFICATION SOUND
// ===============================
const notificationAudio = new Audio("audio/notification.mp3");
notificationAudio.volume = 0.8;

// ===============================
// MODULAR SOUND DEFINITIONS
// ===============================
const sounds = {
  sound1: { file: "audio/RunningWater.mp3", source: null, gain: audioCtx.createGain(), loaded: false, volume: 0.4 },
  sound2: { file: "audio/Drone.mp3", source: null, gain: audioCtx.createGain(), loaded: false, volume: 0.4 },
  sound3: { file: "audio/Melody.mp3", source: null, gain: audioCtx.createGain(), loaded: false, volume: 0.4 },
};

// Connect gain nodes
Object.values(sounds).forEach(s => { s.gain.gain.value = 0; s.gain.connect(audioCtx.destination); });

// ===============================
// LOAD + START SOUND
// ===============================
async function loadSound(name) {
  const sound = sounds[name];
  if (sound.loaded) return;

  const response = await fetch(sound.file);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true;

  source.connect(sound.gain);
  source.start(0);

  sound.source = source;
  sound.loaded = true;
}

// ===============================
// FADE SOUND
// ===============================
function fadeSound(name, targetVolume, duration = 3) {
  const sound = sounds[name];
  if (!sound) return;

  const now = audioCtx.currentTime;
  sound.gain.gain.cancelScheduledValues(now);
  sound.gain.gain.setValueAtTime(sound.gain.gain.value, now);
  sound.gain.gain.linearRampToValueAtTime(targetVolume, now + duration);
}

// ===============================
// TOGGLE SOUND ON/OFF
// ===============================
async function toggleSound(name, on) {
  if (!sounds[name]) return;

  if (audioCtx.state === "suspended") await audioCtx.resume();
  if (!sounds[name].loaded) await loadSound(name);

  fadeSound(name, on ? sounds[name].volume : 0, 3);
}

// ===============================
// SET INDIVIDUAL VOLUME
// ===============================
function setVolume(name, value) {
  if (!sounds[name]) return;
  sounds[name].volume = parseFloat(value);
  if (sounds[name].source) fadeSound(name, sounds[name].volume, 0.1);
}

// ===============================
// GLOBAL FADE
// ===============================
function fadeAllOut() { Object.keys(sounds).forEach(name => fadeSound(name, 0)); }

// ===============================
// TIMER LOGIC
// ===============================
let workMinutes = 25;
let breakMinutes = 5;
let isWorkSession = true;
let timeRemaining = workMinutes * 60;
let timerInterval = null;

const timeEl = document.getElementById("time");
const phaseEl = document.getElementById("phase");

function updateDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // 1. Update the time on the actual webpage
  timeEl.textContent = timeString;

  // 2. NEW LINE: Update the text in the browser tab
  document.title = `(${timeString}) Study Timer`;
  
}

// Ensure the screen shows 25:00 immediately when the page loads
updateDisplay();

// ===============================
// BUTTON CLICK HANDLERS
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const modeButtons = document.querySelectorAll(".mode-selector button");

  // Highlight the default button (25/5)
  modeButtons[0].classList.add("active");

  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      // 1. Visual change: Move the glow to the clicked button
      modeButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      // 2. Logic change: Update the minutes based on the button's data tags
      workMinutes = Number(button.dataset.work);
      breakMinutes = Number(button.dataset.break);

      // 3. Reset the timer to the new start time
      isWorkSession = true;
      phaseEl.textContent = "Focus";
      document.body.classList.remove("break-mode");
      timeRemaining = workMinutes * 60;
      
      // 4. Stop any running timer so it doesn't act weird
      clearInterval(timerInterval);
      timerInterval = null;

      updateDisplay();
    });
  });
});

document.getElementById("start").addEventListener("click", () => {
  if (timerInterval) return; // Prevent multiple timers running at once

  timerInterval = setInterval(() => {
    timeRemaining--;
    
    if (timeRemaining < 0) {
      notificationAudio.play();
      isWorkSession = !isWorkSession;
    if (isWorkSession) {
          document.body.classList.remove("break-mode");
          phaseEl.textContent = "Focus";
      } else {
          document.body.classList.add("break-mode");
          phaseEl.textContent = "Break";
      }

      timeRemaining = (isWorkSession ? workMinutes : breakMinutes) * 60;
    }

    updateDisplay();
  }, 1000);
});

document.getElementById("stop").addEventListener("click", () => {
  // 1. Stop the clock
  clearInterval(timerInterval);
  timerInterval = null;
  document.body.classList.remove("break-mode");

  // 2. Reset the time display
  timeRemaining = (isWorkSession ? workMinutes : breakMinutes) * 60;
  updateDisplay();

  // 3. Fade out the audio engine
  fadeAllOut();

  // 4. NEW: Find all checkboxes and uncheck them
  const toggles = document.querySelectorAll('#sound-panel input[type="checkbox"]');
  toggles.forEach(checkbox => {
    checkbox.checked = false;
  });
});
