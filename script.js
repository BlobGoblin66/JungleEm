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
  sound1: {
    file: "audio/RunningWater.mp3",
    source: null,
    gain: audioCtx.createGain(),
    loaded: false
  },
  sound2: {
    file: "audio/Drone.mp3",
    source: null,
    gain: audioCtx.createGain(),
    loaded: false
  },
  sound3: {
    file: "audio/Melody.mp3",
    source: null,
    gain: audioCtx.createGain(),
    loaded: false
  },
};

// ===============================
// INITIAL GAIN SETUP
// ===============================
Object.values(sounds).forEach(sound => {
  sound.gain.gain.value = 0; // start silent
  sound.gain.connect(audioCtx.destination);
});

// ===============================
// LOAD + START A SOUND (ONCE)
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

// Ensure silence before start
const now = audioCtx.currentTime;
sound.gain.gain.setValueAtTime(0, now);

source.connect(sound.gain);
source.start(now);


  sound.source = source;
  sound.loaded = true;
}

// ===============================
// FADE HELPERS
// ===============================
function fadeSound(name, targetVolume, duration = 3) {
  const sound = sounds[name];
  const now = audioCtx.currentTime;

  sound.gain.gain.cancelScheduledValues(now);

  // Avoid exponential ramp to zero (not allowed)
  const safeTarget = Math.max(targetVolume, 0.001);

  sound.gain.gain.exponentialRampToValueAtTime(
    safeTarget,
    now + duration
  );
}

// ===============================
// TOGGLE SOUND ON / OFF
// ===============================
async function toggleSound(name, on) {
  if (!sounds[name]) return;

  // Browser autoplay safety
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  // Load sound on first interaction
  if (!sounds[name].loaded) {
    await loadSound(name);
  }

  fadeSound(name, on ? 0.4 : 0, 3);
}

// ===============================
// OPTIONAL: GLOBAL CONTROLS
// ===============================

// Fade everything out (e.g. break time)
function fadeAllOut() {
  Object.keys(sounds).forEach(name => fadeSound(name, 0));
}

// Fade everything in (if already toggled on)
function fadeAllIn(volume = 0.4) {
  Object.keys(sounds).forEach(name => fadeSound(name, volume));
}


// adding timer functionality - ctrl f for "Minimal Pomodoro timer (drop-in fix)" in chat to find section

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

let elapsedTime = 0;
let timerInterval = null;
let phase = "focus"; // "focus" | "break"

const timeDisplay = document.getElementById("time");
const phaseDisplay = document.getElementById("phase");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");


// see previous note, ctrl f for 'display update' for this section below

function updateTimerDisplay() {
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  timeDisplay.textContent =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;

  phaseDisplay.textContent =
    phase === "focus" ? "Focus" : "Break";
}

updateTimerDisplay();

// adding phase switching logic

function switchPhase() {
  notificationAudio.currentTime = 0;
  notificationAudio.play();

  if (phase === "focus") {
    phase = "break";
    elapsedTime = 0;
    fadeAllOut(); // silence ambience during break
  } else {
    phase = "focus";
    elapsedTime = 0;
  }

  updateTimerDisplay();
}

// adding timer button ctrl f "start button (this is the missing piece)

startBtn.addEventListener("click", () => {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    elapsedTime++;
    updateTimerDisplay();

    if (
      (phase === "focus" && elapsedTime >= FOCUS_DURATION) ||
      (phase === "break" && elapsedTime >= BREAK_DURATION)
    ) {
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
});

