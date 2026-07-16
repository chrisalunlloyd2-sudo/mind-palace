import * as THREE from 'https://cdn.skypack.dev/three@0.160.0';

let scene, camera, renderer, controls;
let rooms = [];
let hallways = [];
let playerState = 'walking';
let currentRoom = null;
const panel = document.getElementById('panel');
const roomTitle = document.getElementById('room-title');
const roomType = document.getElementById('room-type');
const roomDesc = document.getElementById('room-desc');

const ROOM_SIZE = 4;
const HALL_WIDTH = 2.5;
const HALL_HEIGHT = 3.2;

async function loadGraph() {
    const res = await fetch('graph.json?v=' + Date.now());
    return await res.json();
}

function createRoom(node, position, rotationY = 0) {
    const group = new THREE.Group();
    group.position.set(position.x, 0, position.z);
    group.rotation.y = rotationY;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a3a, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    group.add(floor);

    // Ceiling
    const ceil = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0x0d0d20 }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = HALL_HEIGHT;
    group.add(ceil);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.6 });
    const wallGeo = new THREE.PlaneGeometry(ROOM_SIZE, HALL_HEIGHT);
    const positions = [
        { x: 0, y: HALL_HEIGHT/2, z: -ROOM_SIZE/2, ry: 0 },
        { x: 0, y: HALL_HEIGHT/2, z: ROOM_SIZE/2, ry: Math.PI },
        { x: -ROOM_SIZE/2, y: HALL_HEIGHT/2, z: 0, ry: Math.PI/2 },
        { x: ROOM_SIZE/2, y: HALL_HEIGHT/2, z: 0, ry: -Math.PI/2 },
    ];
    for (const w of positions) {
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(w.x, w.y, w.z);
        wall.rotation.y = w.ry;
        group.add(wall);
    }

    // Label sprite
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff00ff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(node.label.slice(0, 28), 256, 80);
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, 2.4, 0);
    sprite.scale.set(3, 0.75, 1);
    group.add(sprite);

    group.userData = { node };
    scene.add(group);
    rooms.push(group);
    return group;
}

function createHallway(p1, p2) {
    const length = p1.distanceTo(p2);
    const geo = new THREE.BoxGeometry(HALL_WIDTH, HALL_HEIGHT, length);
    const mat = new THREE.MeshStandardMaterial({ color: 0x151525 });
    const hall = new THREE.Mesh(geo, mat);
    hall.position.copy(p1).lerp(p2, 0.5);
    hall.position.y = HALL_HEIGHT / 2;
    hall.lookAt(p2);
    scene.add(hall);
    hallways.push(hall);

    // Floor strip
    const stripGeo = new THREE.PlaneGeometry(HALL_WIDTH - 0.2, length - 0.2);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.rotation.x = -Math.PI / 2;
    strip.position.copy(hall.position);
    strip.position.y = 0.02;
    strip.rotation.y = hall.rotation.y;
    scene.add(strip);
}

function layoutGraph(graph) {
    const nodes = graph.nodes.slice(0, 80); // cap for performance
    const positions = {};
    const rings = {
        daily_portal: 0,
        project_hub: 1,
        agent_node: 1,
        event_spike: 2,
        hypothesis_gate: 2,
        memory_room: 3,
        keyword_chamber: 4,
    };

    const typeCounts = {};
    for (const n of nodes) {
        const ring = rings[n.type] ?? 3;
        typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
        const idx = typeCounts[n.type];
        const count = nodes.filter(x => x.type === n.type).length || 1;
        const angle = (idx / count) * Math.PI * 2;
        const radius = ring * 8 + (Math.random() - 0.5) * 2;
        positions[n.id] = new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );
    }

    for (const n of nodes) {
        createRoom(n, positions[n.id]);
    }

    for (const e of graph.edges) {
        if (positions[e.source] && positions[e.target]) {
            createHallway(positions[e.source], positions[e.target]);
        }
    }

    // Place player at portal
    if (graph.nodes[0]) {
        const start = positions[graph.nodes[0].id];
        camera.position.set(start.x, 1.7, start.z);
    }
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.FogExp2(0x050510, 0.035);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xff00ff, 0.5);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    controls = new THREE.PointerLockControls(camera, document.body);

    loadGraph().then(layoutGraph).then(animate);

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('click', onClick);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick() {
    if (!controls.isLocked && playerState === 'walking') {
        controls.lock();
    }
}

function updateRoomPanel() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(rooms, true);
    let nearest = null;
    for (const hit of intersects) {
        let obj = hit.object;
        while (obj.parent && !obj.userData.node) obj = obj.parent;
        if (obj.userData.node) {
            nearest = obj;
            break;
        }
    }
    if (nearest && nearest.userData.node) {
        const node = nearest.userData.node;
        if (currentRoom !== node.id) {
            currentRoom = node.id;
            panel.style.display = 'block';
            roomTitle.textContent = node.label;
            roomType.textContent = node.type;
            roomDesc.textContent = node.payload.preview || '';
        }
    } else {
        panel.style.display = 'none';
        currentRoom = null;
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateRoomPanel();
    renderer.render(scene, camera);
}

window.start = function() {
    document.getElementById('blocker').style.display = 'none';
    if (!scene) init();
    controls.lock();
};

init();
