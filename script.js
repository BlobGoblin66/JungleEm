// ===============================
// AUDIO CONTEXT (ENGINE)
// ===============================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ===============================
// MODULAR SOUND DEFINITIONS
// ===============================
const sounds = {
  sound1: {
    file: "audio/sound1.mp3",
    source: null,
    gain: audioCtx.createGain(),
    loaded: false
  },
  sound2: {
    file: "audio/sound2.mp3",
    source: null,
    gain: audioCtx.createGain(),
    loaded: false
  },
  sound3: {
    file: "audio/sound3.mp3",
    source: null,
    gain: audioCtx.createGain(),
    loaded: false
  },
  sound4: {
    file: "audio/sound4.mp3",
    source: null,
    gain: audioCtx.createGain(),
    loaded: false
  }
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

  source.connect(sound.gain);
  source.start(0);

  sound.source = source;
  sound.loaded = true;
}

// ===============================
// FADE HELPERS
// ===============================
function fadeSound(name, targetVolume, duration = 1.5) {
  const sound = sounds[name];
  const now = audioCtx.currentTime;

  sound.gain.gain.cancelScheduledValues(now);
  sound.gain.gain.linearRampToValueAtTime(
    targetVolume,
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

  fadeSound(name, on ? 0.4 : 0);
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
