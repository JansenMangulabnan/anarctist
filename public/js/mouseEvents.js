import { scheduleSave } from './utils/save.js';
import { getCanvasPos, saveCanvasPosition } from './canvas.js';

function mouseEvents(canvas, ctx) {
    const container = document.getElementById('canvas-container');
    const drawCanvas = document.getElementById('draw-canvas');
    let isDragging = false, dragStartX = 0, dragStartY = 0, containerStartX = 0, containerStartY = 0;
    let currentStroke = null, drawing = false;
    window._canvasDrawing = false;

    // mouse drawing functionality
    canvas.addEventListener('mousedown', e => {
        if (e.button !== 0) return;

        drawing = true;
        window._canvasDrawing = true;
        const x = e.offsetX;
        const y = e.offsetY;

        currentStroke = {
            color: ctx.strokeStyle,
            width: ctx.lineWidth,
            path: [{ x, y }]
        };
    });

    canvas.addEventListener('mousemove', e => {
        if (!drawing || !currentStroke || !currentStroke.path) return;

        const x = e.offsetX;
        const y = e.offsetY;
        const last = currentStroke.path[currentStroke.path.length - 1];
        if (last && last.x === x && last.y === y) return;

        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        currentStroke.path.push({ x, y });
    });

    canvas.addEventListener('mouseup', async e => {
        if (!drawing || e.button !== 0) return;

        drawing = false;
        window._canvasDrawing = false;

        if (currentStroke && currentStroke.path.length > 1) {
            scheduleSave(currentStroke);
        }
        currentStroke = null;
    });

    canvas.addEventListener('mouseleave', async () => {
        if (!drawing) return;

        drawing = false;
        window._canvasDrawing = false;
        if (currentStroke && currentStroke.path.length > 1) {
            scheduleSave(currentStroke);
        }
        currentStroke = null;

    });

    // right-click panning functionality
    drawCanvas.addEventListener('mouseenter', () => {
        if (!isDragging) document.body.style.cursor = 'crosshair';
    });

    drawCanvas.addEventListener('mouseleave', () => {
        if (!isDragging) document.body.style.cursor = 'grab';
    });

    document.addEventListener('mousedown', e => {
        if (e.button !== 2) return;

        isDragging = true;
        document.body.style.cursor = 'grabbing';
        drawCanvas.style.cursor = 'grabbing';

        dragStartX = e.clientX;
        dragStartY = e.clientY;
        const pos = getCanvasPos(container);
        containerStartX = pos.left;
        containerStartY = pos.top;

    });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;

        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        container.style.left = (containerStartX + dx) + 'px';
        container.style.top = (containerStartY + dy) + 'px';
        container.style.transform = '';

    });

    document.addEventListener('mouseup', e => {
        if (isDragging && e.button === 2) {
            isDragging = false;
            document.body.style.cursor = 'grab';
            drawCanvas.style.cursor = 'crosshair';
            saveCanvasPosition(container.style.left, container.style.top);
        }
    });
}

export { mouseEvents };