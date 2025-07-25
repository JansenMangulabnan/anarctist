import { zoomIn, zoomOut } from './zoom.js';
import { centerCanvas, saveCanvasImage, updateLineWidth } from './canvas.js';

function buttonEvents(canvas, ctx) {
    const centerCanvasBtn = document.getElementById('centerCanvas');
    const centerCanvasMinBtn = document.getElementById('centerCanvasMin');
    const saveCanvasBtn = document.getElementById('saveCanvas');
    const saveCanvasMinBtn = document.getElementById('saveCanvasMin');
    const strokeSizeSpan = document.getElementById('strokeSize');

    document.getElementById('zoomIn').addEventListener('click', () => {
        zoomIn(canvas);
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        zoomOut(canvas);
    });

    if (centerCanvasBtn) centerCanvasBtn.addEventListener('click', () => centerCanvas(canvas));
    if (centerCanvasMinBtn) centerCanvasMinBtn.addEventListener('click', () => centerCanvas(canvas));

    if (saveCanvasBtn) saveCanvasBtn.addEventListener('click', () => saveCanvasImage(canvas));
    if (saveCanvasMinBtn) saveCanvasMinBtn.addEventListener('click', () => saveCanvasImage(canvas));

    document.getElementById('decreaseStrokeSize').addEventListener('click', () => {
        let currentSize = parseInt(strokeSizeSpan.textContent, 10);
        if (currentSize > 1) {
            currentSize--;
            strokeSizeSpan.textContent = currentSize;
            updateLineWidth(ctx);
        }
    });

    document.getElementById('increaseStrokeSize').addEventListener('click', () => {
        let currentSize = parseInt(strokeSizeSpan.textContent, 10);
        if (currentSize < 20) {
            currentSize++;
            strokeSizeSpan.textContent = currentSize;
            updateLineWidth(ctx);
        }
    });
}

export { buttonEvents };