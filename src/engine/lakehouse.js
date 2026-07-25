/**
 * Mind Palace Lakehouse — Main Entry Point
 * Phase 0: Orchestrates all systems
 * 
 * Ties together: renderer, camera, map, objects, physics, HUD, filing
 */

const Lakehouse = {
    renderer: null,
    camera: null,
    map: null,
    objects: [],
    physics: null,
    hud: null,
    filing: null,
    isRunning: false,
    lastTime: 0,
    currentRoom: null,
    currentLevel: 'ground',
    interactionTarget: null,

    async init() {
        console.log('🏠 Mind Palace Lakehouse initializing...');
        
        // Initialize all systems
        this.renderer = window.LakehouseRenderer;
        this.camera = window.LakehouseCamera;
        this.map = window.MapLoader;
        this.physics = window.PhysicsEngine;
        this.hud = window.LakehouseHUD;
        this.filing = window.FilingSystem;
        this.objects = [];

        // Init renderer
        const rendererReady = await this.renderer.init('gameCanvas');
        if (!rendererReady) {
            console.error('[Lakehouse] Renderer failed to initialize');
            return false;
        }

        // Init camera
        this.camera.init(this.renderer.canvas);

        // Init physics
        this.physics.init();

        // Init HUD
        this.hud.init();

        // Init filing system
        await this.filing.init();

        // Load map
        const mapData = await this.map.loadMap('lakehouse');
        
        // Build environment from map
        this.buildEnvironment(mapData);

        // Set spawn
        const spawn = this.map.getSpawn();
        this.camera.setPosition(spawn[0], spawn[1], spawn[2]);

        // Set current room
        this.currentRoom = this.map.getRoom('living_room');

        // Bind interaction key
        this.bindInteractionKey();

        // Start loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);

        console.log('🏠 Mind Palace Lakehouse ready');
        this.hud.showNotification('Welcome to the Lakehouse', 2000);
        return true;
    },

    buildEnvironment(mapData) {
        console.log('[Lakehouse] Building environment...');
        
        // Build walls for each room
        for (const room of mapData.rooms) {
            const template = this.map.getRoomTemplate(room.type);
            const pos = room.position;
            const size = template.size;
            
            // Add walls to physics
            const halfW = size[0] / 2;
            const halfD = size[2] / 2;
            const h = size[1];
            
            this.physics.addWall(
                [pos[0] - halfW, pos[1], pos[2] - halfD],
                [pos[0] + halfW, pos[1] + h, pos[2] + halfD]
            );

            // Spawn default objects for this room type
            if (template.objects) {
                for (const objDefId of template.objects) {
                    const def = window.ObjectSystem.getObjectDef(objDefId);
                    if (def) {
                        const offset = [
                            (Math.random() - 0.5) * (size[0] * 0.6),
                            0,
                            (Math.random() - 0.5) * (size[2] * 0.6)
                        ];
                        const instance = window.ObjectSystem.createInstance(
                            objDefId,
                            [pos[0] + offset[0], 0, pos[2] + offset[2]],
                            Math.random() * Math.PI * 2
                        );
                        if (instance) {
                            this.objects.push(instance);
                            this.physics.addObject(instance);
                        }
                    }
                }
            }
        }

        // Spawn filing cabinets
        for (const cabinet of this.filing.getCabinets()) {
            const instance = window.ObjectSystem.createInstance(
                'file_cabinet',
                cabinet.position,
                0,
                { cabinetId: cabinet.id }
            );
            if (instance) {
                this.objects.push(instance);
                this.physics.addObject(instance);
            }
        }

        console.log(`[Lakehouse] Built ${mapData.rooms.length} rooms, ${this.objects.length} objects`);
    },

    bindInteractionKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'e' || e.key === 'E') {
                this.interact();
            }
            if (e.key === 'f' || e.key === 'F') {
                this.pushObject();
            }
            if (e.key === 'q' || e.key === 'Q') {
                if (window.ObjectSystem.placementMode) {
                    window.ObjectSystem.cancelPlacement();
                    this.hud.showNotification('Placement cancelled');
                }
            }
            if (e.key === 'Escape') {
                if (window.ObjectSystem.placementMode) {
                    window.ObjectSystem.cancelPlacement();
                }
            }
        });
    },

    interact() {
        // Raycast for interaction
        const forward = this.camera.getForward();
        const origin = this.camera.getPosition();
        const hit = this.physics.raycast(origin, forward, 2.5);
        
        if (hit) {
            const obj = hit.object;
            const interactions = window.ObjectSystem.getAvailableInteractions(obj);
            
            if (interactions.length > 0) {
                const primary = interactions[0];
                
                switch (primary) {
                    case 'open':
                    case 'open_drawer':
                        obj.state.isOpen = !obj.state.isOpen;
                        this.hud.showNotification(
                            obj.state.isOpen ? 'Opened' : 'Closed'
                        );
                        break;
                    case 'toggle':
                        if (obj.defId === 'fireplace') {
                            obj.state.lit = !obj.state.lit;
                            this.hud.showNotification(
                                obj.state.lit ? '🔥 Fireplace lit' : 'Fireplace extinguished'
                            );
                        } else {
                            obj.state.on = !obj.state.on;
                            this.hud.showNotification(
                                obj.state.on ? '💡 Turned on' : '💡 Turned off'
                            );
                        }
                        break;
                    case 'sit':
                        this.hud.showNotification('🪑 Sitting... (press W to stand)');
                        break;
                    case 'read':
                    case 'inspect':
                        if (obj.state.cabinetId) {
                            // Open filing cabinet
                            this.openCabinet(obj.state.cabinetId);
                        } else {
                            this.hud.showNotification(`Inspecting ${obj.defId}`);
                        }
                        break;
                    case 'pick_up':
                        this.hud.showNotification(`Picked up ${obj.defId}`);
                        break;
                    default:
                        this.hud.showNotification(`Interact with ${obj.defId}`);
                }
            }
        }
    },

    openCabinet(cabinetId) {
        const cabinet = this.filing.getCabinet(cabinetId);
        if (!cabinet) return;

        // Show cabinet UI
        const content = document.createElement('div');
        content.style.cssText = `
            position: fixed; top: 10%; left: 10%; width: 80%; height: 80%;
            background: rgba(0,0,0,0.95); border: 2px solid #00ff00;
            border-radius: 8px; z-index: 2000; display: flex;
            flex-direction: column; font-family: 'Courier New', monospace;
        `;
        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:12px 20px;border-bottom:1px solid #333;">
                <span style="color:#00ff80;font-size:16px;font-weight:bold;">
                    📁 ${cabinet.label}
                </span>
                <button id="cabinet-close" style="background:none;border:none;color:#ff4444;
                        font-size:24px;cursor:pointer;">&times;</button>
            </div>
            <div style="flex:1;padding:20px;overflow-y:auto;">
                ${cabinet.drawers.map(drawer => `
                    <div class="drawer-entry" data-drawer="${drawer.id}"
                         style="padding:12px 16px;margin-bottom:8px;border:1px solid #333;
                                border-radius:6px;cursor:pointer;background:rgba(0,0,0,0.3);
                                transition:background 0.2s;"
                         onmouseover="this.style.background='rgba(0,255,0,0.1)'"
                         onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:20px;">🗄️</span>
                            <div>
                                <div style="color:#00ffcc;font-size:14px;font-weight:bold;">
                                    ${drawer.label}
                                </div>
                                <div style="color:#666;font-size:11px;margin-top:2px;">
                                    ${drawer.category}
                                </div>
                            </div>
                            <span style="margin-left:auto;color:#0f0;font-size:12px;">Open →</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(content);

        // Bind close
        document.getElementById('cabinet-close').onclick = () => content.remove();

        // Bind drawer clicks
        content.querySelectorAll('.drawer-entry').forEach(el => {
            el.addEventListener('click', () => {
                const drawerId = el.dataset.drawer;
                this.openDrawer(drawerId, content);
            });
        });
    },

    openDrawer(drawerId, parentContainer) {
        const contents = this.filing.getDrawerContents(drawerId);
        
        const drawerView = document.createElement('div');
        drawerView.style.cssText = `
            padding: 10px; margin-top: 10px;
            border-top: 1px solid #333;
        `;
        drawerView.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <button id="drawer-back" style="background:none;border:1px solid #333;
                        color:#0f0;padding:4px 10px;border-radius:4px;cursor:pointer;">← Back</button>
                <span style="color:#00ff80;font-size:14px;">Drawer Contents</span>
            </div>
            ${contents.length === 0 ? 
                '<p style="color:#666;text-align:center;padding:20px;">Empty drawer</p>' :
                contents.map(item => `
                    <div class="folder-entry" data-folder="${item.id}"
                         style="padding:10px 14px;margin-bottom:6px;border-left:3px solid ${item.color};
                                background:rgba(0,0,0,0.3);cursor:pointer;border-radius:0 4px 4px 0;">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:18px;">${item.icon}</span>
                            <span style="color:#00ffcc;font-size:13px;">${item.label}</span>
                            <span style="color:#666;font-size:10px;margin-left:auto;">${item.category}</span>
                        </div>
                    </div>
                `).join('')
            }
        `;
        parentContainer.querySelector('div:last-child').appendChild(drawerView);

        // Bind back
        document.getElementById('drawer-back').onclick = () => drawerView.remove();

        // Bind folder clicks
        drawerView.querySelectorAll('.folder-entry').forEach(el => {
            el.addEventListener('click', () => {
                const folderId = el.dataset.folder;
                this.openFolder(folderId, drawerView);
            });
        });
    },

    openFolder(folderId, parentContainer) {
        const folder = this.filing.folders.get(folderId);
        if (!folder) return;

        const folderView = document.createElement('div');
        folderView.style.cssText = `padding: 10px; margin-top: 10px; border-top: 1px solid #333;`;
        
        this.filing.renderFolderView(folderId, folderView);
        
        // Add back button
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back';
        backBtn.style.cssText = 'background:none;border:1px solid #333;color:#0f0;padding:4px 10px;border-radius:4px;cursor:pointer;margin-bottom:10px;';
        backBtn.onclick = () => folderView.remove();
        folderView.insertBefore(backBtn, folderView.firstChild);

        parentContainer.appendChild(folderView);

        // Bind document clicks
        folderView.querySelectorAll('.doc-entry').forEach(el => {
            el.addEventListener('click', () => {
                const docId = el.dataset.docId;
                const doc = this.filing.getDocument(docId);
                if (doc) {
                    this.hud.showDocument(doc.label, doc.content || '');
                }
            });
        });
    },

    pushObject() {
        const forward = this.camera.getForward();
        const origin = this.camera.getPosition();
        const hit = this.physics.raycast(origin, forward, 2.5);
        
        if (hit && hit.object && hit.object.interactions.includes('push')) {
            window.ObjectSystem.pushObject(hit.object, forward, 5);
            this.hud.showNotification('Pushed');
        }
    },

    update(dt) {
        // Update camera
        this.camera.update(dt);

        // Update physics
        this.physics.update(dt);

        // Update HUD minimap
        if (this.map.currentMap) {
            const mapData = this.map.maps[this.map.currentMap];
            if (mapData) {
                this.hud.updateMinimap(
                    this.camera.getPosition(),
                    this.camera.rotation,
                    mapData.rooms,
                    this.objects
                );
            }
        }

        // Check for interactable objects
        this.checkInteraction();
    },

    checkInteraction() {
        const forward = this.camera.getForward();
        const origin = this.camera.getPosition();
        const hit = this.physics.raycast(origin, forward, 2.5);
        
        if (hit) {
            const interactions = window.ObjectSystem.getAvailableInteractions(hit.object);
            if (interactions.length > 0) {
                const text = window.ObjectSystem.getInteractionText(hit.object, interactions[0]);
                this.hud.showPrompt(text);
                this.interactionTarget = hit.object;
                return;
            }
        }
        
        this.hud.hidePrompt();
        this.interactionTarget = null;
    },

    loop(time) {
        if (!this.isRunning) return;
        
        const dt = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;

        this.update(dt);
        this.renderer.render(null, this.camera);

        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.isRunning = false;
        this.renderer.dispose();
    }
};

window.Lakehouse = Lakehouse;
