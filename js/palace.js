let palace = { nodes: [], edges: [] };
let doorLookup = [];
async function loadPalace() {
    const res = await fetch('data/palace.json?v=' + Date.now());
    palace = await res.json();
    return palace;
}
function buildMap() {
    const repos = palace.nodes.filter(n => n.type === 'repo_room');
    const hallWidth = 7;
    const hallLength = repos.length * 3 + 8;
    const grid = Array(hallLength).fill(0).map(() => Array(hallWidth).fill(1));
    for (let y = 0; y < hallLength; y++) {
        for (let x = 1; x < hallWidth - 1; x++) grid[y][x] = 0;
    }
    for (let y = hallLength - 4; y < hallLength; y++) {
        for (let x = 0; x < hallWidth; x++) grid[y][x] = 0;
    }
    doorLookup = [];
    repos.forEach((repo, i) => {
        const side = i % 2 === 0 ? 0 : hallWidth - 1;
        const y = 3 + i * 3;
        const rw = 3, rh = 3;
        const rx = side === 0 ? -rw + 1 : side;
        for (let ry = y; ry < y + rh; ry++) {
            for (let rrx = rx; rrx < rx + rw; rrx++) {
                if (ry >= 0 && ry < hallLength && rrx >= 0 && rrx < hallWidth) grid[ry][rrx] = 0;
            }
        }
        doorLookup.push({ x: side === 0 ? 0.5 : hallWidth - 1.5, y: y + 1.5, node: repo, side });
    });
    return { grid, hallWidth, hallLength };
}
function getRoomNear(x, y, radius = 1.6) {
    for (const d of doorLookup) {
        const dx = d.x - x, dy = d.y - y;
        if (dx*dx + dy*dy < radius*radius) return d;
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
    document.getElementById('room-card').style.display = 'block';
}
function hideRoomCard() { document.getElementById('room-card').style.display = 'none'; }
window.palaceApi = { loadPalace, buildMap, getRoomNear, populateRoomCard, hideRoomCard };
