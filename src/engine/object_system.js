/**
 * Mind Palace Lakehouse — Object System
 * Furniture definitions, instance creation, interaction system
 */

const ObjectSystem = {
    objects: new Map(),
    instances: [],

    async init() {
        console.log('[ObjectSystem] Initializing...');
        this.registerDefaults();
        console.log(`[ObjectSystem] Registered ${this.objects.size} object types`);
        return true;
    },

    registerDefaults() {
        // Living room
        this.registerObject('couch_01', {
            name: 'Couch',
            size: [2.0, 0.8, 0.9],
            color: [0.3, 0.2, 0.15],
            interactions: ['sit', 'push'],
            state: { isOpen: false }
        });
        this.registerObject('coffee_table', {
            name: 'Coffee Table',
            size: [1.2, 0.5, 0.8],
            color: [0.4, 0.3, 0.2],
            interactions: ['push'],
            state: {}
        });
        this.registerObject('bookshelf_01', {
            name: 'Bookshelf',
            size: [1.0, 2.0, 0.4],
            color: [0.35, 0.25, 0.15],
            interactions: ['inspect', 'push'],
            state: { isOpen: false }
        });
        this.registerObject('fireplace', {
            name: 'Fireplace',
            size: [1.5, 1.2, 0.6],
            color: [0.2, 0.15, 0.1],
            interactions: ['toggle'],
            state: { on: false }
        });
        this.registerObject('lamp_01', {
            name: 'Lamp',
            size: [0.3, 1.2, 0.3],
            color: [0.8, 0.7, 0.5],
            interactions: ['toggle', 'push'],
            state: { on: true }
        });

        // Kitchen
        this.registerObject('kitchen_island', {
            name: 'Kitchen Island',
            size: [2.0, 0.9, 1.0],
            color: [0.5, 0.45, 0.4],
            interactions: ['push'],
            state: {}
        });
        this.registerObject('cabinet_set_01', {
            name: 'Cabinet',
            size: [1.5, 0.8, 0.5],
            color: [0.45, 0.35, 0.25],
            interactions: ['open', 'push'],
            state: { isOpen: false }
        });

        // Dining
        this.registerObject('dining_table_01', {
            name: 'Dining Table',
            size: [2.0, 0.75, 1.2],
            color: [0.4, 0.3, 0.2],
            interactions: ['push'],
            state: {}
        });
        this.registerObject('dining_chair', {
            name: 'Dining Chair',
            size: [0.5, 0.9, 0.5],
            color: [0.35, 0.25, 0.15],
            interactions: ['sit', 'push'],
            state: {}
        });

        // Bedroom
        this.registerObject('bed_king', {
            name: 'King Bed',
            size: [2.0, 0.6, 2.2],
            color: [0.5, 0.45, 0.4],
            interactions: ['sit', 'push'],
            state: {}
        });
        this.registerObject('bed_queen', {
            name: 'Queen Bed',
            size: [1.8, 0.6, 2.0],
            color: [0.45, 0.4, 0.35],
            interactions: ['sit', 'push'],
            state: {}
        });
        this.registerObject('nightstand', {
            name: 'Nightstand',
            size: [0.5, 0.6, 0.5],
            color: [0.35, 0.25, 0.15],
            interactions: ['open', 'push'],
            state: { isOpen: false }
        });
        this.registerObject('dresser', {
            name: 'Dresser',
            size: [1.2, 1.0, 0.5],
            color: [0.4, 0.3, 0.2],
            interactions: ['open', 'push'],
            state: { isOpen: false }
        });
        this.registerObject('dresser_small', {
            name: 'Small Dresser',
            size: [0.8, 0.8, 0.5],
            color: [0.35, 0.25, 0.15],
            interactions: ['open', 'push'],
            state: { isOpen: false }
        });
        this.registerObject('closet_01', {
            name: 'Closet',
            size: [1.5, 2.4, 0.6],
            color: [0.3, 0.25, 0.2],
            interactions: ['open', 'push'],
            state: { isOpen: false }
        });

        // Office
        this.registerObject('desk_01', {
            name: 'Desk',
            size: [1.5, 0.75, 0.8],
            color: [0.35, 0.25, 0.15],
            interactions: ['push'],
            state: {}
        });
        this.registerObject('office_chair', {
            name: 'Office Chair',
            size: [0.5, 0.8, 0.5],
            color: [0.2, 0.2, 0.25],
            interactions: ['sit', 'push'],
            state: {}
        });
        this.registerObject('bookshelf_wall', {
            name: 'Wall Bookshelf',
            size: [2.0, 2.4, 0.3],
            color: [0.3, 0.2, 0.1],
            interactions: ['inspect', 'push'],
            state: { isOpen: false }
        });

        // Misc
        this.registerObject('file_cabinet', {
            name: 'File Cabinet',
            size: [0.5, 1.2, 0.5],
            color: [0.3, 0.3, 0.35],
            interactions: ['open', 'read', 'push'],
            state: { isOpen: false, cabinetId: null }
        });
        this.registerObject('rocking_chair', {
            name: 'Rocking Chair',
            size: [0.6, 0.9, 0.7],
            color: [0.35, 0.25, 0.15],
            interactions: ['sit', 'push'],
            state: {}
        });
    },

    registerObject(id, def) {
        this.objects.set(id, {
            id: id,
            ...def,
            getColor: () => def.color || [0.5, 0.5, 0.5],
            getSize: () => def.size || [0.5, 0.5, 0.5]
        });
    },

    getObjectDef(id) {
        return this.objects.get(id) || null;
    },

    createInstance(objectDefId, position, rotation, customState) {
        const def = this.objects.get(objectDefId);
        if (!def) {
            console.warn(`[ObjectSystem] Unknown object: ${objectDefId}`);
            return null;
        }
        const instance = {
            defId: objectDefId,
            def: def,
            position: position || [0, 0, 0],
            rotation: rotation || 0,
            velocity: [0, 0, 0],
            state: customState ? { ...def.state, ...customState } : { ...def.state },
            isStatic: false,
            id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
        };
        this.instances.push(instance);
        return instance;
    },

    getAvailableInteractions(instance) {
        if (!instance || !instance.def) return [];
        return instance.def.interactions || [];
    },

    getInteractionText(instance, interaction) {
        if (!instance || !instance.def) return '';
        const name = instance.def.name || instance.defId;
        switch (interaction) {
            case 'open': return instance.state.isOpen ? `[E] Close ${name}` : `[E] Open ${name}`;
            case 'toggle': return instance.state.on ? `[E] Turn off ${name}` : `[E] Turn on ${name}`;
            case 'sit': return `[E] Sit on ${name}`;
            case 'read': return `[E] Read ${name}`;
            case 'inspect': return `[E] Inspect ${name}`;
            case 'push': return `[F] Push ${name}`;
            default: return `[E] Interact with ${name}`;
        }
    },

    pushObject(instance, direction, force) {
        if (!instance || instance.isStatic) return;
        const f = force || 5;
        instance.velocity = [
            (direction[0] || 0) * f,
            0,
            (direction[2] || 0) * f
        ];
    },

    update(dt) {
        for (const inst of this.instances) {
            if (inst.velocity && (inst.velocity[0] !== 0 || inst.velocity[1] !== 0 || inst.velocity[2] !== 0)) {
                inst.position[0] += inst.velocity[0] * dt;
                inst.position[2] += inst.velocity[2] * dt;
                inst.velocity[0] *= 0.9;
                inst.velocity[2] *= 0.9;
                if (Math.abs(inst.velocity[0]) < 0.01) inst.velocity[0] = 0;
                if (Math.abs(inst.velocity[2]) < 0.01) inst.velocity[2] = 0;
            }
        }
    }
};

window.ObjectSystem = ObjectSystem;
