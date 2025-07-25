const strokeQueue = [];
let isSaving = false;

async function queueSave() {
    if (isSaving || strokeQueue.length === 0) return;

    isSaving = true;
    while (strokeQueue.length > 0) {
        const stroke = strokeQueue.shift();
        // await saveCanvasStrokes(stroke);
    }
    isSaving = false;
}

function scheduleSave(stroke) {
    if (!stroke || stroke.path.length <= 1) return;
    strokeQueue.push(stroke);
    queueSave();
}

export { scheduleSave };