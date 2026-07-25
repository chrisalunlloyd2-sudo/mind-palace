/**
 * Mind Palace Lakehouse — Map Loader & Room System
 * Phase 2: Lakehouse Environment & Map System
 * 
 * Features:
 * - JSON map format with rooms, connections, levels
 * - Room type definitions (15+ room types)
 * - Level transitions (stairs, elevator)
 * - Minimap renderer
 * - Exterior shell (porch, dock, yard)
 */

const MapLoader = {
    maps: {},
    currentMap: null,
    currentLevel: null,
    rooms: new Map(),
    connections: [],
    playerSpawn: [0, 1.6, 0],

    // Room type templates
    roomTemplates: {
        living_room: {
            size: [12, 3.5, 10],
            wallTexture: 'log_cabin',
            floorTexture: 'hardwood',
            ceilingTexture: 'vaulted_beam',
            ambientLight: 0.4,
            objects: ['couch_01', 'coffee_table', 'bookshelf_01', 'fireplace', 'rug_01', 'lamp_01']
        },
        kitchen: {
            size: [8, 3, 7],
            wallTexture: 'drywall_white',
            floorTexture: 'tile_kitchen',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.6,
            objects: ['kitchen_island', 'cabinet_set_01', 'countertop', 'stove', 'fridge', 'sink']
        },
        dining_room: {
            size: [9, 3, 8],
            wallTexture: 'wallpaper_damask',
            floorTexture: 'hardwood_dark',
            ceilingTexture: 'ceiling_tray',
            ambientLight: 0.35,
            objects: ['dining_table_01', 'dining_chair_x6', 'sideboard', 'chandelier']
        },
        master_bedroom: {
            size: [10, 3, 9],
            wallTexture: 'drywall_warm',
            floorTexture: 'carpet_plush',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.3,
            objects: ['bed_king', 'nightstand_x2', 'dresser', 'closet_01', 'mirror_01', 'lamp_02']
        },
        guest_bedroom: {
            size: [7, 3, 6],
            wallTexture: 'drywall_blue',
            floorTexture: 'carpet_berber',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.3,
            objects: ['bed_queen', 'nightstand', 'dresser_small', 'closet_02']
        },
        office: {
            size: [8, 3, 7],
            wallTexture: 'drywall_green',
            floorTexture: 'hardwood',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.5,
            objects: ['desk_01', 'office_chair', 'bookshelf_02', 'file_cabinet_x2', 'lamp_03', 'computer']
        },
        library: {
            size: [10, 4, 8],
            wallTexture: 'paneling_dark',
            floorTexture: 'hardwood_dark',
            ceilingTexture: 'ceiling_coffered',
            ambientLight: 0.25,
            objects: ['bookshelf_wall', 'reading_chair_x2', 'library_table', 'globe', 'fireplace_small']
        },
        hallway: {
            size: [3, 3, 12],
            wallTexture: 'drywall',
            floorTexture: 'hardwood',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.3,
            objects: ['hallway_table', 'mirror_02', 'art_01', 'art_02', 'art_03']
        },
        hallway_wide: {
            size: [5, 3, 10],
            wallTexture: 'drywall',
            floorTexture: 'hardwood',
            ceilingTexture: 'ceiling_tray',
            ambientLight: 0.35,
            objects: ['bench_01', 'plant_01', 'art_04', 'art_05']
        },
        stairwell: {
            size: [4, 6, 5],
            wallTexture: 'drywall',
            floorTexture: 'carpet_stairs',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.25,
            objects: ['stairs_spiral', 'railing', 'landing_light']
        },
        basement: {
            size: [15, 2.5, 12],
            wallTexture: 'concrete',
            floorTexture: 'concrete_floor',
            ceilingTexture: 'ceiling_exposed',
            ambientLight: 0.15,
            objects: ['workbench', 'tool_rack', 'storage_shelf_x3', 'server_rack', 'water_heater']
        },
        attic: {
            size: [12, 2.2, 10],
            wallTexture: 'drywall_old',
            floorTexture: 'wood_planks',
            ceilingTexture: 'ceiling_sloped',
            ambientLight: 0.1,
            objects: ['trunk_01', 'trunk_02', 'old_furniture', 'dusty_bookshelf', 'antique_lamp']
        },
        mudroom: {
            size: [4, 3, 3],
            wallTexture: 'drywall',
            floorTexture: 'tile_mudroom',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.5,
            objects: ['coat_hooks', 'bench_02', 'boot_tray', 'umbrella_stand']
        },
        bathroom: {
            size: [5, 3, 4],
            wallTexture: 'tile_bathroom',
            floorTexture: 'tile_bathroom_floor',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.5,
            objects: ['vanity', 'mirror_03', 'toilet', 'tub', 'shower']
        },
        laundry: {
            size: [4, 3, 3],
            wallTexture: 'drywall',
            floorTexture: 'tile_laundry',
            ceilingTexture: 'ceiling_flat',
            ambientLight: 0.4,
            objects: ['washer', 'dryer', 'folding_table', 'shelf_laundry']
        },
        porch: {
            size: [8, 3, 4],
            wallTexture: 'cedar',
            floorTexture: 'deck_wood',
            ceilingTexture: 'ceiling_open',
            ambientLight: 0.7,
            objects: ['rocking_chair_x2', 'porch_swing', 'side_table', 'plant_02', 'plant_03']
        },
        deck: {
            size: [10, 3, 6],
            wallTexture: 'cedar',
            floorTexture: 'deck_wood',
            ceilingTexture: 'ceiling_open',
            ambientLight: 0.8,
            objects: ['deck_table', 'deck_chair_x4', 'umbrella', 'grill', 'cooler']
        }
    },

    async loadMap(mapName) {
        console.log(`[MapLoader] Loading map: ${mapName}`);
        try {
            const resp = await fetch(`maps/${mapName}/map.json`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            this.maps[mapName] = data;
            this.currentMap = mapName;
            console.log(`[MapLoader] Map loaded: ${data.name} (${data.levels.length} levels)`);
            return data;
        } catch (e) {
            console.error(`[MapLoader] Failed to load map ${mapName}:`, e);
            // Return default map
            return this.createDefaultMap();
        }
    },

    createDefaultMap() {
        return {
            name: "Lakehouse",
            version: "1.0",
            levels: ["ground", "upper", "basement", "attic"],
            rooms: [
                { id: "living_room", type: "living_room", level: "ground", position: [0, 0, 0] },
                { id: "kitchen", type: "kitchen", level: "ground", position: [14, 0, 0] },
                { id: "dining_room", type: "dining_room", level: "ground", position: [14, 0, 10] },
                { id: "hallway_ground", type: "hallway", level: "ground", position: [6, 0, 0] },
                { id: "mudroom", type: "mudroom", level: "ground", position: [0, 0, 12] },
                { id: "bathroom_ground", type: "bathroom", level: "ground", position: [6, 0, 12] },
                { id: "stairs_ground", type: "stairwell", level: "ground", position: [0, 0, 6] },
                { id: "master_bedroom", type: "master_bedroom", level: "upper", position: [0, 4, 0] },
                { id: "office", type: "office", level: "upper", position: [10, 4, 0] },
                { id: "guest_bedroom_1", type: "guest_bedroom", level: "upper", position: [0, 4, 10] },
                { id: "guest_bedroom_2", type: "guest_bedroom", level: "upper", position: [10, 4, 10] },
                { id: "hallway_upper", type: "hallway", level: "upper", position: [5, 4, 5] },
                { id: "bathroom_upper", type: "bathroom", level: "upper", position: [5, 4, 12] },
                { id: "library", type: "library", level: "upper", position: [14, 4, 5] },
                { id: "basement_main", type: "basement", level: "basement", position: [0, -3, 0] },
                { id: "laundry", type: "laundry", level: "basement", position: [10, -3, 0] },
                { id: "attic_main", type: "attic", level: "attic", position: [0, 8, 0] },
                { id: "porch", type: "porch", level: "ground", position: [-6, 0, 0] },
                { id: "deck", type: "deck", level: "ground", position: [6, 0, -6] }
            ],
            connections: [
                { from: "living_room", to: "hallway_ground", type: "doorway" },
                { from: "living_room", to: "dining_room", type: "archway" },
                { from: "living_room", to: "porch", type: "door" },
                { from: "kitchen", to: "dining_room", type: "archway" },
                { from: "kitchen", to: "hallway_ground", type: "doorway" },
                { from: "hallway_ground", to: "mudroom", type: "door" },
                { from: "hallway_ground", to: "bathroom_ground", type: "door" },
                { from: "hallway_ground", to: "stairs_ground", type: "doorway" },
                { from: "stairs_ground", to: "hallway_upper", type: "stairs" },
                { from: "hallway_upper", to: "master_bedroom", type: "door" },
                { from: "hallway_upper", to: "office", type: "door" },
                { from: "hallway_upper", to: "guest_bedroom_1", type: "door" },
                { from: "hallway_upper", to: "guest_bedroom_2", type: "door" },
                { from: "hallway_upper", to: "bathroom_upper", type: "door" },
                { from: "hallway_upper", to: "library", type: "door" },
                { from: "stairs_ground", to: "basement_main", type: "stairs" },
                { from: "basement_main", to: "laundry", type: "doorway" },
                { from: "stairs_ground", to: "attic_main", type: "stairs" },
                { from: "living_room", to: "deck", type: "door" }
            ],
            spawn: { room: "living_room", position: [2, 1.6, 2] }
        };
    },

    getRoom(roomId) {
        if (!this.currentMap) return null;
        const map = this.maps[this.currentMap];
        if (!map) return null;
        return map.rooms.find(r => r.id === roomId) || null;
    },

    getRoomTemplate(type) {
        return this.roomTemplates[type] || this.roomTemplates.hallway;
    },

    getConnections(roomId) {
        if (!this.currentMap) return [];
        const map = this.maps[this.currentMap];
        return map.connections.filter(c => c.from === roomId || c.to === roomId);
    },

    getRoomsOnLevel(level) {
        if (!this.currentMap) return [];
        const map = this.maps[this.currentMap];
        return map.rooms.filter(r => r.level === level);
    },

    getSpawn() {
        if (!this.currentMap) return this.playerSpawn;
        const map = this.maps[this.currentMap];
        return map.spawn ? [map.spawn.position[0], map.spawn.position[1], map.spawn.position[2]] : this.playerSpawn;
    },

    getLevelHeight(level) {
        const heights = { ground: 0, upper: 4, basement: -3, attic: 8 };
        return heights[level] || 0;
    }
};

window.MapLoader = MapLoader;
