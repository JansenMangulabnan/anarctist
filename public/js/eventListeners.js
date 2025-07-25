import { mouseEvents } from './mouseEvents.js';
import { touchEvents } from './touchEvents.js';
import { buttonEvents } from './buttonEvents.js';
import { colorEvents, toggleColorPicker } from './color.js';
import { resetIdleTimer } from './utils/timer.js';

function eventListeners(canvas, ctx) {
    mouseEvents(canvas, ctx);
    touchEvents(canvas, ctx);
    buttonEvents(canvas, ctx);
    colorEvents(ctx);
    toggleColorPicker();

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove'].forEach(e => {
        window.addEventListener(e, resetIdleTimer, { passive: true });
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
}

export { eventListeners };