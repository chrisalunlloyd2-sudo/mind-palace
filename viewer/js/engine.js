/* MindPalace v0.2 — Wolfenstein-style first-person hallway walker */
const WORLD_SCALE = 1;
const WALL_H = 64;
const FOV = Math.PI / 3;
const TURN_SPEED = 0.04;
const WALK_SPEED = 2.5;
const CELLS_PER_ROOM = 3; // each repo door is 3 grid cells wide

let canvas, ctx, width, height;
let keys = {};
let pos = { x: 1.5, y: 1.5, angle: 0 };
let rooms = []; // { x, y, w, h, node, leftDoor, rightDoor }
let map = [];   // 2D grid: 0 = hall, 1 = wall
let currentNode = null;
let auth = false;
let authPanel = null;

async function init() {
    canvas = document.getElementById('viewport');
    ctx = canvas.getContext('2d', { alpha: false });
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);
    document.addEventListener('click', tryPointer);

    authPanel = document.getElementById('auth-panel');
    document.getElementById('auth-btn').onclick = doAuth;
    document.getElementById('close-auth').onclick = () => { authPanel.style.display = 'none'; };

    const graph = await loadGraph();
    buildMap(graph);
    requestAnimationFrame(loop);
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

async function loadGraph() {
    const res = await fetch('graph.json?v=' + Date.now());
    return await res.json();
}

function tryPointer() {
    canvas.requestPointerLock?.();
}

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
        document.addEventListener('mousemove', look);
    } else {
        document.removeEventListener('mousemove', look);
    }
});

function look(e) {
    pos.angle += e.movementX * 0.003;
}

function buildMap(graph) {
    const hub = graph.nodes.find(n => n.type === 'zone_hub') || { id: 'hub', label: 'Hall' };
    const repos = graph.nodes.filter(n => n.type === 'repo_room' || n.type === 'project_hub');

    // Long hallway: cells wide = 4, length = enough for all repos + padding
    const hallWidth = 5;
    const hallLength = repos.length * CELLS_PER_ROOM + 6;
    map = Array(hallLength).fill(0).map(() => Array(hallWidth).fill(1));

    // Carve hall
    for (let y = 0; y < hallLength; y++) {
        for (let x = 1; x < hallWidth - 1; x++) {
            map[y][x] = 0;
        }
    }

    // Place repo rooms as alcoves on alternating sides
    rooms = [];
    repos.forEach((repo, i) => {
        const side = i % 2 === 0 ? 0 : hallWidth - 1; // left or right
        const y = 3 + i * CELLS_PER_ROOM;
        // Room extends out 3 cells from wall
        const rw = 3, rh = CELLS_PER_ROOM;
        const rx = side === 0 ? -rw + 1 : side;
        // Carve room cells and connecting doorway
        for (let ry = y; ry < y + rh; ry++) {
            for (let rx2 = rx; rx2 < rx + rw; rx2++) {
                if (ry >= 0 && ry < hallLength) {
                    if (!map[ry]) map[ry] = [];
                    map[ry][rx2] = 0;
                }
            }
        }
        // Door frame wall
        for (let ry = y - 1; ry < y + rh + 1; ry++) {
            if (ry >= 0 && ry < hallLength) {
                if (side === 0) {
                    map[ry][0] = (ry === y || ry === y + rh - 1) ? 1 : 0; // door open in middle
                } else {
                    map[ry][hallWidth - 1] = (ry === y || ry === y + rh - 1) ? 1 : 0;
                }
            }
        }
        rooms.push({
            x: rx, y: y, w: rw, h: rh,
            node: repo,
            doorX: side === 0 ? 0.5 : hallWidth - 1.5,
            doorY: y + rh / 2,
        });
    });

    // Spawn at start of hall
    pos.x = hallWidth / 2;
    pos.y = 1.5;
}

