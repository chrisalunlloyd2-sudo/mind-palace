/* Main MindPalace entry point */

async function main() {
    const canvas = document.getElementById('game');
    const engine = new RayEngine(canvas);
    window.engine = engine;

    await palaceApi.loadPalace();
    const { grid, hallWidth } = palaceApi.buildMap();
    engine.loadMap(grid);
    // Spawn in atrium (south end)
    engine.setSpawn(hallWidth / 2, grid.length - 2.5, -Math.PI / 2);

    engine.onMove = (x, y) => {
        const near = palaceApi.getRoomNear(x, y);
        if (near) {
            palaceApi.populateRoomCard(near.node);
        } else {
            palaceApi.hideRoomCard();
        }
    };

    engine.start();
    initAuth();

    document.getElementById('enter-btn').onclick = () => {
        document.getElementById('blocker').style.display = 'none';
        canvas.requestPointerLock?.();
    };

    // Edit actions (stubbed; real logic later)
    document.getElementById('btn-add-book').onclick = () => alert('Add book: connect to real SOV data (TBD)');
    document.getElementById('btn-edit-wall').onclick = () => alert('Edit wall metadata: TBD');
    document.getElementById('btn-basement').onclick = () => {
        if (!window.isArchivist()) {
            alert('Basement is locked. Press P to authenticate.');
            return;
        }
        alert('Basement portal: real DB/KV/KG integration TBD');
    };
}

main().catch(console.error);
