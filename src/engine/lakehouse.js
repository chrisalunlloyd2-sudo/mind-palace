/**
 * Mind Palace Lakehouse — Main Entry Point
 * Phase 0: Orchestrates all systems
 */

const Lakehouse = {
    renderer: null,
    camera: null,
    map: null,
    objects: [],
    physics: null,
    hud: null,
    filing: null,
    touch: null,
    gistWall: null,
    isRunning: false,
    lastTime: 0,
    currentRoom: null,
    interactionTarget: null,

    async init() {
        console.log('🏠 Mind Palace Lakehouse initializing...');
        
        this.renderer = window.LakehouseRenderer;
        this.camera = window.LakehouseCamera;
        this.map = window.MapLoader;
        this.physics = window.PhysicsEngine;
        this.hud = window.LakehouseHUD;
        this.filing = window.FilingSystem;
        this.touch = window.TouchControls;
        this.gistWall = window.GistWall;
        this.objects = [];

        try {
            // Init renderer
            console.log('[Lakehouse] Step 1: Renderer...');
            const rendererReady = await this.renderer.init('gameCanvas');
            if (!rendererReady) {
                console.error('[Lakehouse] Renderer failed to initialize');
                return false;
            }

            // Init camera
            console.log('[Lakehouse] Step 2: Camera...');
            this.camera.init(this.renderer.canvas);

            // Init physics
            console.log('[Lakehouse] Step 3: Physics...');
            this.physics.init();

            // Init HUD
            console.log('[Lakehouse] Step 4: HUD...');
            this.hud.init();

            // Init touch controls
            console.log('[Lakehouse] Step 5: Touch controls...');
            this.touch.init(this.renderer.canvas, this.camera);
            if (this.touch.enabled) {
                this.touch.show();
            }

            // Init object system
            console.log('[Lakehouse] Step 6: Object system...');
            if (window.ObjectSystem) {
                await window.ObjectSystem.init();
            }

            // Init filing system
            console.log('[Lakehouse] Step 7: Filing system...');
            await this.filing.init();

            // Init gist wall
            console.log('[Lakehouse] Step 8: Gist wall...');
            if (this.gistWall) {
                await this.gistWall.init();
            }

            // Load map
            console.log('[Lakehouse] Step 9: Loading map...');
            const mapData = await this.map.loadMap('lakehouse');
            if (!mapData) {
                console.error('[Lakehouse] Failed to load map');
                return false;
            }
            
            // Build renderable geometry from rooms
            console.log('[Lakehouse] Step 10: Building geometry...');
            this.renderer.buildAllRooms(mapData);
            
            // Add default lights
            this.renderer.addLight([0, 5, 0], [1, 0.95, 0.8], 3.0);
            this.renderer.addLight([5, 2, 5], [1, 0.7, 0.4], 1.5);
            this.renderer.addLight([-3, 2, -3], [0.6, 0.7, 1], 1.0);

            // Build environment (physics walls + objects)
            console.log('[Lakehouse] Step 11: Building environment...');
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
        } catch (e) {
            console.error('[Lakehouse] Init error:', e);
            console.error(e.stack);
            return false;
        }
    },

    buildEnvironment(mapData) {
        console.log('[Lakehouse] Building environment...');
        
        for (const room of mapData.rooms) {
            const template = this.map.getRoomTemplate(room.type);
            const pos = room.position;
            const size = template.size;
            
            const halfW = size[0] / 2;
            const halfD = size[2] / 2;
            const h = size[1];
            
            this.physics.addWall(
                [pos[0] - halfW, pos[1], pos[2] - halfD],
                [pos[0] + halfW, pos[1] + h, pos[2] + halfD]
            );

            if (template.objects && window.ObjectSystem) {
                for (const objDefId of template.objects) {
                    try {
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
                    } catch (e) {
                        console.warn(`[Lakehouse] Could not spawn ${objDefId}:`, e);
                    }
                }
            }
        }

        if (this.filing && this.filing.getCabinets) {
            for (const cabinet of this.filing.getCabinets()) {
                try {
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
                } catch (e) {
                    console.warn(`[Lakehouse] Could not spawn cabinet ${cabinet.id}:`, e);
                }
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
            if (e.key === 'g' || e.key === 'G') {
                if (this.gistWall) {
                    this.gistWall.toggle();
                }
            }
            if (e.key === 'q' || e.key === 'Q') {
                if (window.ObjectSystem && window.ObjectSystem.placementMode) {
                    window.ObjectSystem.cancelPlacement();
                    this.hud.showNotification('Placement cancelled');
                }
            }
            if (e.key === 'Escape') {
                if (this.gistWall && this.gistWall.isOpen) {
                    this.gistWall.hide();
                }
                if (window.ObjectSystem && window.ObjectSystem.placementMode) {
                    window.ObjectSystem.cancelPlacement();
                }
            }
        });
    },

    interact() {
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
                        this.hud.showNotification(obj.state.isOpen ? 'Opened' : 'Closed');
                        break;
                    case 'toggle':
                        if (obj.defId === 'fireplace') {
                            obj.state.lit = !obj.state.lit;
                            this.hud.showNotification(obj.state.lit ? '🔥 Fireplace lit' : 'Fireplace extinguished');
                        } else {
                            obj.state.on = !obj.state.on;
                            this.hud.showNotification(obj.state.on ? '💡 Turned on' : '💡 Turned off');
                        }
                        break;
                    case 'sit':
                        this.hud.showNotification('🪑 Sitting... (press W to stand)');
                        break;
                    case 'read':
                    case 'inspect':
                        if (obj.state && obj.state.cabinetId) {
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

        const content = document.createElement('div');
        content.style.cssText = `
            position: fixed; top: 5%; left: 5%; width: 90%; height: 90%;
            background: rgba(0,0,0,0.95); border: 2px solid #00ff00;
            border-radius: 8px; z-index: 2000; display: flex;
            flex-direction: column; font-family: 'Courier New', monospace;
        `;
        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:12px 16px;border-bottom:1px solid #333;">
                <span style="color:#00ff80;font-size:16px;font-weight:bold;">
                    📁 ${cabinet.label}
                </span>
                <button id="cabinet-close" style="background:none;border:none;color:#ff4444;
                        font-size:28px;cursor:pointer;padding:0 8px;">&times;</button>
            </div>
            <div style="flex:1;padding:16px;overflow-y:auto;">
                ${cabinet.drawers.map(drawer => `
                    <div class="drawer-entry" data-drawer="${drawer.id}"
                         style="padding:14px 16px;margin-bottom:8px;border:1px solid #333;
                                border-radius:8px;cursor:pointer;background:rgba(0,0,0,0.3);
                                transition:background 0.2s;min-height:50px;
                                display:flex;align-items:center;"
                         onmouseover="this.style.background='rgba(0,255,0,0.1)'"
                         onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                        <div style="display:flex;align-items:center;gap:12px;width:100%;">
                            <span style="font-size:24px;">🗄️</span>
                            <div style="flex:1;">
                                <div style="color:#00ffcc;font-size:15px;font-weight:bold;">
                                    ${drawer.label}
                                </div>
                                <div style="color:#666;font-size:12px;margin-top:2px;">
                                    ${drawer.category}
                                </div>
                            </div>
                            <span style="color:#0f0;font-size:14px;">→</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(content);

        document.getElementById('cabinet-close').onclick = () => content.remove();

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
                        color:#0f0;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:14px;">← Back</button>
                <span style="color:#00ff80;font-size:14px;">Drawer Contents</span>
            </div>
            ${contents.length === 0 ? 
                '<p style="color:#666;text-align:center;padding:30px;">Empty drawer</p>' :
                contents.map(item => `
                    <div class="folder-entry" data-folder="${item.id}"
                         style="padding:14px 16px;margin-bottom:6px;border-left:4px solid ${item.color};
                                background:rgba(0,0,0,0.3);cursor:pointer;border-radius:0 8px 8px 0;
                                min-height:48px;display:flex;align-items:center;">
                        <div style="display:flex;align-items:center;gap:10px;width:100%;">
                            <span style="font-size:22px;">${item.icon}</span>
                            <span style="color:#00ffcc;font-size:14px;flex:1;">${item.label}</span>
                            <span style="color:#666;font-size:11px;">${item.category}</span>
                        </div>
                    </div>
                `).join('')
            }
        `;
        parentContainer.querySelector('div:last-child').appendChild(drawerView);

        document.getElementById('drawer-back').onclick = () => drawerView.remove();

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
        
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back';
        backBtn.style.cssText = 'background:none;border:1px solid #333;color:#0f0;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:14px;margin-bottom:10px;';
        backBtn.onclick = () => folderView.remove();
        folderView.insertBefore(backBtn, folderView.firstChild);

        parentContainer.appendChild(folderView);

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
        
        if (hit && hit.object && hit.object.interactions && hit.object.interactions.includes('push')) {
            window.ObjectSystem.pushObject(hit.object, forward, 5);
            this.hud.showNotification('Pushed');
        }
    },

    update(dt) {
        this.camera.update(dt);
        this.physics.update(dt);

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
        if (this.touch) this.touch.dispose();
        if (this.gistWall) this.gistWall.dispose();
        this.renderer.dispose();
    }
};

window.Lakehouse = Lakehouse;
