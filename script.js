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
// TIMER
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
  timeEl.textContent =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

document.querySelectorAll(".mode-selector button").forEach(button => {
  button.addEventListener("click", () => {
    workMinutes = Number(button.dataset.work);
    breakMinutes = Number(button.dataset.break);

    isWorkSession = true;
    timeRemaining = workMinutes * 60;
    clearInterval(timerInterval);
    timerInterval = null;

    document
      .querySelectorAll(".mode-selector button")
      .forEach(b => b.classList.remove("active"));

    button.classList.add("active");

    updateDisplay();
  });
});


document.getElementById("start").addEventListener("click", () => {
  if (timerInterval) return;

timerInterval = setInterval(() => {
  if (--timeRemaining <= 0) {
    isWorkSession = !isWorkSession;
    timeRemaining = (isWorkSession ? workMinutes : breakMinutes) * 60;
  }

  updateDisplay();
}, 1000);
});

updateDisplay();

document.getElementById("stop").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;

  timeRemaining = (isWorkSession ? workMinutes : breakMinutes) * 60;
  updateDisplay();

  fadeAllOut();
});

