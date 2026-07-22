/**
 * 4D Creator Overlay — Create Research Rooms
 * No GitHub API - just local rooms for notes/research
 */

function showCreationOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'creation-overlay';
    overlay.innerHTML = `
        <div class="creation-header">
            <h2>📝 Create Research Room</h2>
            <button onclick="closeCreationOverlay()" class="close-btn">✕</button>
        </div>
        
        <div class="creation-form">
            <div class="form-group">
                <label>Room Name</label>
                <input type="text" id="room-name" placeholder="e.g., Quantum Computing Research">
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="room-description" placeholder="What's this room for?"></textarea>
            </div>
            
            <div class="form-group">
                <label>Category</label>
                <select id="room-category">
                    <option value="research">Research Notes</option>
                    <option value="project">Project Planning</option>
                    <option value="ideas">Ideas & Brainstorming</option>
                    <option value="archive">Archive</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Initial Files</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" checked> Overview.md</label>
                    <label><input type="checkbox" checked> Notes.md</label>
                    <label><input type="checkbox" checked> TODO.md</label>
                    <label><input type="checkbox"> Hypotheses.md</label>
                </div>
            </div>
            
            <button onclick="createResearchRoom()" class="generate-btn">
                🚀 Create Room
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    overlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 20, 10, 0.95);
        border: 2px solid #00ff88;
        border-radius: 10px;
        padding: 30px;
        z-index: 1000;
        color: #00ff88;
        font-family: 'Courier New', monospace;
        min-width: 500px;
        box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
    `;
}

function closeCreationOverlay() {
    const overlay = document.getElementById('creation-overlay');
    if (overlay) overlay.remove();
}

function createResearchRoom() {
    const name = document.getElementById('room-name').value.trim();
    const description = document.getElementById('room-description').value.trim();
    const category = document.getElementById('room-category').value;
    
    if (!name) {
        alert('Please enter a room name');
        return;
    }
    
    // Create room in local repo browser
    const roomKey = window.localRepoBrowser.addResearchRoom(name, description);
    
    // Generate bookshelf content
    const room = window.localRepoBrowser.getRoom(roomKey);
    
    console.log(`✅ Created research room: ${roomKey}`);
    console.log('Room config:', room);
    
    // Close overlay
    closeCreationOverlay();
    
    // Show success message
    alert(`🏛️ Room "${name}" created!\n\nThe room will appear in the South Wing.\nPress ESC to exit mouse mode, then reload to see your new door.`);
}

// Export
window.showCreationOverlay = showCreationOverlay;
window.closeCreationOverlay = closeCreationOverlay;
window.createResearchRoom = createResearchRoom;
