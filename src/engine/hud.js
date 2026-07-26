/**
 * Mind Palace Lakehouse — HUD System
 * Notifications, prompts, minimap, inventory display
 */

const LakehouseHUD = {
    container: null,
    notificationEl: null,
    promptEl: null,
    minimapEl: null,
    inventoryEl: null,
    notificationTimeout: null,

    init() {
        console.log('[HUD] Initializing...');
        this.container = document.createElement('div');
        this.container.id = 'hud-container';
        this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;font-family:monospace;';
        document.body.appendChild(this.container);

        // Notification
        this.notificationEl = document.createElement('div');
        this.notificationEl.id = 'hud-notification';
        this.notificationEl.style.cssText = 'position:absolute;top:20%;left:50%;transform:translateX(-50%);color:#00ff80;font-size:18px;text-shadow:0 0 10px #00ff80;opacity:0;transition:opacity 0.3s;text-align:center;';
        this.container.appendChild(this.notificationEl);

        // Prompt
        this.promptEl = document.createElement('div');
        this.promptEl.id = 'hud-prompt';
        this.promptEl.style.cssText = 'position:absolute;bottom:20%;left:50%;transform:translateX(-50%);color:#00ffcc;font-size:14px;background:rgba(0,0,0,0.7);padding:8px 16px;border-radius:6px;border:1px solid #00ffcc33;opacity:0;transition:opacity 0.2s;text-align:center;';
        this.container.appendChild(this.promptEl);

        // Minimap
        this.minimapEl = document.createElement('div');
        this.minimapEl.id = 'hud-minimap';
        this.minimapEl.style.cssText = 'position:absolute;top:10px;right:10px;width:150px;height:150px;background:rgba(0,0,0,0.6);border:1px solid #333;border-radius:4px;opacity:0.6;';
        this.container.appendChild(this.minimapEl);

        // Inventory
        this.inventoryEl = document.createElement('div');
        this.inventoryEl.id = 'hud-inventory';
        this.inventoryEl.style.cssText = 'position:absolute;bottom:10px;left:50%;transform:translateX(-50%);color:#888;font-size:12px;opacity:0.5;';
        this.inventoryEl.textContent = '[I] Inventory';
        this.container.appendChild(this.inventoryEl);

        console.log('[HUD] Ready');
    },

    showNotification(text, duration) {
        if (!this.notificationEl) return;
        if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
        this.notificationEl.textContent = text;
        this.notificationEl.style.opacity = '1';
        this.notificationTimeout = setTimeout(() => {
            this.notificationEl.style.opacity = '0';
        }, duration || 2000);
    },

    showPrompt(text) {
        if (!this.promptEl) return;
        this.promptEl.textContent = text;
        this.promptEl.style.opacity = '1';
    },

    hidePrompt() {
        if (!this.promptEl) return;
        this.promptEl.style.opacity = '0';
    },

    updateMinimap(playerPos, playerRot, rooms, objects) {
        if (!this.minimapEl) return;
        const canvas = this.minimapEl.querySelector('canvas');
        const ctx = canvas ? canvas.getContext('2d') : null;
        if (!ctx) {
            const c = document.createElement('canvas');
            c.width = 150;
            c.height = 150;
            this.minimapEl.innerHTML = '';
            this.minimapEl.appendChild(c);
            const ctx2 = c.getContext('2d');
            this.drawMinimap(ctx2, playerPos, playerRot, rooms, objects);
            return;
        }
        this.drawMinimap(ctx, playerPos, playerRot, rooms, objects);
    },

    drawMinimap(ctx, playerPos, playerRot, rooms, objects) {
        const w = 150, h = 150;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, w, h);

        const scale = 3;
        const cx = w/2 - playerPos[0] * scale;
        const cy = h/2 - playerPos[2] * scale;

        // Draw rooms
        if (rooms) {
            for (const room of rooms) {
                const rx = cx + room.position[0] * scale;
                const ry = cy + room.position[2] * scale;
                ctx.fillStyle = 'rgba(0,255,100,0.15)';
                ctx.strokeStyle = 'rgba(0,255,100,0.3)';
                ctx.lineWidth = 1;
                ctx.fillRect(rx - 10, ry - 10, 20, 20);
                ctx.strokeRect(rx - 10, ry - 10, 20, 20);
            }
        }

        // Draw player
        ctx.fillStyle = '#00ff80';
        ctx.beginPath();
        ctx.arc(w/2, h/2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Direction
        const dir = playerRot ? [-Math.sin(playerRot[0]), -Math.cos(playerRot[0])] : [0, -1];
        ctx.strokeStyle = '#00ff80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w/2, h/2);
        ctx.lineTo(w/2 + dir[0] * 10, h/2 + dir[1] * 10);
        ctx.stroke();
    },

    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
};

window.LakehouseHUD = LakehouseHUD;
