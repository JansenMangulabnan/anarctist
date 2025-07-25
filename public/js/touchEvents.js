import { scheduleSave } from './utils/save.js';
import { saveCanvasPosition, getCanvasPos } from './canvas.js';

function touchEvents(canvas, ctx) {
    const container = document.getElementById('canvas-container');
    let isPanning = false, panStartX = 0, panStartY = 0, containerStartX = 0, containerStartY = 0;
    let currentStroke = null, drawing = false, lastX = 0, lastY = 0;

    // 1-finger drawing functionality
    canvas.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;

        drawing = true;
        window._canvasDrawing = true;

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        lastX = (touch.clientX - rect.left) * (canvas.width / rect.width);
        lastY = (touch.clientY - rect.top) * (canvas.height / rect.height);

        currentStroke = {
            color: ctx.strokeStyle,
            width: ctx.lineWidth,
            path: [{ x: lastX, y: lastY }]
        };
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        if (!drawing || e.touches.length !== 1) return;
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        lastX = x;
        lastY = y;
        if (currentStroke) {
            const last = currentStroke.path[currentStroke.path.length - 1];
            if (!last || last.x !== x || last.y !== y) {
                currentStroke.path.push({ x, y });
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchend', async () => {
        if (!drawing) return;

        drawing = false;
        window._canvasDrawing = false;
        if (currentStroke && currentStroke.path.length > 1) {
            scheduleSave(currentStroke);
        }
        currentStroke = null;
    });

    canvas.addEventListener('touchcancel', async () => {
        if (!drawing) return;

        drawing = false;
        window._canvasDrawing = false;
        if (currentStroke && currentStroke.path.length > 1) {
            scheduleSave(currentStroke);
        }
        currentStroke = null;
    });

    // 2-finger panning functionality
    document.addEventListener('touchstart', e => {
        if (e.touches.length !== 2) return;
        e.preventDefault();

        isPanning = true;
        panStartX = e.touches[0].clientX;
        panStartY = e.touches[0].clientY;

        const pos = getCanvasPos(container);
        containerStartX = pos.left;
        containerStartY = pos.top;
    }, { passive: false });

    document.addEventListener('touchmove', e => {
        if (!isPanning || e.touches.length !== 2) return;
        e.preventDefault();

        const dx = e.touches[0].clientX - panStartX;
        const dy = e.touches[0].clientY - panStartY;

        container.style.left = (containerStartX + dx) + 'px';
        container.style.top = (containerStartY + dy) + 'px';
        container.style.transform = '';
    }, { passive: false });

    document.addEventListener('touchend', e => {
        if (isPanning && e.touches.length < 2) {
            isPanning = false;
            saveCanvasPosition(container.style.left, container.style.top);
        }
    }, { passive: false });

    document.addEventListener('touchcancel', () => {
        if (!isPanning) return;

        isPanning = false;
        saveCanvasPosition(container.style.left, container.style.top);
    }, { passive: false });
}

export { touchEvents };