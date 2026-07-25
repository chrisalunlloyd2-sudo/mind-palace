/**
 * Mind Palace Lakehouse — Interactive Object System
 * Phase 3: Interactive Objects & Physics
 * 
 * Features:
 * - Container objects (drawers, cabinets, trunks)
 * - Furniture (static or movable)
 * - Movable objects (HL1-style chair pushing)
 * - Document system (readable content)
 * - Doors (open, lock, transition)
 * - Switches (lights, fireplace, music)
 * - Minecraft-style placement system
 */

const ObjectSystem = {
    objects: new Map(),
    selectedObject: null,
    placementMode: false,
    interactionRange: 2.5,
    highlightColor: [0.0, 1.0, 0.5],

    // Object type definitions
    types: {
        container: {
            label: 'Container',
            interactions: ['open', 'close', 'inspect', 'take'],
            canMove: false,
            canPlace: false,
            hasState: true
        },
        furniture: {
            label: 'Furniture',
            interactions: ['sit', 'push', 'inspect'],
            canMove: true,
            canPlace: true,
            hasState: false
        },
        movable: {
            label: 'Movable',
            interactions: ['pick_up', 'push', 'place'],
            canMove: true,
            canPlace: true,
            hasState: false
        },
        document: {
            label: 'Document',
            interactions: ['read', 'take', 'inspect'],
            canMove: true,
            canPlace: true,
            hasState: true
        },
        door: {
            label: 'Door',
            interactions: ['open', 'close', 'lock', 'unlock'],
            canMove: false,
            canPlace: false,
            hasState: true
        },
        switch: {
            label: 'Switch',
            interactions: ['toggle', 'inspect'],
            canMove: false,
            canPlace: false,
            hasState: true
        }
    },

    async init() {
        console.log('[ObjectSystem] Initializing...');
        this.loadObjectDefinitions();
        console.log(`[ObjectSystem] ${this.objects.size} object types loaded`);
    },

    loadObjectDefinitions() {
        // Furniture
        this.registerObject('couch_01', {
            type: 'furniture',
            model: 'couch_modern',
            size: [2.0, 0.8, 0.9],
            mass: 40,
            color: '#4a3728',
            interactions: ['sit', 'push', 'inspect']
        });

        this.registerObject('coffee_table', {
            type: 'furniture',
            model: 'table_glass',
            size: [1.2, 0.5, 0.7],
            mass: 15,
            color: '#8B7355',
            interactions: ['push', 'place_on', 'inspect']
        });

        this.registerObject('dining_table_01', {
            type: 'furniture',
            model: 'table_dining',
            size: [2.4, 0.75, 1.2],
            mass: 50,
            color: '#5C4033',
            interactions: ['push', 'place_on', 'inspect']
        });

        this.registerObject('dining_chair', {
            type: 'movable',
            model: 'chair_dining',
            size: [0.5, 0.9, 0.5],
            mass: 8,
            color: '#3E2723',
            interactions: ['pick_up', 'push', 'place', 'sit']
        });

        this.registerObject('rocking_chair', {
            type: 'movable',
            model: 'chair_rocking',
            size: [0.6, 1.0, 0.7],
            mass: 12,
            color: '#8B4513',
            interactions: ['sit', 'push', 'inspect']
        });

        this.registerObject('desk_01', {
            type: 'furniture',
            model: 'desk_executive',
            size: [1.6, 0.75, 0.8],
            mass: 35,
            color: '#2C1810',
            interactions: ['push', 'place_on', 'inspect']
        });

        this.registerObject('office_chair', {
            type: 'movable',
            model: 'chair_office',
            size: [0.6, 0.9, 0.6],
            mass: 10,
            color: '#1a1a2e',
            interactions: ['sit', 'push', 'inspect']
        });

        this.registerObject('bookshelf_01', {
            type: 'furniture',
            model: 'bookshelf_standard',
            size: [0.9, 2.0, 0.4],
            mass: 30,
            color: '#5D4037',
            interactions: ['inspect', 'push', 'take_book']
        });

        this.registerObject('bookshelf_wall', {
            type: 'furniture',
            model: 'bookshelf_wall',
            size: [3.0, 2.5, 0.4],
            mass: 60,
            color: '#3E2723',
            interactions: ['inspect', 'take_book']
        });

        this.registerObject('bed_king', {
            type: 'furniture',
            model: 'bed_king',
            size: [2.0, 0.6, 2.1],
            mass: 80,
            color: '#F5F5DC',
            interactions: ['sit', 'inspect']
        });

        this.registerObject('bed_queen', {
            type: 'furniture',
            model: 'bed_queen',
            size: [1.6, 0.6, 2.0],
            mass: 65,
            color: '#FFF8DC',
            interactions: ['sit', 'inspect']
        });

        this.registerObject('nightstand', {
            type: 'furniture',
            model: 'nightstand',
            size: [0.5, 0.6, 0.5],
            mass: 15,
            color: '#5D4037',
            interactions: ['push', 'place_on', 'inspect']
        });

        this.registerObject('dresser', {
            type: 'container',
            model: 'dresser_6drawer',
            size: [1.2, 1.2, 0.5],
            mass: 40,
            color: '#6D4C41',
            drawerCount: 6,
            interactions: ['open_drawer', 'close_drawer', 'inspect']
        });

        this.registerObject('dresser_small', {
            type: 'container',
            model: 'dresser_4drawer',
            size: [0.8, 1.0, 0.5],
            mass: 30,
            color: '#6D4C41',
            drawerCount: 4,
            interactions: ['open_drawer', 'close_drawer', 'inspect']
        });

        this.registerObject('closet_01', {
            type: 'container',
            model: 'closet_double',
            size: [1.8, 2.4, 0.6],
            mass: 50,
            color: '#F5F5DC',
            interactions: ['open', 'close', 'inspect']
        });

        this.registerObject('file_cabinet', {
            type: 'container',
            model: 'cabinet_2drawer',
            size: [0.5, 1.3, 0.6],
            mass: 25,
            color: '#808080',
            drawerCount: 2,
            interactions: ['open_drawer', 'close_drawer', 'inspect']
        });

        this.registerObject('kitchen_island', {
            type: 'furniture',
            model: 'island_kitchen',
            size: [2.0, 0.9, 1.0],
            mass: 60,
            color: '#F5F5DC',
            interactions: ['push', 'place_on', 'inspect']
        });

        this.registerObject('cabinet_set_01', {
            type: 'container',
            model: 'cabinet_upper',
            size: [2.4, 0.7, 0.4],
            mass: 20,
            color: '#F5F5DC',
            interactions: ['open', 'close', 'inspect']
        });

        this.registerObject('fireplace', {
            type: 'switch',
            model: 'fireplace_stone',
            size: [2.0, 1.5, 0.8],
            mass: 200,
            color: '#696969',
            state: { lit: false },
            interactions: ['toggle', 'inspect']
        });

        this.registerObject('lamp_01', {
            type: 'switch',
            model: 'lamp_floor',
            size: [0.3, 1.5, 0.3],
            mass: 5,
            color: '#C0C0C0',
            state: { on: false },
            interactions: ['toggle', 'push', 'inspect']
        });

        this.registerObject('trunk_01', {
            type: 'container',
            model: 'trunk_wood',
            size: [0.8, 0.5, 0.6],
            mass: 20,
            color: '#8B4513',
            interactions: ['open', 'close', 'inspect']
        });

        this.registerObject('server_rack', {
            type: 'container',
            model: 'rack_server',
            size: [0.6, 2.0, 1.0],
            mass: 80,
            color: '#2F2F2F',
            interactions: ['open', 'inspect']
        });

        this.registerObject('workbench', {
            type: 'furniture',
            model: 'bench_work',
            size: [1.8, 0.9, 0.8],
            mass: 45,
            color: '#8B7355',
            interactions: ['push', 'place_on', 'inspect']
        });
    },

    registerObject(id, def) {
        this.objects.set(id, { id, ...def });
    },

    getObjectDef(id) {
        return this.objects.get(id) || null;
    },

    createInstance(objectDefId, position, rotation, customState = {}) {
        const def = this.objects.get(objectDefId);
        if (!def) {
            console.error(`[ObjectSystem] Unknown object: ${objectDefId}`);
            return null;
        }

        const instance = {
            id: `${objectDefId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            defId: objectDefId,
            type: def.type,
            model: def.model,
            position: [...position],
            rotation: rotation || 0,
            size: [...def.size],
            mass: def.mass,
            color: def.color,
            state: { ...customState },
            interactions: [...def.interactions],
            velocity: [0, 0, 0],
            isGrounded: true,
            isHighlighted: false
        };

        // Initialize default state for containers
        if (def.type === 'container') {
            instance.state.isOpen = false;
            instance.state.drawers = new Array(def.drawerCount || 0).fill(false);
            instance.state.contents = {};
        }

        // Initialize default state for switches
        if (def.type === 'switch') {
            instance.state = { ...def.state, ...customState };
        }

        return instance;
    },

    spawnObject(defId, position, rotation) {
        const instance = this.createInstance(defId, position, rotation);
        if (instance) {
            // Add to scene via callback
            if (this.onObjectSpawned) {
                this.onObjectSpawned(instance);
            }
            return instance;
        }
        return null;
    },

    getInteractionText(object, interaction) {
        const labels = {
            open: 'Open [E]',
            close: 'Close [E]',
            open_drawer: 'Open Drawer [E]',
            close_drawer: 'Close Drawer [E]',
            inspect: 'Inspect [E]',
            take: 'Take [E]',
            take_book: 'Take Book [E]',
            sit: 'Sit [E]',
            push: 'Push [F]',
            pick_up: 'Pick Up [E]',
            place: 'Place [Q]',
            read: 'Read [E]',
            lock: 'Lock [E]',
            unlock: 'Unlock [E]',
            toggle: 'Toggle [E]',
            place_on: 'Place On [E]'
        };
        return labels[interaction] || `Interact [E]`;
    },

    getAvailableInteractions(object) {
        return object.interactions || [];
    },

    setPlacementMode(enabled) {
        this.placementMode = enabled;
        if (enabled) {
            document.body.style.cursor = 'crosshair';
        } else {
            document.body.style.cursor = 'default';
            this.selectedObject = null;
        }
    },

    // Minecraft-style placement
    startPlacement(objectDefId) {
        const def = this.objects.get(objectDefId);
        if (!def || !def.canPlace) return false;
        this.selectedObject = { defId: objectDefId, ...def };
        this.setPlacementMode(true);
        return true;
    },

    confirmPlacement(worldPosition, rotation) {
        if (!this.selectedObject || !this.placementMode) return null;
        const instance = this.spawnObject(this.selectedObject.defId, worldPosition, rotation);
        this.setPlacementMode(false);
        return instance;
    },

    cancelPlacement() {
        this.selectedObject = null;
        this.setPlacementMode(false);
    },

    // Physics update for movable objects
    updatePhysics(object, dt) {
        if (object.type !== 'movable' && object.type !== 'furniture') return;
        if (!object.isGrounded) {
            object.velocity[1] -= 9.8 * dt;
            object.position[1] += object.velocity[1] * dt;
            if (object.position[1] <= 0) {
                object.position[1] = 0;
                object.velocity[1] = 0;
                object.isGrounded = true;
            }
        }
    },

    // Push object (HL1 style)
    pushObject(object, direction, force) {
        if (!object.canMove) return;
        object.velocity[0] += direction[0] * force;
        object.velocity[2] += direction[2] * force;
        object.isGrounded = false;
        
        // Apply friction
        object.velocity[0] *= 0.9;
        object.velocity[2] *= 0.9;
        
        // Update position
        object.position[0] += object.velocity[0];
        object.position[2] += object.velocity[2];
    },

    // Save/load object state
    saveState() {
        const state = {};
        for (const [id, obj] of this.objects) {
            state[id] = { position: obj.position, rotation: obj.rotation, state: obj.state };
        }
        try {
            localStorage.setItem('mp_objects', JSON.stringify(state));
        } catch (e) {
            console.warn('[ObjectSystem] Could not save state:', e);
        }
    },

    loadState() {
        try {
            const raw = localStorage.getItem('mp_objects');
            if (raw) {
                const state = JSON.parse(raw);
                for (const [id, data] of Object.entries(state)) {
                    const obj = this.objects.get(id);
                    if (obj) {
                        obj.position = data.position;
                        obj.rotation = data.rotation;
                        obj.state = data.state;
                    }
                }
                console.log('[ObjectSystem] State loaded');
            }
        } catch (e) {
            console.warn('[ObjectSystem] Could not load state:', e);
        }
    }
};

window.ObjectSystem = ObjectSystem;
