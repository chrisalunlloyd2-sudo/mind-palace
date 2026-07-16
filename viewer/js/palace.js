/* Build palace map from palace.json and manage room interactions */

let palace = { nodes: [], edges: [] };
let roomLookup = {};
let doorLookup = [];

async function loadPalace() {
    const res = await fetch('data/palace.json?v=' + Date.now());
    palace = await res.json();
    roomLookup = {};
    palace.nodes.forEach(n => roomLookup[n.id] = n);
    return palace;
}

function buildMap() {
    const repos = palace.nodes.filter(n => n.type === 'repo_room');
    const hallWidth = 7;
    const hallLength = repos.length * 3 + 8;
    const grid = Array(hallLength).fill(0).map(() => Array(hallWidth).fill(1));

    // Carve main hallway
    for (let y = 0; y < hallLength; y++) {
        for (let x = 1; x < hallWidth - 1; x++) grid[y][x] = 0;
    }

    // Atrium at south end
    for (let y = hallLength - 4; y < hallLength; y++) {
        for (let x = -2; x < hallWidth + 2; x++) {
            if (y >= 0 && y < hallLength && x >= 0 && x < hallWidth) grid[y][x] = 0;
        }
    }

    doorLookup = [];
    repos.forEach((repo, i) => {
        const side = i % 2 === 0 ? 0 : hallWidth - 1;
        const y = 3 + i * 3;
        const rw = 3, rh = 3;
        const rx = side === 0 ? -rw + 1 : side;
        for (let ry = y; ry < y + rh; ry++) {
            for (let rrx = rx; rrx < rx + rw; rrx++) {
                if (ry >= 0 && ry < hallLength && rrx >= 0 && rrx < grid[0].length) grid[ry][rrx] = 0;
            }
        }
        const doorX = side === 0 ? 0.5 : hallWidth - 1.5;
        const doorY = y + 1.5;
        doorLookup.push({ x: doorX, y: doorY, node: repo, side });
    });

    return { grid, hallWidth, hallLength };
}

function getRoomNear(x, y, radius = 1.6) {
    for (const d of doorLookup) {
        const dx = d.x - x;
        const dy = d.y - y;
        if (dx * dx + dy * dy < radius * radius) return d;
    }
    return null;
}

function getFacingDoor(engine, maxDist = 3.5) {
    const hit = engine.castRay(engine.player.angle);
    for (const d of doorLookup) {
        const dx = d.x - hit.x;
        const dy = d.y - hit.y;
        if (dx * dx + dy * dy < 1.0 && hit.dist < maxDist) return d;
    }
    return null;
}

function populateRoomCard(node) {
    const p = node.payload || {};
    document.getElementById('rc-title').textContent = node.label;
    document.getElementById('rc-type').textContent = node.type.replace('_', ' ');
    document.getElementById('rc-desc').textContent = p.description || 'No description.';
    document.getElementById('rc-meta').textContent = `${p.language || '?'} • ⭐ ${p.stars ?? 0} • updated ${p.updated || '?'}`;
    document.getElementById('rc-open').onclick = () => window.open(p.url, '_blank');
    const card = document.getElementById('room-card');
    card.style.display = 'block';
}

function hideRoomCard() {
    document.getElementById('room-card').style.display = 'none';
}

window.palaceApi = { loadPalace, buildMap, getRoomNear, getFacingDoor, populateRoomCard, hideRoomCard, roomLookup, doorLookup };
