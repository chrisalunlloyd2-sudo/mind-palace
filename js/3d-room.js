// Mind Palace 3D - Room System with 3D Bookshelf
// True 3D room interior with animated books

const RoomSystem3D = {
    activeRoom: null,
    roomScene: null,
    roomCamera: null,
    roomRenderer: null,
    bookshelves: [],
    books: [],
    
    init() {
        // Room UI event listeners are in index-3d.html
        console.log('📚 RoomSystem3D initialized');
    },
    
    enterRoom(roomData) {
        this.activeRoom = roomData;
        
        // Hide 3D hallway canvas, show room UI
        document.getElementById('gameCanvas3D').style.display = 'none';
        document.getElementById('room-container').style.display = 'block';
        document.getElementById('crosshair').style.display = 'none';
        
        // Render room info
        this.renderRoomInfo(roomData);
        
        // Build 3D bookshelf in room
        this.build3DBookshelf(roomData);
        
        // Analyze with Expert System
        if (window.ExpertSystem) {
            const analysis = ExpertSystem.analyze(roomData);
            ExpertSystem.renderPanel(analysis, roomData);
        }
        
        // Audio
        if (AudioSystem) {
            const wing = roomData.payload?.wing || 'west';
            AudioSystem.playAmbient(wing);
            AudioSystem.playSound('doorOpen');
        }
    },
    
    exitRoom() {
        // Hide room UI, show 3D hallway
        document.getElementById('room-container').style.display = 'none';
        document.getElementById('gameCanvas3D').style.display = 'block';
        document.getElementById('crosshair').style.display = 'block';
        document.getElementById('expert-panel').style.display = 'none';
        
        // Clean up 3D room scene
        this.cleanupRoomScene();
        
        this.activeRoom = null;
        
        // Audio
        if (AudioSystem) {
            AudioSystem.playAmbient('west');
            AudioSystem.playSound('doorClose');
        }
    },
    
    renderRoomInfo(room) {
        const payload = room.payload || {};
        
        this.setText('room-title', room.label);
        this.setText('room-category', payload.category || 'Unknown');
        this.setText('room-language', payload.language || 'Unknown');
        this.setText('room-stars', `⭐ ${payload.stars ?? 0}`);
        this.setText('room-updated', payload.updated ? new Date(payload.updated).toLocaleDateString() : 'Unknown');
        this.setText('room-description', payload.description || 'No description');
    },
    
    build3DBookshelf(roomData) {
        const shelfContainer = document.getElementById('bookshelf');
        if (!shelfContainer) return;
        
        shelfContainer.innerHTML = '';
        shelfContainer.className = 'bookshelf-3d';
        
        const payload = roomData.payload || {};
        const files = payload.files || [];
        const folders = payload.folders || [];
        
        // Wing indicator
        const wing = payload.wing || 'west';
        const wingIndicator = document.createElement('div');
        wingIndicator.className = `wing-indicator wing-${wing}`;
        wingIndicator.innerHTML = `📍 ${wing.toUpperCase()} WING`;
        shelfContainer.appendChild(wingIndicator);
        
        // Create 3D bookshelf rows
        const allItems = [
            ...folders.map(f => ({ name: f, type: 'folder' })),
            ...files.map(f => ({ name: f, type: 'file' }))
        ];
        
        // Group into rows of 8 books
        const rows = [];
        for (let i = 0; i < allItems.length; i += 8) {
            rows.push(allItems.slice(i, i + 8));
        }
        
        // Render each row
        rows.forEach((row, rowIndex) => {
            const shelfRow = document.createElement('div');
            shelfRow.className = 'shelf-row-3d';
            
            row.forEach((item, itemIndex) => {
                const book = this.create3DBook(item, rowIndex, itemIndex);
                shelfRow.appendChild(book);
            });
            
            shelfContainer.appendChild(shelfRow);
        });
        
        // Empty state
        if (allItems.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-shelf';
            empty.innerHTML = '📚 This room is empty<br><small>Click "Expert Suggestions" to generate architecture</small>';
            shelfContainer.appendChild(empty);
        }
    },
    
    create3DBook(item, row, col) {
        const book = document.createElement('div');
        book.className = 'book-3d';
        book.dataset.name = item.name;
        book.dataset.type = item.type;
        
        // Determine color by file type
        const ext = item.name.split('.').pop()?.toLowerCase() || '';
        let color = '#8b4513'; // Default brown
        if (item.type === 'folder') color = '#744210';
        else if (ext === 'py') color = '#3776ab';
        else if (ext === 'js') color = '#f7df1e';
        else if (ext === 'json') color = '#cb3837';
        else if (ext === 'md') color = '#519aba';
        else if (ext === 'css') color = '#264de4';
        else if (ext === 'html') color = '#e34c26';
        else if (ext === 'java') color = '#b07219';
        
        book.innerHTML = `
            <div class="book-pages" style="background: ${color};">
                <div class="book-content">
                    <strong>${this.truncate(item.name, 15)}</strong>
                </div>
            </div>
        `;
        
        // Click to open (flip animation)
        book.onclick = () => {
            if (AudioSystem) AudioSystem.playSound('bookSelect');
            
            // Flip animation
            book.classList.toggle('open');
            
            // Show file info after delay
            setTimeout(() => {
                this.openFile(item);
            }, 200);
        };
        
        // Hover effect
        book.onmouseenter = () => {
            if (AudioSystem) AudioSystem.playSound('bookHover');
            book.style.transform = 'translateY(-5px)';
        };
        
        book.onmouseleave = () => {
            book.style.transform = 'translateY(0)';
        };
        
        return book;
    },
    
    truncate(str, len) {
        return str.length > len ? str.substring(0, len - 2) + '..' : str;
    },
    
    openFile(item) {
        const viewer = document.getElementById('file-viewer');
        const content = document.getElementById('file-content');
        const title = document.getElementById('file-title');
        
        if (!viewer || !content || !title) return;
        
        title.textContent = item.name;
        viewer.style.display = 'block';
        
        const repoUrl = this.activeRoom.payload?.url || '#';
        
        if (item.type === 'folder') {
            content.innerHTML = `
                <div class="folder-placeholder">
                    <h4>📁 Folder: ${item.name}</h4>
                    <p>Contains multiple files and subdirectories.</p>
                    <a href="${repoUrl}/tree/main/${item.name}" target="_blank" class="view-on-github">
                        Browse on GitHub →
                    </a>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="file-placeholder">
                    <h4>📄 File: ${item.name}</h4>
                    <p>Click below to view on GitHub</p>
                    <a href="${repoUrl}/blob/main/${item.name}" target="_blank" class="view-on-github">
                        View on GitHub →
                    </a>
                </div>
            `;
        }
        
        // Audio
        if (AudioSystem) AudioSystem.playSound('pageTurn');
    },
    
    cleanupRoomScene() {
        // Clear bookshelf
        const shelf = document.getElementById('bookshelf');
        if (shelf) shelf.innerHTML = '';
        
        // Hide file viewer
        const viewer = document.getElementById('file-viewer');
        if (viewer) viewer.style.display = 'none';
        
        // Clear references
        this.bookshelves = [];
        this.books = [];
    },
    
    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
};

window.RoomSystem3D = RoomSystem3D;
