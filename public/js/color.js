import { setIsEraserMode, updateLineWidth } from "./canvas.js";

function toggleColorPicker() {
    const collapseBtn = document.getElementById('toggleCollapse');
    const colorOptions = document.querySelector('.color-options');
    const svgDown = document.getElementById('collapseDown');
    const svgUp = document.getElementById('collapseUp');

    collapseBtn.addEventListener('click', () => {
        const collapsed = colorOptions.classList.toggle('collapsed');
        if (collapsed) {
            svgDown.style.display = 'none';
            svgUp.style.display = '';
            collapseBtn.style.border = '2px solid #333';
        } else {
            svgDown.style.display = '';
            svgUp.style.display = 'none';
            collapseBtn.style.border = '';
        }
    });
}

function highlightSelectedColor(selectedBtn) {
    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(btn => btn.classList.remove('selected'));
    if (selectedBtn) selectedBtn.classList.add('selected');
}

function colorEvents(ctx) {
    const colorButtons = document.querySelectorAll('.color-btn');
    const customColorPicker = document.getElementById('customColor');
    highlightSelectedColor(document.getElementById('colorBtnDefault'));

    // add event listeners to color buttons
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            ctx.strokeStyle = btn.dataset.color;
            setIsEraserMode(btn.id === 'eraserStroke');

            highlightSelectedColor(btn);
            updateLineWidth(ctx);
        });
    });

    // custom color picker
    customColorPicker.addEventListener('input', () => {
        ctx.strokeStyle = customColorPicker.value;
        setIsEraserMode(false);

        updateLineWidth(ctx);
        highlightSelectedColor(null);
    });
}

export { colorEvents, toggleColorPicker };