/**
 * Mind Palace Lakehouse — Gist Wall
 * Phase 5: Server room display panels showing live gist feeds
 * 
 * Features:
 * - Scrolling terminal-style display panels
 * - Color-coded by category (logit, snippet, error, debug, kv, keyword, lora, dream)
 * - Click to expand/focus a gist
 * - Auto-scroll with new entries
 * - Links to GitHub gists and MasterLogs files
 */

const GistWall = {
    panels: [],
    gistData: [],
    isOpen: false,
    container: null,
    autoScroll: true,
    pollInterval: null,

    categoryColors: {
        logit: '#00ff00',
        snippet: '#00ccff',
        error: '#ff4444',
        debug: '#ffaa00',
        kv: '#aa66ff',
        keyword: '#66ff66',
        lora: '#ff66aa',
        dream: '#9966ff'
    },

    categoryIcons: {
        logit: '⌨️',
        snippet: '📝',
        error: '⚠️',
        debug: '🔍',
        kv: '🗄️',
        keyword: '🏷️',
        lora: '🧠',
        dream: '🌙'
    },

    async init() {
        console.log('[GistWall] Initializing...');
        this.createContainer();
        await this.loadGistData();
        this.startPolling();
        console.log(`[GistWall] ${this.gistData.length} gists loaded`);
    },

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'gist-wall';
        this.container.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.92); z-index: 1500; display: none;
            font-family: 'Courier New', monospace; overflow: hidden;
        `;
        this.container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:12px 20px;border-bottom:1px solid #333;background:rgba(0,0,0,0.95);">
                <span style="color:#00ff80;font-size:18px;font-weight:bold;">
                    📋 Gist Wall
                </span>
                <div style="display:flex;gap:12px;align-items:center;">
                    <label style="color:#666;font-size:12px;display:flex;align-items:center;gap:4px;cursor:pointer;">
                        <input type="checkbox" id="gist-autoscroll" checked>
                        Auto-scroll
                    </label>
                    <select id="gist-filter" style="background:#111;color:#0f0;border:1px solid #333;
                            border-radius:4px;padding:4px 8px;font-size:12px;font-family:monospace;">
                        <option value="all">All</option>
                        <option value="logit">⌨️ Logit</option>
                        <option value="snippet">📝 Snippets</option>
                        <option value="error">⚠️ Errors</option>
                        <option value="debug">🔍 Debug</option>
                        <option value="kv">🗄️ KV</option>
                        <option value="keyword">🏷️ Keywords</option>
                        <option value="lora">🧠 LoRA</option>
                        <option value="dream">🌙 Dreams</option>
                    </select>
                    <button id="gist-close" style="background:none;border:none;color:#ff4444;
                            font-size:28px;cursor:pointer;padding:0 8px;">&times;</button>
                </div>
            </div>
            <div id="gist-panels" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));
                    gap:12px;padding:16px;height:calc(100% - 60px);overflow-y:auto;">
            </div>
        `;
        document.body.appendChild(this.container);

        document.getElementById('gist-close').onclick = () => this.hide();
        document.getElementById('gist-autoscroll').onchange = (e) => {
            this.autoScroll = e.target.checked;
        };
        document.getElementById('gist-filter').onchange = () => this.render();
    },

    async loadGistData() {
        try {
            // Try to load from MasterLogs gist_wall.json
            const resp = await fetch('https://raw.githubusercontent.com/chrisalunlloyd2-sudo/MasterLogs/main/gists/gist_wall.json');
            if (resp.ok) {
                const data = await resp.json();
                this.gistData = data.gists || [];
                return;
            }
        } catch (e) {
            console.warn('[GistWall] Could not load from MasterLogs, using local data');
        }
        
        // Fallback: use embedded gist data
        this.gistData = this.getDefaultGists();
    },

    getDefaultGists() {
        return [
            {
                id: 'local_1',
                url: 'https://github.com/chrisalunlloyd2-sudo/MasterLogs/blob/main/projects/ViperKernel/README.md',
                filename: 'ViperKernel — Project Log',
                category: 'snippet',
                description: 'Dependencies, runtime errors, debug logs for ViperKernel',
                timestamp: '2026-07-25T23:00:00Z'
            },
            {
                id: 'local_2',
                url: 'https://github.com/chrisalunlloyd2-sudo/MasterLogs/blob/main/projects/MoeGUI/README.md',
                filename: 'MoeGUI — Project Log',
                category: 'snippet',
                description: 'Dependencies, runtime errors, debug logs for MoeGUI',
                timestamp: '2026-07-25T23:00:00Z'
            },
            {
                id: 'local_3',
                url: 'https://github.com/chrisalunlloyd2-sudo/MasterLogs/blob/main/projects/GeneticFoundry/README.md',
                filename: 'GeneticFoundry — Project Log',
                category: 'snippet',
                description: 'Dependencies, runtime errors, debug logs for GeneticFoundry',
                timestamp: '2026-07-25T23:00:00Z'
            },
            {
                id: 'local_4',
                url: 'https://github.com/chrisalunlloyd2-sudo/MasterLogs',
                filename: 'MasterLogs Repository',
                category: 'kv',
                description: 'Centralized system logs, dependency trees, KV snapshots, keyword lists, LoRA updates',
                timestamp: '2026-07-25T23:00:00Z'
            },
            {
                id: 'local_5',
                url: 'https://github.com/chrisalunlloyd2-sudo/mind-palace',
                filename: 'Mind Palace Lakehouse',
                category: 'dream',
                description: 'Multi-level 3D lakehouse with interactive furniture, file cabinets, movable objects',
                timestamp: '2026-07-25T23:00:00Z'
            }
        ];
    },

    render() {
        const panels = document.getElementById('gist-panels');
        if (!panels) return;

        const filter = document.getElementById('gist-filter')?.value || 'all';
        const filtered = filter === 'all' 
            ? this.gistData 
            : this.gistData.filter(g => g.category === filter);

        panels.innerHTML = filtered.map(gist => {
            const color = this.categoryColors[gist.category] || '#0f0';
            const icon = this.categoryIcons[gist.category] || '📄';
            const time = new Date(gist.timestamp).toLocaleString();
            
            return `
                <div class="gist-card" data-url="${gist.url}"
                     style="background:rgba(0,0,0,0.4);border:1px solid ${color}33;
                            border-left:4px solid ${color};border-radius:8px;
                            padding:14px;cursor:pointer;transition:all 0.2s;
                            min-height:100px;display:flex;flex-direction:column;"
                     onmouseover="this.style.background='rgba(0,0,0,0.6)';this.style.borderColor='${color}'"
                     onmouseout="this.style.background='rgba(0,0,0,0.4)';this.style.borderColor='${color}33'">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                        <span style="font-size:13px;color:${color};font-weight:bold;">
                            ${icon} ${gist.filename}
                        </span>
                        <span style="font-size:10px;color:#666;">${time}</span>
                    </div>
                    <div style="color:#aaa;font-size:12px;flex:1;line-height:1.4;">
                        ${gist.description}
                    </div>
                    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                        <span style="background:${color}22;color:${color};font-size:10px;
                                padding:2px 8px;border-radius:10px;border:1px solid ${color}44;">
                            ${gist.category}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        // Click to open gist URL
        panels.querySelectorAll('.gist-card').forEach(card => {
            card.addEventListener('click', () => {
                const url = card.dataset.url;
                if (url) window.open(url, '_blank');
            });
        });

        // Auto-scroll to bottom
        if (this.autoScroll) {
            panels.scrollTop = panels.scrollHeight;
        }
    },

    show() {
        if (!this.container) return;
        this.isOpen = true;
        this.container.style.display = 'block';
        this.render();
    },

    hide() {
        if (!this.container) return;
        this.isOpen = false;
        this.container.style.display = 'none';
    },

    toggle() {
        this.isOpen ? this.hide() : this.show();
    },

    addGist(gist) {
        this.gistData.unshift(gist);
        if (this.isOpen) this.render();
    },

    startPolling() {
        // Poll MasterLogs for new gists every 5 minutes
        this.pollInterval = setInterval(() => {
            this.loadGistData().then(() => {
                if (this.isOpen) this.render();
            });
        }, 300000);
    },

    dispose() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
};

window.GistWall = GistWall;