function update(dt) {
    if (document.pointerLockElement !== canvas) return;

    if (keys['KeyA'] || keys['ArrowLeft']) pos.angle -= TURN_SPEED;
    if (keys['KeyD'] || keys['ArrowRight']) pos.angle += TURN_SPEED;

    let move = 0;
    if (keys['KeyW'] || keys['ArrowUp']) move = WALK_SPEED * dt;
    if (keys['KeyS'] || keys['ArrowDown']) move = -WALK_SPEED * dt;

    if (move !== 0) {
        const nx = pos.x + Math.cos(pos.angle) * move;
        const ny = pos.y + Math.sin(pos.angle) * move;
        if (!isWall(nx, pos.y)) pos.x = nx;
        if (!isWall(pos.x, ny)) pos.y = ny;
    }

    // Detect nearby room
    let near = null;
    for (const r of rooms) {
        const dx = (r.doorX - pos.x);
        const dy = (r.doorY - pos.y);
        if (dx * dx + dy * dy < 1.5) near = r;
    }
    if (near && (!currentNode || currentNode.node.id !== near.node.id)) {
        currentNode = near;
        showRoom(near.node);
    }
}

function isWall(x, y) {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (!map[gy] || map[gy][gx] === undefined) return true;
    return map[gy][gx] === 1;
}

function showRoom(node) {
    document.getElementById('room-title').textContent = node.label;
    document.getElementById('room-type').textContent = node.type;
    const p = node.payload || {};
    document.getElementById('room-desc').textContent = p.description || '';
    document.getElementById('room-meta').textContent = `${p.language || '?'} • ⭐ ${p.stars ?? 0} • updated ${(p.updated || '').slice(0, 10)}`;
    const visitBtn = document.getElementById('visit-repo');
    visitBtn.onclick = () => window.open(p.url, '_blank');
    document.getElementById('room-panel').style.display = 'block';
}

function render() {
    // Floor / ceiling gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(0.5, '#1a1a3a');
    grad.addColorStop(0.5, '#101020');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const numRays = width / 2;
    for (let i = 0; i < numRays; i++) {
        const rayAngle = pos.angle - FOV / 2 + (i / numRays) * FOV;
        const dist = castRay(rayAngle);
        if (dist < 0.01) continue;
        const correct = dist * Math.cos(rayAngle - pos.angle);
        const wallH = (WALL_H / correct) * (height / 64);
        const shade = Math.max(0, 1 - correct / 20);
        const color = `hsl(260, 40%, ${20 + shade * 30}%)`;
        ctx.fillStyle = color;
        const x = i * 2;
        const y = (height - wallH) / 2;
        ctx.fillRect(x, y, 2, wallH);
    }

    // Draw door labels as sprites
    for (const r of rooms) {
        const dx = r.doorX - pos.x;
        const dy = r.doorY - pos.y;
        const ang = Math.atan2(dy, dx) - pos.angle;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.5 && dist < 16 && Math.abs(normalizeAngle(ang)) < FOV / 2) {
            const screenX = width / 2 + Math.tan(ang) * (width / 2) / Math.tan(FOV / 2);
            const h = (64 / dist) * (height / 64) * 0.5;
            ctx.fillStyle = 'rgba(255,0,255,0.8)';
            ctx.font = `${Math.max(10, h / 2)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(r.node.label, screenX, height / 2 + h / 2);
        }
    }
}

function castRay(angle) {
    let x = pos.x;
    let y = pos.y;
    const stepX = Math.cos(angle) * 0.03;
    const stepY = Math.sin(angle) * 0.03;
    let dist = 0;
    while (dist < 24) {
        x += stepX;
        y += stepY;
        dist += 0.03;
        if (isWall(x, y)) return dist;
    }
    return 24;
}

function normalizeAngle(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

function doAuth() {
    const u = document.getElementById('auth-user').value.trim().toLowerCase();
    const p = document.getElementById('auth-pass').value.trim();
    if (u === 'viper' && p === 'clamchowder') {
        auth = true;
        authPanel.style.display = 'none';
        document.getElementById('edit-bar').style.display = 'block';
        document.getElementById('auth-status').textContent = 'ARCHIVIST MODE — editing unlocked';
    } else {
        document.getElementById('auth-msg').textContent = 'Incorrect. This hall is read-only.';
    }
}

function loop(t) {
    const dt = Math.min(0.05, (t - (loop.last || t)) / 1000);
    loop.last = t;
    update(dt);
    render();
    requestAnimationFrame(loop);
}

window.unlockBasement = function() {
    authPanel.style.display = 'block';
};

init();
