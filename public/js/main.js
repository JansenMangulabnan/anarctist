import { eventListeners } from './eventListeners.js';
import { loadCanvasPosition, loadCanvasStrokes } from './canvas.js';
import { applyZoom, updateZoomButtons, setZoomLevel } from './zoom.js';

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';

    const storedZoom = localStorage.getItem('canvasZoomLevel');
    if (storedZoom !== null) setZoomLevel(parseFloat(storedZoom));

    eventListeners(canvas, ctx);
    loadCanvasPosition();
    applyZoom(canvas);
    updateZoomButtons();

    let lastStrokeId = await loadCanvasStrokes(canvas, ctx, { useCache: false });

    alert('The drawing phase has ended. The canvas is now read-only. You can still view the strokes but cannot draw anymore.');

    setInterval(async () => {
        if (!window._canvasDrawing) {
            lastStrokeId = await loadCanvasStrokes(canvas, ctx, { startAt: lastStrokeId + 1 });
        }
    }, 10000000000);
});