// -------------------------
// SETTINGS
// -------------------------
const FOCUS_TIME = 25 * 60; // seconds
const BREAK_TIME = 5 * 60;

// -------------------------
// STATE
// -------------------------
let mode = "focus"; // focus | break
let timeLeft = FOCUS_TIME;
let timer = null;
let running = false;

// -------------------------
// ELEMENTS
// -------------------------
const timeEl = document.getElementById("time");
const modeEl = document.getElementById("mode");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");

// -------------------------
// AUDIO
// -------------------------

const focusTracks = [
    "audio/JUNGLE1.mp3",
    "audio/JUNGLE2.mp3",
    "audio/JUNGLE3.mp3"
];
let focusSound = null;
const breakSound = new Audio("audio/JUNGLEBREAK.mp3");
const chime = new Audio("audio/NewspaperPageTurn4.wav");

focusSound.loop = true;
breakSound.loop = true;

// -------------------------
// FUNCTIONS
// -------------------------
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function startTimer() {
    if (running) return;
    running = true;

    playCurrentSound();

    timer = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            switchMode();
        }
    }, 1000);
}

function pauseTimer() {
    running = false;
    clearInterval(timer);
    focusSound.pause();
    breakSound.pause();
}

function resetTimer() {
    pauseTimer();
    mode = "focus";
    timeLeft = FOCUS_TIME;
    modeEl.textContent = "Focus";
    updateDisplay();
}

function switchMode() {
    clearInterval(timer);
    chime.play();

    if (mode === "focus") {
        mode = "break";
        timeLeft = BREAK_TIME;
        modeEl.textContent = "Break";
    } else {
        mode = "focus";
        timeLeft = FOCUS_TIME;
        modeEl.textContent = "Focus";
    }

    playCurrentSound();
    updateDisplay();
}

function playCurrentSound() {
    // stop anything currently playing
    if (focusSound) focusSound.pause();
    breakSound.pause();

    if (mode === "focus") {
        const randomTrack =
            focusTracks[Math.floor(Math.random() * focusTracks.length)];

        focusSound = new Audio(randomTrack);
        focusSound.loop = true;
        focusSound.play();
    } else {
        breakSound.currentTime = 0;
        breakSound.play();
    }
}


// -------------------------
// EVENTS
// -------------------------
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

// Init display
updateDisplay();
