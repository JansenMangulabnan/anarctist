import { applyZoom, updateZoomButtons, setZoomLevel, getMinZoom } from "./zoom.js";
import { decompressPath } from './utils/decompressPath.js';

let isEraserMode = false;

function setIsEraserMode(mode) {
    isEraserMode = mode;
}

function getCanvasPos(container) {
    const style = window.getComputedStyle(container);
    return {
        left: parseInt(style.left, 10),
        top: parseInt(style.top, 10)
    };
}

function centerCanvas(canvas) {
    const container = document.getElementById('canvas-container');
    container.style.left = '50%';
    container.style.top = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    setZoomLevel(getMinZoom());

    applyZoom(canvas);
    saveCanvasPosition(container.style.left, container.style.top);
    updateZoomButtons();
}

function saveCanvasPosition(left, top) {
    localStorage.setItem('canvasPosition', JSON.stringify({ left, top }));
}

function loadCanvasPosition() {
    const pos = localStorage.getItem('canvasPosition');
    if (!pos) return console.warn('No canvas position found in localStorage');

    const { left, top } = JSON.parse(pos);
    const container = document.getElementById('canvas-container');
    container.style.left = left;
    container.style.top = top;
    container.style.transform = '';
}

async function saveCanvasStrokes(stroke) {
    try {
        const response = await fetch('/api/save_stroke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stroke)
        });

        const data = await response.json();
        if (response.status === 429) return alert('You are being rate limited. Please wait a moment before drawing again.');
        if (!response.ok) return console.error(data.error);

        stroke.id = data.id;
    } catch (e) {
        console.error(e);
    }
}

// function compressPath(path) {
//     // [{x: 100, y: 150}, {x: 101, y: 151}] to "100,150;101,151"
//     return path.map(point => `${point.x},${point.y}`).join(';');
// }

async function loadCanvasStrokes(canvas, ctx, { useCache = true, startAt = 0 } = {}) {
    try {
        const cachedLastStrokeId = parseInt(localStorage.getItem('lastStrokeId'), 10) || 0;
        const effectiveStartAt = useCache ? startAt : 0;

        const params = new URLSearchParams({ startAt: effectiveStartAt });
        const response = await fetch(`/api/load_strokes?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            console.error(data.error);
            return useCache ? cachedLastStrokeId : 0;
        }

        const newStrokes = (data.strokes || []).map(stroke => ({
            ...stroke,
            path: decompressPath(stroke.path),
        }));

        const lastStrokeId = newStrokes.length > 0 ? newStrokes[newStrokes.length - 1].id : (useCache ? cachedLastStrokeId : 0);
        localStorage.setItem('lastStrokeId', lastStrokeId);

        renderStrokes(canvas, ctx, newStrokes);
        return lastStrokeId;
    } catch (e) {
        console.error(e);
        return useCache ? startAt : 0;
    }
}

function saveCanvasImage(canvas) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.fillStyle = '#fff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `AnarctistCanvas_${new Date().toISOString()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

function updateLineWidth(ctx) {
    const strokeSize = document.getElementById('strokeSize').textContent;
    const size = parseInt(strokeSize, 10);
    ctx.lineWidth = isEraserMode ? size * 10 : size;
    document.getElementById('eraserStroke').textContent = size * 10;
}

function renderStrokes(canvas, ctx, strokes, clearCanvas = false) {
    if (clearCanvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
        const path = stroke.path;
        if (!path.length) continue;

        ctx.save();
        ctx.strokeStyle = stroke.color || '#000';
        ctx.lineWidth = stroke.width || 2;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }

        ctx.stroke();
        ctx.restore();
    }
}

export { centerCanvas, updateLineWidth, saveCanvasStrokes, loadCanvasStrokes, saveCanvasPosition, loadCanvasPosition, getCanvasPos, saveCanvasImage, setIsEraserMode };