let mode = "focus"; // focus | break
let timeLeft = 25 * 60;
let timer = null;

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            switchMode();
        }
    }, 1000);
}

function switchMode() {
    clearInterval(timer);

    if (mode === "focus") {
        mode = "break";
        timeLeft = 5 * 60;
        playBreakSound();
    } else {
        mode = "focus";
        timeLeft = 25 * 60;
        playFocusSound();
    }

    startTimer();
}
