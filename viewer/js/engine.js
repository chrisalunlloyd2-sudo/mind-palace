/* Wolfenstein-style raycaster for MindPalace */
const TILE = 1;
const WALL_H = 64;
const FOV = Math.PI / 3;
const MOVE_SPEED = 2.8;
const TURN_SPEED = 2.0;

class RayEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.w = canvas.width;
        this.h = canvas.height;
        this.map = [];
        this.player = { x: 1.5, y: 1.5, angle: 0 };
        this.keys = {};
        this.lastTime = 0;
        this.onMove = null;
    }

    resize() {
        this.w = this.canvas.width = window.innerWidth;
        this.h = this.canvas.height = window.innerHeight;
    }

    loadMap(grid) {
        this.map = grid;
        this.player.x = 1.5;
        this.player.y = 1.5;
        this.player.angle = Math.PI / 2;
    }

    setSpawn(x, y, angle) {
        this.player.x = x;
        this.player.y = y;
        this.player.angle = angle;
    }

    isWall(x, y) {
        const gx = Math.floor(x);
        const gy = Math.floor(y);
        if (!this.map[gy] || this.map[gy][gx] === undefined) return true;
        return this.map[gy][gx] !== 0;
    }

    update(dt) {
        if (document.pointerLockElement !== this.canvas) return;
        const p = this.player;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) p.angle -= TURN_SPEED * dt;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) p.angle += TURN_SPEED * dt;
        let move = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) move = MOVE_SPEED * dt;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) move = -MOVE_SPEED * dt;
        if (move !== 0) {
            const nx = p.x + Math.cos(p.angle) * move;
            const ny = p.y + Math.sin(p.angle) * move;
            if (!this.isWall(nx, p.y)) p.x = nx;
            if (!this.isWall(p.x, ny)) p.y = ny;
        }
        if (this.onMove) this.onMove(p.x, p.y, p.angle);
    }

    castRay(angle) {
        const step = 0.03;
        let x = this.player.x;
        let y = this.player.y;
        let dist = 0;
        while (dist < 32) {
            x += Math.cos(angle) * step;
            y += Math.sin(angle) * step;
            dist += step;
            if (this.isWall(x, y)) return { dist, x, y };
        }
        return { dist: 32, x, y };
    }

    render() {
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(0, 0, 0, this.h);
        grad.addColorStop(0, '#050510');
        grad.addColorStop(0.5, '#1a1a3a');
        grad.addColorStop(0.5, '#101020');
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.w, this.h);

        const rays = Math.floor(this.w / 2);
        for (let i = 0; i < rays; i++) {
            const rayAngle = this.player.angle - FOV / 2 + (i / rays) * FOV;
            const hit = this.castRay(rayAngle);
            const correct = hit.dist * Math.cos(rayAngle - this.player.angle);
            const wallH = (WALL_H / correct) * (this.h / 64);
            const shade = Math.max(0.1, 1 - correct / 22);
            const side = this.getSide(hit.x, hit.y, rayAngle);
            const hue = side === 1 ? 260 : 280;
            ctx.fillStyle = `hsl(${hue}, 35%, ${18 + shade * 30}%)`;
            const x = i * 2;
            const y = (this.h - wallH) / 2;
            ctx.fillRect(x, y, 2, wallH);
        }
    }

    getSide(x, y, angle) {
        const dx = Math.abs(x - Math.floor(x) - 0.5);
        const dy = Math.abs(y - Math.floor(y) - 0.5);
        return dx > dy ? 0 : 1;
    }

    loop(t) {
        const dt = Math.min(0.05, (t - this.lastTime) / 1000);
        this.lastTime = t;
        this.update(dt);
        this.render();
        requestAnimationFrame((tt) => this.loop(tt));
    }

    start() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.canvas) {
                this.player.angle += e.movementX * 0.003;
            }
        });
        this.canvas.addEventListener('click', () => this.canvas.requestPointerLock?.());
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.RayEngine = RayEngine;
