/**
 * Mind Palace Lakehouse — HUD & UI System
 * Phase 3.5: User Interface
 * 
 * Features:
 * - Crosshair and interaction prompts
 * - Inventory system
 * - Minimap renderer
 * - Object placement UI
 * - Document viewer
 * - Settings menu
 */

const LakehouseHUD = {
    container: null,
    crosshair: null,
    prompt: null,
    inventory: null,
    minimap: null,
    documentViewer: null,
    settings: null,
    isVisible: true,

    init() {
        console.log('[HUD] Initializing...');
        this.createContainer();
        this.createCrosshair();
        this.createInteractionPrompt();
        this.createInventory();
        this.createMinimap();
        this.createDocumentViewer();
        this.createSettingsMenu();
        this.bindKeys();
        console.log('[HUD] Ready');
    },

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'hud-container';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        document.body.appendChild(this.container);
    },

    createCrosshair() {
        this.crosshair = document.createElement('div');
        this.crosshair.id = 'crosshair';
        this.crosshair.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 20px; height: 20px; z-index: 1001;
        `;
        this.crosshair.innerHTML = `
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <line x1="10" y1="2" x2="10" y2="8" stroke="#00ff00" stroke-width="1.5"/>
                <line x1="10" y1="12" x2="10" y2="18" stroke="#00ff00" stroke-width="1.5"/>
                <line x1="2" y1="10" x2="8" y2="10" stroke="#00ff00" stroke-width="1.5"/>
                <line x1="12" y1="10" x2="18" y2="10" stroke="#00ff00" stroke-width="1.5"/>
                <circle cx="10" cy="10" r="1.5" fill="#00ff00" opacity="0.5"/>
            </svg>
        `;
        this.container.appendChild(this.crosshair);
    },

    createInteractionPrompt() {
        this.prompt = document.createElement('div');
        this.prompt.id = 'interaction-prompt';
        this.prompt.style.cssText = `
            position: absolute; bottom: 15%; left: 50%; transform: translateX(-50%);
            color: #00ffcc; font-size: 14px; text-align: center;
            background: rgba(0,0,0,0.7); padding: 8px 16px;
            border: 1px solid #00ffcc; border-radius: 4px;
            opacity: 0; transition: opacity 0.2s; z-index: 1002;
        `;
        this.container.appendChild(this.prompt);
    },

    showPrompt(text) {
        this.prompt.textContent = text;
        this.prompt.style.opacity = '1';
    },

    hidePrompt() {
        this.prompt.style.opacity = '0';
    },

    createInventory() {
        this.inventory = document.createElement('div');
        this.inventory.id = 'inventory';
        this.inventory.style.cssText = `
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 4px; padding: 8px;
            background: rgba(0,0,0,0.8); border: 1px solid #333;
            border-radius: 6px; z-index: 1003; display: none;
        `;
        this.container.appendChild(this.inventory);
    },

    showInventory() {
        this.inventory.style.display = 'flex';
        this.renderInventory();
    },

    hideInventory() {
        this.inventory.style.display = 'none';
    },

    renderInventory(items = []) {
        this.inventory.innerHTML = '';
        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color: #666; padding: 8px; font-size: 12px;';
            empty.textContent = 'Empty';
            this.inventory.appendChild(empty);
            return;
        }
        items.forEach((item, i) => {
            const slot = document.createElement('div');
            slot.style.cssText = `
                width: 50px; height: 50px; border: 1px solid #444;
                border-radius: 4px; display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                background: rgba(0,255,0,0.05); cursor: pointer;
            `;
            slot.innerHTML = `
                <span style="font-size: 18px;">${item.icon || '📦'}</span>
                <span style="font-size: 9px; color: #aaa; margin-top: 2px;">${item.label || ''}</span>
            `;
            if (i === 0) slot.style.borderColor = '#00ff00';
            this.inventory.appendChild(slot);
        });
    },

    createMinimap() {
        this.minimap = document.createElement('div');
        this.minimap.id = 'minimap';
        this.minimap.style.cssText = `
            position: absolute; top: 20px; right: 20px;
            width: 180px; height: 180px;
            background: rgba(0,0,0,0.8); border: 1px solid #00ff00;
            border-radius: 4px; z-index: 1004; overflow: hidden;
        `;
        this.minimap.innerHTML = `
            <canvas id="minimap-canvas" width="180" height="180" 
                    style="width:100%;height:100%;"></canvas>
            <div style="position:absolute;top:4px;left:6px;color:#00ff80;font-size:10px;">MINIMAP</div>
        `;
        this.container.appendChild(this.minimap);
    },

    updateMinimap(playerPos, playerRot, rooms, objects) {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = 180, h = 180;
        const scale = 4; // pixels per unit
        const cx = w / 2, cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Draw rooms
        ctx.strokeStyle = '#0a0';
        ctx.lineWidth = 1;
        for (const room of rooms) {
            const rx = cx + (room.position[0] - playerPos[0]) * scale;
            const ry = cy + (room.position[2] - playerPos[2]) * scale;
            const rw = (room.size?.[0] || 5) * scale;
            const rh = (room.size?.[2] || 5) * scale;
            ctx.strokeRect(rx - rw/2, ry - rh/2, rw, rh);
        }

        // Draw objects
        ctx.fillStyle = '#0ff';
        for (const obj of objects) {
            const ox = cx + (obj.position[0] - playerPos[0]) * scale;
            const oy = cy + (obj.position[2] - playerPos[2]) * scale;
            ctx.fillRect(ox - 1, oy - 1, 3, 3);
        }

        // Draw player
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw direction
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.sin(playerRot[0]) * 15, cy + Math.cos(playerRot[0]) * 15);
        ctx.stroke();
    },

    createDocumentViewer() {
        this.documentViewer = document.createElement('div');
        this.documentViewer.id = 'document-viewer';
        this.documentViewer.style.cssText = `
            position: fixed; top: 10%; left: 10%; width: 80%; height: 80%;
            background: rgba(0,0,0,0.95); border: 2px solid #00ff00;
            border-radius: 8px; z-index: 2000; display: none;
            flex-direction: column; font-family: 'Courier New', monospace;
        `;
        this.documentViewer.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:12px 20px;border-bottom:1px solid #333;">
                <span id="doc-title" style="color:#00ff80;font-size:16px;font-weight:bold;"></span>
                <button id="doc-close" style="background:none;border:none;color:#ff4444;
                        font-size:24px;cursor:pointer;">&times;</button>
            </div>
            <div id="doc-content" style="flex:1;padding:20px;overflow-y:auto;
                        color:#ccc;font-size:14px;line-height:1.6;white-space:pre-wrap;"></div>
        `;
        document.body.appendChild(this.documentViewer);

        document.getElementById('doc-close').addEventListener('click', () => {
            this.hideDocument();
        });
    },

    showDocument(title, content) {
        document.getElementById('doc-title').textContent = title;
        document.getElementById('doc-content').textContent = content;
        this.documentViewer.style.display = 'flex';
    },

    hideDocument() {
        this.documentViewer.style.display = 'none';
    },

    createSettingsMenu() {
        this.settings = document.createElement('div');
        this.settings.id = 'settings-menu';
        this.settings.style.cssText = `
            position: fixed; top: 10%; left: 10%; width: 80%; height: 80%;
            background: rgba(0,0,0,0.95); border: 2px solid #00ff00;
            border-radius: 8px; z-index: 2000; display: none;
            flex-direction: column; font-family: 'Courier New', monospace;
        `;
        this.settings.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:12px 20px;border-bottom:1px solid #333;">
                <span style="color:#00ff80;font-size:16px;font-weight:bold;">⚙ Settings</span>
                <button id="settings-close" style="background:none;border:none;color:#ff4444;
                        font-size:24px;cursor:pointer;">&times;</button>
            </div>
            <div style="flex:1;padding:20px;overflow-y:auto;color:#ccc;">
                <div class="setting-group" style="margin-bottom:20px;">
                    <h3 style="color:#00ff80;margin-bottom:10px;">Controls</h3>
                    <div style="margin-bottom:8px;">
                        <label style="color:#aaa;">Mouse Sensitivity</label>
                        <input type="range" id="setting-sensitivity" min="0.1" max="1" step="0.05" value="0.5"
                               style="width:200px;background:#000;color:#0f0;">
                        <span id="sensitivity-value" style="color:#0f0;margin-left:8px;">0.5</span>
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="color:#aaa;">Movement Speed</label>
                        <input type="range" id="setting-speed" min="1" max="10" step="0.5" value="3"
                               style="width:200px;background:#000;color:#0f0;">
                        <span id="speed-value" style="color:#0f0;margin-left:8px;">3.0</span>
                    </div>
                </div>
                <div class="setting-group" style="margin-bottom:20px;">
                    <h3 style="color:#00ff80;margin-bottom:10px;">Graphics</h3>
                    <div style="margin-bottom:8px;">
                        <label style="color:#aaa;">Render Distance</label>
                        <input type="range" id="setting-render-dist" min="20" max="100" step="5" value="60"
                               style="width:200px;background:#000;color:#0f0;">
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="color:#aaa;">Fog</label>
                        <input type="checkbox" id="setting-fog" checked>
                    </div>
                </div>
                <div class="setting-group">
                    <h3 style="color:#00ff80;margin-bottom:10px;">Audio</h3>
                    <div style="margin-bottom:8px;">
                        <label style="color:#aaa;">Master Volume</label>
                        <input type="range" id="setting-volume" min="0" max="100" step="5" value="70"
                               style="width:200px;background:#000;color:#0f0;">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.settings);

        document.getElementById('settings-close').addEventListener('click', () => {
            this.hideSettings();
        });

        // Bind setting changes
        document.getElementById('setting-sensitivity')?.addEventListener('input', (e) => {
            document.getElementById('sensitivity-value').textContent = e.target.value;
        });
        document.getElementById('setting-speed')?.addEventListener('input', (e) => {
            document.getElementById('speed-value').textContent = parseFloat(e.target.value).toFixed(1);
        });
    },

    showSettings() {
        this.settings.style.display = 'flex';
    },

    hideSettings() {
        this.settings.style.display = 'none';
    },

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                this.inventory.style.display = this.inventory.style.display === 'flex' ? 'none' : 'flex';
            }
            if (e.key === 'Escape') {
                this.hideDocument();
                this.hideSettings();
            }
            if (e.key === 'm' || e.key === 'M') {
                this.minimap.style.display = this.minimap.style.display === 'none' ? 'block' : 'none';
            }
        });
    },

    showNotification(text, duration = 3000) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
            color: #00ff00; font-size: 14px; text-align: center;
            background: rgba(0,0,0,0.8); padding: 10px 20px;
            border: 1px solid #00ff00; border-radius: 4px;
            z-index: 2001; animation: fadeIn 0.2s;
        `;
        notif.textContent = text;
        document.body.appendChild(notif);
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.5s';
            setTimeout(() => notif.remove(), 500);
        }, duration);
    }
};

window.LakehouseHUD = LakehouseHUD;
