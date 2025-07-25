let idleTimeout = null;
const IDLE_TIME = 2 * 60 * 1000;

function resetIdleTimer() {
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => alert('Ayo bro you still there? You have been idle for 2 minutes.'), IDLE_TIME);
}

export { resetIdleTimer };