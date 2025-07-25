const ZOOM_STEP = 0.1;
const MAX_ZOOM = 3;
const MIN_ZOOM = 0.1;
let zoomLevel = MIN_ZOOM;

function getMinZoom() {
    return MIN_ZOOM;
}

function setZoomLevel(level) {
    zoomLevel = level;
}

function updateZoomButtons() {
    document.getElementById('zoomIn').disabled = zoomLevel >= MAX_ZOOM;
    document.getElementById('zoomOut').disabled = zoomLevel <= MIN_ZOOM;
}

function applyZoom(canvas) {
    canvas.style.transform = `scale(${zoomLevel})`;
    localStorage.setItem('canvasZoomLevel', zoomLevel);
}

function zoomIn(canvas) {
    zoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
    localStorage.setItem('canvasZoomLevel', zoomLevel);
    applyZoom(canvas);
    updateZoomButtons();
}

function zoomOut(canvas) {
    zoomLevel = Math.round(Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM) * 10) / 10;
    localStorage.setItem('canvasZoomLevel', zoomLevel);
    applyZoom(canvas);
    updateZoomButtons();
}

export { applyZoom, updateZoomButtons, setZoomLevel, zoomIn, zoomOut, getMinZoom };