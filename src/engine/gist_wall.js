/**
 * Mind Palace Lakehouse — Gist Wall
 * Displays gist/note content on a virtual wall
 */

const GistWall = {
    isOpen: false,
    container: null,
    contentEl: null,
    gists: [],

    async init() {
        console.log('[GistWall] Initializing...');
        this.createUI();
        await this.loadGistData();
        console.log(`[GistWall] Loaded ${this.gists.length} gists`);
        return true;
    },

    createUI() {
        this.container = document.createElement('div');
        this.container.id = 'gist-wall';
        this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:500;display:none;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;';
        
        const header = document.createElement('div');
        header.style.cssText = 'color:#00ff80;font-size:24px;margin-bottom:20px;text-shadow:0 0 10px #00ff80;';
        header.textContent = '📋 Gist Wall';
        this.container.appendChild(header);

        this.contentEl = document.createElement('div');
        this.contentEl.style.cssText = 'color:#ccc;font-size:14px;max-width:600px;width:90%;max-height:70vh;overflow-y:auto;line-height:1.8;padding:20px;background:rgba(0,0,0,0.5);border:1px solid #333;border-radius:8px;';
        this.container.appendChild(this.contentEl);

        const closeHint = document.createElement('div');
        closeHint.style.cssText = 'color:#666;font-size:12px;margin-top:20px;';
        closeHint.textContent = 'Press ESC to close';
        this.container.appendChild(closeHint);

        document.body.appendChild(this.container);
    },

    async loadGistData() {
        // Try to fetch from MasterLogs, fall back to defaults
        try {
            const response = await fetch('data/gists.json');
            if (response.ok) {
                const data = await response.json();
                this.gists = data.gists || [];
                return;
            }
        } catch (e) {
            // Silent fallback
        }
        this.gists = this.getDefaultGists();
    },

    getDefaultGists() {
        return [
            { title: 'Welcome', content: 'Welcome to the Mind Palace Lakehouse. Explore rooms, interact with objects, and discover the filing system.' },
            { title: 'Controls', content: 'WASD to move • Mouse to look • E to interact • F to push • I for inventory • M for minimap • G for gist wall' },
            { title: 'About', content: 'The Lakehouse is a multi-level environment with living spaces, offices, a library, basement, and attic. Each room has interactive furniture and objects.' },
            { title: 'Filing System', content: 'File cabinets contain searchable documents. Approach a cabinet and press E to open and read documents.' }
        ];
    },

    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    },

    show() {
        this.isOpen = true;
        this.container.style.display = 'flex';
        this.renderContent();
    },

    hide() {
        this.isOpen = false;
        this.container.style.display = 'none';
    },

    renderContent() {
        if (!this.contentEl) return;
        let html = '';
        for (const gist of this.gists) {
            html += `<div style="margin-bottom:16px;padding:12px;background:rgba(0,255,128,0.05);border-left:2px solid #00ff80;border-radius:4px;">`;
            html += `<div style="color:#00ff80;font-size:16px;margin-bottom:6px;">${gist.title}</div>`;
            html += `<div style="color:#aaa;font-size:13px;line-height:1.6;">${gist.content}</div>`;
            html += `</div>`;
        }
        this.contentEl.innerHTML = html;
    },

    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
};

window.GistWall = GistWall;
