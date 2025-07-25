function decompressPath(pathStr) {
    return pathStr.split(';').map(pair => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
    });
}

export { decompressPath };