/**
 * 4D Engine — Integrates Creation with 3D Engine
 * Uses LocalRepoBrowser for repo/room management
 */

function init4DEngine() {
    console.log('🏛️ Initializing 4D Engine...');
    
    // Get rooms from local repo browser
    const rooms = window.localRepoBrowser.getAllRooms();
    
    // Create doors in hallway for each room
    rooms.forEach((room, index) => {
        createDoorForRoom(room, index);
    });
    
    // Setup N key for new research room
    document.addEventListener('keydown', (e) => {
        if (e.key === 'n' || e.key === 'N') {
            openCreationOverlay();
        }
        if (e.key === 'e' || e.key === 'E') {
            toggleExpertPanel();
        }
    });
    
    console.log(`🚪 Created ${rooms.length} doors in hallway`);
}

function createDoorForRoom(room, index) {
    // Door is created by 3D engine based on room position
    // This function registers the door with the room system
    window.roomRegistry = window.roomRegistry || {};
    window.roomRegistry[room.name] = {
        ...room,
        doorIndex: index
    };
}

function openCreationOverlay() {
    // Show creation overlay from 4d-creator.js
    if (window.showCreationOverlay) {
        window.showCreationOverlay();
    }
}

function toggleExpertPanel() {
    // Toggle expert panel from expert.js
    if (window.toggleExpertPanel) {
        window.toggleExpertPanel();
    }
}

// Called when a new room is created
function onRoomCreated(roomName, roomConfig) {
    window.localRepoBrowser.rooms[roomName] = roomConfig;
    
    // Add door to hallway (would need to update 3D scene)
    console.log(`🚪 New room created: ${roomName}`);
    
    // For now, just log - full 3D door creation needs scene update
    alert(`Room "${roomName}" created! (Door will appear on next reload)`);
}

// Export for use in creator
window.init4DEngine = init4DEngine;
window.onRoomCreated = onRoomCreated;
