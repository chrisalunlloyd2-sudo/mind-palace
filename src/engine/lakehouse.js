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
    initError: null,
    initStep: '',

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
            // Step 1: Renderer
            this.initStep = 'Renderer'; console.log('[Lakehouse] Step 1: Renderer...');
            const rendererReady = await this.renderer.init('gameCanvas');
            if (!rendererReady) {
                this.initError = 'Renderer failed to initialize';
                console.error('[Lakehouse] ' + this.initError);
                return false;
            }

            // Step 2: Camera
            this.initStep = 'Camera'; console.log('[Lakehouse] Step 2: Camera...');
            if (this.camera && this.camera.init) {
                this.camera.init(this.renderer.canvas);
            } else {
                console.warn('[Lakehouse] Camera not available, creating default');
                this.camera = this.createDefaultCamera();
            }

            // Step 3: Physics
            this.initStep = 'Physics'; console.log('[Lakehouse] Step 3: Physics...');
            if (this.physics && this.physics.init) {
                this.physics.init();
            }

            // Step 4: HUD
            this.initStep = 'HUD'; console.log('[Lakehouse] Step 4: HUD...');
            if (this.hud && this.hud.init) {
                this.hud.init();
            }

            // Step 5: Touch controls
            this.initStep = 'Touch controls'; console.log('[Lakehouse] Step 5: Touch controls...');
            if (this.touch && this.touch.init) {
                this.touch.init(this.renderer.canvas, this.camera);
                if (this.touch.enabled) {
                    this.touch.show();
                }
            }

            // Step 6: Object system
            this.initStep = 'Object system'; console.log('[Lakehouse] Step 6: Object system...');
            if (window.ObjectSystem && window.ObjectSystem.init) {
                await window.ObjectSystem.init();
            }

            // Step 7: Filing system
            this.initStep = 'Filing system'; console.log('[Lakehouse] Step 7: Filing system...');
            if (this.filing && this.filing.init) {
                await this.filing.init();
            }

            // Step 8: Gist wall
            this.initStep = 'Gist wall'; console.log('[Lakehouse] Step 8: Gist wall...');
            if (this.gistWall && this.gistWall.init) {
                await this.gistWall.init();
            }

            // Step 9: Load map
            this.initStep = 'Map loader'; console.log('[Lakehouse] Step 9: Loading map...');
            const mapData = await this.map.loadMap('lakehouse');
            if (!mapData) {
                this.initError = 'Failed to load map data';
                console.error('[Lakehouse] ' + this.initError);
                return false;
            }
            
            // Step 10: Build geometry
            this.initStep = 'Geometry builder'; console.log('[Lakehouse] Step 10: Building geometry...');
            this.renderer.buildAllRooms(mapData);
            
            // Add default lights
            this.renderer.addLight([0, 5, 0], [1, 0.95, 0.8], 3.0);
            this.renderer.addLight([5, 2, 5], [1, 0.7, 0.4], 1.5);
            this.renderer.addLight([-3, 2, -3], [0.6, 0.7, 1], 1.0);

            // Step 11: Build environment
            this.initStep = 'Environment builder'; console.log('[Lakehouse] Step 11: Building environment...');
            this.buildEnvironment(mapData);

            // Set spawn
            const spawn = this.map.getSpawn();
            if (this.camera && this.camera.setPosition) {
                this.camera.setPosition(spawn[0], spawn[1], spawn[2]);
            }

            // Set current room
            this.currentRoom = this.map.getRoom('living_room');

            // Bind interaction key
            this.bindInteractionKey();

            // Start loop
            this.isRunning = true;
            this.lastTime = performance.now();
            this.loop(this.lastTime);

            console.log('🏠 Mind Palace Lakehouse ready');
            if (this.hud && this.hud.showNotification) {
                this.hud.showNotification('Welcome to the Lakehouse', 2000);
            }
            return true;
        } catch (e) {
            this.initError = e.message || 'Unknown initialization error';
            this.initStep = this.initStep || 'Unknown step';
            console.error('[Lakehouse] Init error:', e);
            console.error(e.stack);
            return false;
        }
    },

    createDefaultCamera() {
        return {
            position: [1.5, 1.6, 0],
            rotation: [0, 0, 0],
            fov: 75,
            near: 0.1,
            far: 100,
            aspect: window.innerWidth / window.innerHeight,
            viewMatrix: new Float32Array(16),
            projectionMatrix: new Float32Array(16),
            keys: {},
            mouseDelta: [0, 0],
            speed: 3.0,
            sprintMultiplier: 2.0,
            isSprinting: false,
            eyeHeight: 1.6,
            
            init() {
                this.aspect = window.innerWidth / window.innerHeight;
                this.updateProjection();
                this.setupInput();
            },
            
            setupInput() {
                document.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
                document.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
            },
            
            updateProjection() {
                const f = 1.0 / Math.tan(this.fov * Math.PI / 360);
                const n = this.near, fa = this.far, a = this.aspect;
                this.projectionMatrix[0] = f / a;
                this.projectionMatrix[5] = f;
                this.projectionMatrix[10] = (fa + n) / (n - fa);
                this.projectionMatrix[11] = -1;
                this.projectionMatrix[14] = (2 * fa * n) / (n - fa);
            },
            
            update(dt) {
                const mx = this.mouseDelta[0] * 0.002;
                const my = this.mouseDelta[1] * 0.002;
                this.rotation[0] -= mx;
                this.rotation[1] = Math.max(-1.5, Math.min(1.5, this.rotation[1] - my));
                this.mouseDelta = [0, 0];
                
                const speed = this.speed * (this.isSprinting ? this.sprintMultiplier : 1) * dt;
                const forward = [-Math.sin(this.rotation[0]), 0, -Math.cos(this.rotation[0])];
                const right = [Math.cos(this.rotation[0]), 0, -Math.sin(this.rotation[0])];
                
                let mx2 = 0, mz = 0;
                if (this.keys['w'] || this.keys['arrowup']) { mx2 += forward[0]; mz += forward[2]; }
                if (this.keys['s'] || this.keys['arrowdown']) { mx2 -= forward[0]; mz -= forward[2]; }
                if (this.keys['a'] || this.keys['arrowleft']) { mx2 -= right[0]; mz -= right[2]; }
                if (this.keys['d'] || this.keys['arrowright']) { mx2 += right[0]; mz += right[2]; }
                
                const len = Math.sqrt(mx2*mx2 + mz*mz);
                if (len > 0) {
                    this.position[0] += (mx2/len) * speed;
                    this.position[2] += (mz/len) * speed;
                }
                
                this.updateViewMatrix();
            },
            
            updateViewMatrix() {
                const cx = Math.cos(this.rotation[0]);
                const sx = Math.sin(this.rotation[0]);
                const cy = Math.cos(this.rotation[1]);
                const sy = Math.sin(this.rotation[1]);
                const fwd = [-sx * cy, sy, -cx * cy];
                const rgt = [cx, 0, -sx];
                const up = [sx * sy, cy, cx * sy];
                const px = this.position[0], py = this.position[1], pz = this.position[2];
                this.viewMatrix[0] = rgt[0]; this.viewMatrix[1] = up[0]; this.viewMatrix[2] = -fwd[0]; this.viewMatrix[3] = 0;
                this.viewMatrix[4] = rgt[1]; this.viewMatrix[5] = up[1]; this.viewMatrix[6] = -fwd[1]; this.viewMatrix[7] = 0;
                this.viewMatrix[8] = rgt[2]; this.viewMatrix[9] = up[2]; this.viewMatrix[10] = -fwd[2]; this.viewMatrix[11] = 0;
                this.viewMatrix[12] = -(rgt[0]*px + rgt[1]*py + rgt[2]*pz);
                this.viewMatrix[13] = -(up[0]*px + up[1]*py + up[2]*pz);
                this.viewMatrix[14] = fwd[0]*px + fwd[1]*py + fwd[2]*pz;
                this.viewMatrix[15] = 1;
            },
            
            getForward() {
                return [-Math.sin(this.rotation[0]) * Math.cos(this.rotation[1]),
                        Math.sin(this.rotation[1]),
                        -Math.cos(this.rotation[0]) * Math.cos(this.rotation[1])];
            },
            
            getPosition() { return [...this.position]; },
            setPosition(x, y, z) { this.position = [x, y, z]; }
        };
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
            
            if (this.physics && this.physics.addWall) {
                this.physics.addWall(
                    [pos[0] - halfW, pos[1], pos[2] - halfD],
                    [pos[0] + halfW, pos[1] + h, pos[2] + halfD]
                );
            }

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
                                if (this.physics) this.physics.addObject(instance);
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
                        if (this.physics) this.physics.addObject(instance);
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
            if (e.key === 'e' || e.key === 'E') this.interact();
            if (e.key === 'f' || e.key === 'F') this.pushObject();
            if (e.key === 'g' || e.key === 'G') {
                if (this.gistWall) this.gistWall.toggle();
            }
            if (e.key === 'Escape') {
                if (this.gistWall && this.gistWall.isOpen) this.gistWall.hide();
            }
        });
    },

    interact() {
        if (!this.camera || !this.physics) return;
        const forward = this.camera.getForward();
        const origin = this.camera.getPosition();
        const hit = this.physics.raycast(origin, forward, 2.5);
        
        if (hit && hit.object && window.ObjectSystem) {
            const interactions = window.ObjectSystem.getAvailableInteractions(hit.object);
            if (interactions.length > 0) {
                const primary = interactions[0];
                switch (primary) {
                    case 'open': case 'open_drawer':
                        hit.object.state.isOpen = !hit.object.state.isOpen;
                        if (this.hud) this.hud.showNotification(hit.object.state.isOpen ? 'Opened' : 'Closed');
                        break;
                    case 'toggle':
                        hit.object.state.on = !hit.object.state.on;
                        if (this.hud) this.hud.showNotification(hit.object.state.on ? '💡 On' : '💡 Off');
                        break;
                    case 'read': case 'inspect':
                        if (hit.object.state && hit.object.state.cabinetId) {
                            this.openCabinet(hit.object.state.cabinetId);
                        } else if (this.hud) {
                            this.hud.showNotification(`Inspecting ${hit.object.defId}`);
                        }
                        break;
                    default:
                        if (this.hud) this.hud.showNotification(`Interact with ${hit.object.defId}`);
                }
            }
        }
    },

    pushObject() {
        if (!this.camera || !this.physics) return;
        const forward = this.camera.getForward();
        const origin = this.camera.getPosition();
        const hit = this.physics.raycast(origin, forward, 2.5);
        if (hit && hit.object && window.ObjectSystem && window.ObjectSystem.pushObject) {
            window.ObjectSystem.pushObject(hit.object, forward, 5);
            if (this.hud) this.hud.showNotification('Pushed');
        }
    },

    update(dt) {
        if (this.camera) this.camera.update(dt);
        if (this.physics) this.physics.update(dt);

        if (this.map && this.map.currentMap && this.hud) {
            const mapData = this.map.maps[this.map.currentMap];
            if (mapData && this.hud.updateMinimap) {
                this.hud.updateMinimap(
                    this.camera ? this.camera.getPosition() : [0,0,0],
                    this.camera ? this.camera.rotation : [0,0,0],
                    mapData.rooms,
                    this.objects
                );
            }
        }

        this.checkInteraction();
    },

    checkInteraction() {
        if (!this.camera || !this.physics || !this.hud) return;
        const forward = this.camera.getForward();
        const origin = this.camera.getPosition();
        const hit = this.physics.raycast(origin, forward, 2.5);
        
        if (hit && hit.object && window.ObjectSystem) {
            const interactions = window.ObjectSystem.getAvailableInteractions(hit.object);
            if (interactions.length > 0 && this.hud.showPrompt) {
                this.hud.showPrompt(window.ObjectSystem.getInteractionText(hit.object, interactions[0]));
                this.interactionTarget = hit.object;
                return;
            }
        }
        if (this.hud.hidePrompt) this.hud.hidePrompt();
        this.interactionTarget = null;
    },

    loop(time) {
        if (!this.isRunning) return;
        const dt = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;
        this.update(dt);
        if (this.renderer) this.renderer.render(null, this.camera);
        requestAnimationFrame((t) => this.loop(t));
    },

    stop() {
        this.isRunning = false;
        if (this.touch && this.touch.dispose) this.touch.dispose();
        if (this.gistWall && this.gistWall.dispose) this.gistWall.dispose();
        if (this.renderer) this.renderer.dispose();
    }
};

window.Lakehouse = Lakehouse;
