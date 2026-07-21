// Mind Palace Room System - Phase 2 (with Expert Integration)

const RoomSystem = {
    activeRoom: null,
    currentWing: 'west',
    currentSuggestions: null,
    
    init() {
        this.setupKeyboard();
        this.setupUI();
    },
    
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!this.activeRoom) return;
            
            if (e.key === 'Escape' || e.key === 'Backspace') {
                this.exitRoom();
            } else if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.scrollBookshelf(-1);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                this.scrollBookshelf(1);
            }
        });
    },
    
    setupUI() {
        const backBtn = document.getElementById('back-button');
        if (backBtn) {
            backBtn.onclick = () => this.exitRoom();
        }
    },
    
    enterRoom(repoData) {
        if (!repoData) return;
        
        this.activeRoom = repoData;
        this.currentWing = repoData.payload?.wing || 'west';
        
        AudioSystem.playSound('doorOpen');
        AudioSystem.playAmbient(this.currentWing);
        
        const hallway = document.getElementById('hallway-container');
        const room = document.getElementById('room-container');
        if (hallway) hallway.style.display = 'none';
        if (room) room.style.display = 'block';
        
        this.renderRoom(repoData);
        
        // Analyze with Expert System
        if (window.ExpertSystem) {
            this.currentSuggestions = ExpertSystem.analyze(repoData);
            ExpertSystem.renderPanel(this.currentSuggestions, repoData);
        }
        
        const shelf = document.getElementById('bookshelf');
        if (shelf) shelf.focus();
    },
    
    exitRoom() {
        if (!this.activeRoom) return;
        
        AudioSystem.playSound('doorClose');
        AudioSystem.playAmbient('west');
        
        const hallway = document.getElementById('hallway-container');
        const room = document.getElementById('room-container');
        if (hallway) hallway.style.display = 'block';
        if (room) room.style.display = 'none';
        
        // Hide expert panel
        const expertPanel = document.getElementById('expert-panel');
        if (expertPanel) expertPanel.style.display = 'none';
        
        this.activeRoom = null;
        this.currentSuggestions = null;
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) canvas.focus();
    },
    
    renderRoom(repo) {
        const payload = repo.payload || {};
        const files = payload.files || [];
        const folders = payload.folders || [];
        const category = payload.category || 'Unknown';
        
        this.setText('room-title', repo.label);
        this.setText('room-category', category);
        this.setText('room-language', payload.language || 'Unknown');
        this.setText('room-stars', `⭐ ${payload.stars ?? 0}`);
        this.setText('room-updated', payload.updated ? new Date(payload.updated).toLocaleDateString() : 'Unknown');
        this.setText('room-description', payload.description || 'No description available');
        
        const shelf = document.getElementById('bookshelf');
        if (!shelf) return;
        
        shelf.innerHTML = '';
        
        // Wing indicator
        const wingIndicator = document.createElement('div');
        wingIndicator.className = `wing-indicator wing-${this.currentWing}`;
        wingIndicator.innerHTML = `📍 ${this.currentWing.toUpperCase()} WING`;
        shelf.appendChild(wingIndicator);
        
        // Existing files/folders from GitHub
        if (folders.length > 0) {
            shelf.appendChild(this.createShelfSection('📁 Existing Folders', folders, 'folder'));
        }
        
        if (files.length > 0) {
            const byExt = this.groupByExtension(files);
            Object.keys(byExt).sort().forEach(ext => {
                shelf.appendChild(this.createShelfSection(`📄 .${ext} Files`, byExt[ext], 'file', ext));
            });
        }
        
        // Show suggested files if expert has recommendations
        if (this.currentSuggestions && this.currentSuggestions.suggestions) {
            const suggested = this.currentSuggestions.suggestions;
            
            if (suggested.folders && suggested.folders.length > 0) {
                const suggestedFolders = suggested.folders
                    .filter(f => !f.approved)
                    .map(f => f.name);
                if (suggestedFolders.length > 0) {
                    shelf.appendChild(this.createShelfSection('💡 Suggested Folders', suggestedFolders, 'suggested-folder'));
                }
            }
            
            if (suggested.files && suggested.files.length > 0) {
                const suggestedFiles = suggested.files
                    .filter(f => !f.approved)
                    .map(f => f.name);
                if (suggestedFiles.length > 0) {
                    shelf.appendChild(this.createShelfSection('💡 Suggested Files', suggestedFiles, 'suggested-file'));
                }
            }
        }
        
        // Empty state
        if (files.length === 0 && folders.length === 0 && !this.currentSuggestions) {
            const empty = document.createElement('div');
            empty.className = 'empty-shelf';
            empty.innerHTML = '📚 This room is empty<br><small>Click "Expert Suggestions" to generate architecture</small>';
            shelf.appendChild(empty);
        }
        
        const viewer = document.getElementById('file-viewer');
        if (viewer) viewer.style.display = 'none';
    },
    
    createShelfSection(label, items, type, ext = '') {
        const section = document.createElement('div');
        section.className = 'shelf-section';
        
        const sectionLabel = document.createElement('div');
        sectionLabel.className = 'shelf-label';
        sectionLabel.textContent = label;
        section.appendChild(sectionLabel);
        
        const booksRow = document.createElement('div');
        booksRow.className = 'books-row';
        
        items.forEach(item => {
            const book = this.createBook(item, type, ext);
            booksRow.appendChild(book);
        });
        
        section.appendChild(booksRow);
        return section;
    },
    
    createBook(title, type, ext = '') {
        const book = document.createElement('div');
        book.className = `book book-${type}`;
        if (ext) book.dataset.ext = ext;
        
        book.innerHTML = `
            <div class="book-spine">
                <span class="book-title">${this.truncate(title, 18)}</span>
            </div>
        `;
        
        book.onclick = () => {
            AudioSystem.playSound('bookSelect');
            this.openFile(title, type);
        };
        
        book.onmouseenter = () => {
            AudioSystem.playSound('bookHover');
        };
        
        return book;
    },
    
    groupByExtension(files) {
        const groups = {};
        files.forEach(f => {
            const ext = f.includes('.') ? f.split('.').pop() : 'other';
            if (!groups[ext]) groups[ext] = [];
            groups[ext].push(f);
        });
        return groups;
    },
    
    truncate(str, len) {
        return str.length > len ? str.substring(0, len - 2) + '..' : str;
    },
    
    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },
    
    openFile(filename, type) {
        AudioSystem.playSound('pageTurn');
        
        const viewer = document.getElementById('file-viewer');
        const content = document.getElementById('file-content');
        const title = document.getElementById('file-title');
        
        if (!viewer || !content || !title) return;
        
        title.textContent = filename;
        viewer.style.display = 'block';
        
        const repoUrl = this.activeRoom.payload?.url || '#';
        
        if (type === 'folder' || type === 'suggested-folder') {
            content.innerHTML = `
                <div class="folder-placeholder">
                    <h4>📁 Folder: ${filename}</h4>
                    <p>Contains multiple files and subdirectories.</p>
                    <a href="${repoUrl}/tree/main/${filename}" target="_blank" class="view-on-github">
                        Browse on GitHub →
                    </a>
                </div>
            `;
        } else if (type === 'suggested-file') {
            // Generate file content from template
            const template = this.currentSuggestions?.suggestions?.template;
            const content = template ? ExpertSystem.generateFileContent(template, filename, this.activeRoom) : '';
            
            content.innerHTML = `
                <div class="suggested-file-viewer">
                    <h4>💡 Suggested: ${filename}</h4>
                    <p>Click "Approve All" to generate this file</p>
                    <pre style="background:rgba(0,0,0,0.5);padding:15px;border-radius:6px;overflow-x:auto;font-size:12px;color:#aaa;">${content.substring(0, 500)}...</pre>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="file-placeholder">
                    <h4>📄 File: ${filename}</h4>
                    <p>Click below to view on GitHub</p>
                    <a href="${repoUrl}/blob/main/${filename}" target="_blank" class="view-on-github">
                        View on GitHub →
                    </a>
                </div>
            `;
        }
    },
    
    scrollBookshelf(direction) {
        const shelf = document.getElementById('bookshelf');
        if (shelf) {
            shelf.scrollBy({ left: direction * 200, behavior: 'smooth' });
        }
    },
    
    handleKey(e) {
        if (!this.activeRoom) return;
        
        if (e.key === 'Escape' || e.key === 'Backspace') {
            this.exitRoom();
        }
    }
};

window.RoomSystem = RoomSystem;
