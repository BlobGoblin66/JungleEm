// ===============================
// AUDIO CONTEXT
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
  sound1: { file: "audio/RunningWater.mp3", source: null, gain: audioCtx.createGain(), loaded: false },
  sound2: { file: "audio/Drone.mp3", source: null, gain: audioCtx.createGain(), loaded: false },
  sound3: { file: "audio/Melody.mp3", source: null, gain: audioCtx.createGain(), loaded: false }
};

// Connect gains and start silent
Object.values(sounds).forEach(s => {
  s.gain.gain.value = 0;
  s.gain.connect(audioCtx.destination);
});

// ===============================
// LOAD SOUND
// ===============================
async function loadSound(name) {
  const s = sounds[name];
  if (s.loaded) return;

  const response = await fetch(s.file);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true;

  const now = audioCtx.currentTime;
  s.gain.gain.setValueAtTime(0, now);

  source.connect(s.gain);
  source.start(now);

  s.source = source;
  s.loaded = true;
}

// ===============================
// FADE HELPER
// ===============================
function fadeSound(name, targetVolume, duration = 3) {
  const s = sounds[name];
  if (!s) return;

  const now = audioCtx.currentTime;
  s.gain.gain.cancelScheduledValues(now);
  s.gain.gain.setValueAtTime(s.gain.gain.value, now);
  s.gain.gain.linearRampToValueAtTime(targetVolume, now + duration);
}

// ===============================
// TOGGLE SOUND ON/OFF
// ===============================
async function toggleSound(name, on) {
  if (!sounds[name]) return;
  if (audioCtx.state === "suspended") await audioCtx.resume();
  if (!sounds[name].loaded) await loadSound(name);
  fadeSound(name, on ? sounds[name].gain.gain.value || 0.4 : 0, 3);
}

// ===============================
// SET INDIVIDUAL VOLUME
// ===============================
function setVolume(name, value) {
  const s = sounds[name];
  if (!s) return;
  s.gain.gain.setValueAtTime(value, audioCtx.currentTime);
}

// ===============================
// GLOBAL FADE CONTROLS
// ===============================
function fadeAllOut() { Object.keys(sounds).forEach(n => fadeSound(n, 0)); }
function fadeAllIn(volume = 0.4) { Object.keys(sounds).forEach(n => fadeSound(n, volume)); }

// ===============================
// TIMER
// ===============================
const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

let elapsedTime = 0;
let timerInterval = null;
let phase = "focus";

const timeDisplay = document.getElementById("time");
const phaseDisplay = document.getElementById("phase");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");

function updateTimerDisplay() {
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2,"0")}`;
  phaseDisplay.textContent = phase === "focus" ? "Focus" : "Break";
}

function switchPhase() {
  notificationAudio.currentTime = 0;
  notificationAudio.play();

  if (phase === "focus") {
    phase = "break";
    elapsedTime = 0;
    fadeAllOut();
    document.body.classList.add("break");
  } else {
    phase = "focus";
    elapsedTime = 0;
    document.body.classList.remove("break");
  }
  updateTimerDisplay();
}

startBtn.addEventListener("click", () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    elapsedTime++;
    updateTimerDisplay();
    if ((phase === "focus" && elapsedTime >= FOCUS_DURATION) ||
        (phase === "break" && elapsedTime >= BREAK_DURATION)) {
      switchPhase();
    }
  }, 1000);
});

stopBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval = null;
  phase = "focus";
  elapsedTime = 0;
  updateTimerDisplay();
  fadeAllOut();
  document.body.classList.remove("break");
});
