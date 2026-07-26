/**
 * Mind Palace Lakehouse — Map Loader
 * Loads map JSON, provides room templates with furniture definitions
 */

const MapLoader = {
    currentMap: null,
    maps: {},
    roomTemplates: {
        living_room: {
            size: [8, 3, 8],
            wallColor: [0.25, 0.18, 0.12],
            objects: ['couch_01', 'coffee_table', 'bookshelf_01', 'fireplace', 'lamp_01']
        },
        kitchen: {
            size: [8, 3, 8],
            wallColor: [0.3, 0.25, 0.2],
            objects: ['kitchen_island', 'cabinet_set_01']
        },
        dining_room: {
            size: [8, 3, 8],
            wallColor: [0.22, 0.15, 0.1],
            objects: ['dining_table_01', 'dining_chair', 'dining_chair', 'dining_chair', 'dining_chair']
        },
        master_bedroom: {
            size: [8, 3, 8],
            wallColor: [0.2, 0.15, 0.18],
            objects: ['bed_king', 'nightstand', 'nightstand', 'dresser', 'closet_01']
        },
        guest_bedroom: {
            size: [8, 3, 8],
            wallColor: [0.18, 0.2, 0.22],
            objects: ['bed_queen', 'nightstand', 'dresser_small', 'closet_01']
        },
        office: {
            size: [8, 3, 8],
            wallColor: [0.15, 0.2, 0.15],
            objects: ['desk_01', 'office_chair', 'bookshelf_01', 'lamp_01']
        },
        library: {
            size: [8, 3, 8],
            wallColor: [0.12, 0.08, 0.05],
            objects: ['bookshelf_wall', 'bookshelf_wall', 'desk_01', 'office_chair', 'lamp_01']
        },
        hallway: {
            size: [4, 3, 4],
            wallColor: [0.2, 0.2, 0.22],
            objects: ['lamp_01']
        },
        hallway_wide: {
            size: [6, 3, 4],
            wallColor: [0.2, 0.2, 0.22],
            objects: ['lamp_01']
        },
        stairwell: {
            size: [4, 3, 4],
            wallColor: [0.18, 0.18, 0.2],
            objects: []
        },
        basement: {
            size: [10, 3, 10],
            wallColor: [0.08, 0.08, 0.1],
            objects: ['desk_01', 'bookshelf_01', 'lamp_01']
        },
        attic: {
            size: [8, 3, 8],
            wallColor: [0.15, 0.12, 0.08],
            objects: ['dresser', 'closet_01', 'lamp_01']
        },
        mudroom: {
            size: [4, 3, 4],
            wallColor: [0.2, 0.18, 0.15],
            objects: []
        },
        bathroom: {
            size: [4, 3, 4],
            wallColor: [0.25, 0.28, 0.3],
            objects: []
        },
        laundry: {
            size: [4, 3, 4],
            wallColor: [0.22, 0.22, 0.25],
            objects: []
        },
        porch: {
            size: [6, 3, 4],
            wallColor: [0.3, 0.25, 0.2],
            objects: ['rocking_chair', 'rocking_chair']
        },
        deck: {
            size: [6, 3, 4],
            wallColor: [0.25, 0.22, 0.18],
            objects: []
        }
    },

    async loadMap(mapName) {
        console.log(`[MapLoader] Loading map: ${mapName}`);
        try {
            const response = await fetch(`maps/${mapName}/map.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.currentMap = mapName;
            this.maps[mapName] = data;
            console.log(`[MapLoader] Loaded ${data.rooms.length} rooms`);
            return data;
        } catch (e) {
            console.warn(`[MapLoader] Could not load map ${mapName}:`, e);
            console.log('[MapLoader] Using default map');
            return this.createDefaultMap();
        }
    },

    createDefaultMap() {
        return {
            name: 'Default Lakehouse',
            rooms: [
                { id: 'living_room', type: 'living_room', level: 'ground', position: [0, 0, 0] },
                { id: 'kitchen', type: 'kitchen', level: 'ground', position: [10, 0, 0] },
                { id: 'hallway', type: 'hallway', level: 'ground', position: [5, 0, 0] },
                { id: 'office', type: 'office', level: 'upper', position: [0, 4, 0] },
                { id: 'master_bedroom', type: 'master_bedroom', level: 'upper', position: [10, 4, 0] },
                { id: 'basement', type: 'basement', level: 'basement', position: [0, -3, 0] }
            ],
            spawn: { room: 'living_room', position: [1.5, 1.6, 1.5] }
        };
    },

    getRoomTemplate(type) {
        return this.roomTemplates[type] || this.roomTemplates.hallway;
    },

    getSpawn() {
        if (this.currentMap && this.maps[this.currentMap]) {
            const spawn = this.maps[this.currentMap].spawn;
            if (spawn && spawn.position) return spawn.position;
        }
        return [1.5, 1.6, 1.5];
    },

    getRoom(roomId) {
        if (this.currentMap && this.maps[this.currentMap]) {
            return this.maps[this.currentMap].rooms.find(r => r.id === roomId) || null;
        }
        return null;
    }
};

window.MapLoader = MapLoader;
