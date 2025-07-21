const strokeQueue = [];
let isSaving = false;

let idleTimeout = null;
const IDLE_TIME = 2 * 60 * 1000;

const ZOOM_STEP = 0.1;
const MAX_ZOOM = 3;
const MIN_ZOOM = 0.1;
let zoomLevel = MIN_ZOOM;

let isEraserMode = false;



function highlightSelectedColor(selectedBtn) {
    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => btn.classList.remove('selected'));
    if (selectedBtn) selectedBtn.classList.add('selected');
}

function updateLineWidth(ctx) {
    const strokeSize = document.getElementById('strokeSize').textContent;
    const size = parseInt(strokeSize, 10);
    ctx.lineWidth = isEraserMode ? size * 10 : size;
    document.getElementById('eraserStroke').textContent = size * 10;
}

function resetIdleTimer() {
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => alert('Ayo bro you still there? You have been idle for 2 minutes.'), IDLE_TIME);
}

function getViewportCenter() {
    return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
    };
}

function applyZoom(canvas, centerX = null, centerY = null) {
    const container = document.getElementById('canvas-container');
    const rect = container.getBoundingClientRect();

    let refX, refY;
    if (centerX !== null && centerY !== null) {
        refX = centerX;
        refY = centerY;
    } else {
        const viewportCenter = getViewportCenter();
        refX = viewportCenter.x;
        refY = viewportCenter.y;
    }

    // Calculate offset so the reference point stays at the same canvas point
    const prevScale = parseFloat(canvas.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || 1);
    const scale = zoomLevel;
    const containerLeft = parseFloat(container.style.left) || rect.left;
    const containerTop = parseFloat(container.style.top) || rect.top;
    const relX = refX - containerLeft;
    const relY = refY - containerTop;
    const newLeft = refX - relX * (scale / prevScale);
    const newTop = refY - relY * (scale / prevScale);

    canvas.style.transform = `scale(${zoomLevel})`;
    container.style.left = `${newLeft}px`;
    container.style.top = `${newTop}px`;
    container.style.transform = '';
    localStorage.setItem('canvasZoomLevel', zoomLevel);
    saveCanvasPosition(container.style.left, container.style.top);
}

function centerCanvas(canvas) {
    const container = document.getElementById('canvas-container');
    container.style.left = '50%';
    container.style.top = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    zoomLevel = MIN_ZOOM;

    applyZoom(canvas);
    saveCanvasPosition(container.style.left, container.style.top);
    updateZoomButtons();
}

function scheduleSave(stroke) {
    if (!stroke || stroke.path.length <= 1) return;
    strokeQueue.push(stroke);
    queueSave();
}

async function queueSave() {
    if (isSaving || strokeQueue.length === 0) return;

    isSaving = true;
    while (strokeQueue.length > 0) {
        const stroke = strokeQueue.shift();
        await saveCanvasStrokes(stroke);
    }
    isSaving = false;
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

function decompressPath(pathStr) {
    return pathStr.split(';').map(pair => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
    });
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

function getCanvasPos(container) {
    const style = window.getComputedStyle(container);
    return {
        left: parseInt(style.left, 10),
        top: parseInt(style.top, 10)
    };
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

function zoomIn(canvas) {
    zoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
    localStorage.setItem('canvasZoomLevel', zoomLevel);
    applyZoom(canvas); // Use viewport overlap center
    updateZoomButtons();
}

function zoomOut(canvas) {
    zoomLevel = Math.round(Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM) * 10) / 10;
    localStorage.setItem('canvasZoomLevel', zoomLevel);
    applyZoom(canvas); // Use viewport overlap center
    updateZoomButtons();
}

function updateZoomButtons() {
    document.getElementById('zoomIn').disabled = zoomLevel >= MAX_ZOOM;
    document.getElementById('zoomOut').disabled = zoomLevel <= MIN_ZOOM;
}

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

function buttonEvents(canvas, ctx) {
    const centerCanvasBtn = document.getElementById('centerCanvas');
    const centerCanvasMinBtn = document.getElementById('centerCanvasMin');
    const saveCanvasBtn = document.getElementById('saveCanvas');
    const saveCanvasMinBtn = document.getElementById('saveCanvasMin');
    const strokeSizeSpan = document.getElementById('strokeSize');

    canvas.addEventListener('wheel', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        if (e.deltaY < 0) {
            zoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
        } else if (e.deltaY > 0) {
            zoomLevel = Math.round(Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM) * 10) / 10;
        }
        localStorage.setItem('canvasZoomLevel', zoomLevel);
        applyZoom(canvas, mouseX, mouseY); // Use mouse as center for wheel
        updateZoomButtons();
        e.preventDefault();
    }, { passive: false });

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

function colorEvents(ctx) {
    const colorButtons = document.querySelectorAll('.color-btn');
    const customColorPicker = document.getElementById('customColor');
    highlightSelectedColor(document.getElementById('colorBtnDefault'));

    // add event listeners to color buttons
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            ctx.strokeStyle = btn.dataset.color;
            isEraserMode = (btn.id === 'eraserStroke');

            highlightSelectedColor(btn);
            updateLineWidth(ctx);
        });
    });

    // custom color picker
    customColorPicker.addEventListener('input', () => {
        ctx.strokeStyle = customColorPicker.value;
        isEraserMode = false;

        updateLineWidth(ctx);
        highlightSelectedColor(null);
    });
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

function eventListeners(canvas, ctx) {
    mouseEvents(canvas, ctx);
    touchEvents(canvas, ctx);
    buttonEvents(canvas, ctx);
    colorEvents(ctx);

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove'].forEach(e => {
        window.addEventListener(e, resetIdleTimer, { passive: true });
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
}

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';

    const storedZoom = localStorage.getItem('canvasZoomLevel');
    if (storedZoom !== null) zoomLevel = parseFloat(storedZoom);

    eventListeners(canvas, ctx);
    loadCanvasPosition();
    applyZoom(canvas);
    updateZoomButtons();

    let lastStrokeId = await loadCanvasStrokes(canvas, ctx, { useCache: false });
    setInterval(async () => {
        if (!window._canvasDrawing) {
            lastStrokeId = await loadCanvasStrokes(canvas, ctx, { startAt: lastStrokeId + 1 });
        }
    }, 1000);
});