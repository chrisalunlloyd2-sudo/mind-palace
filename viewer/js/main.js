async function main() {
    const canvas = document.getElementById('game');
    const engine = new RayEngine(canvas);
    window.engine = engine;
    await palaceApi.loadPalace();
    const { grid, hallWidth } = palaceApi.buildMap();
    engine.loadMap(grid);
    engine.setSpawn(hallWidth / 2, grid.length - 2.5, -Math.PI / 2);
    engine.onMove = (x, y) => {
        const near = palaceApi.getRoomNear(x, y);
        if (near) palaceApi.populateRoomCard(near.node);
        else palaceApi.hideRoomCard();
    };
    engine.start();
    initAuth();
    document.getElementById('enter-btn').onclick = () => {
        document.getElementById('blocker').style.display = 'none';
        canvas.requestPointerLock?.();
    };
    document.getElementById('btn-add-book').onclick = () => alert('Add book: SOV data integration TBD');
    document.getElementById('btn-edit-wall').onclick = () => alert('Edit wall: TBD');
    document.getElementById('btn-basement').onclick = () => {
        if (!window.isArchivist()) return alert('Basement locked. Press P to authenticate.');
        alert('Basement: real DB/KV/KG integration TBD');
    };
}
main().catch(console.error);
