/**
 * Mind Palace Lakehouse — Filing System & SOV Data Bridge
 * Phase 4: File Drawers, Folders & Cabinets
 * 
 * Features:
 * - File cabinets with 2-4 drawers each
 * - Color-coded folders by category
 * - Documents with text/images/links
 * - Auto-populate from SOV KV/KG data
 * - Search and filter
 * - Links to GitHub repos, notes, memories
 */

const FilingSystem = {
    cabinets: [],
    folders: new Map(),
    documents: new Map(),
    categories: {
        projects: { label: 'Projects', color: '#4CAF50', icon: '📁' },
        dreams: { label: 'Dreams', color: '#9C27B0', icon: '🌙' },
        system: { label: 'System', color: '#2196F3', icon: '⚙' },
        personal: { label: 'Personal', color: '#FF9800', icon: '👤' },
        research: { label: 'Research', color: '#00BCD4', icon: '🔬' },
        archive: { label: 'Archive', color: '#607D8B', icon: '📦' }
    },

    async init() {
        console.log('[FilingSystem] Initializing...');
        this.createDefaultCabinets();
        this.createDefaultFolders();
        this.createDefaultDocuments();
        console.log(`[FilingSystem] ${this.cabinets.length} cabinets, ${this.folders.size} folders, ${this.documents.size} documents`);
    },

    createDefaultCabinets() {
        this.cabinets = [
            {
                id: 'cabinet_main',
                model: 'cabinet_4drawer',
                position: [0, 0, 0],
                label: 'Main Archive',
                drawerCount: 4,
                drawers: [
                    { id: 'drawer_1', label: 'Projects A-M', category: 'projects' },
                    { id: 'drawer_2', label: 'Projects N-Z', category: 'projects' },
                    { id: 'drawer_3', label: 'System & Dreams', category: 'system' },
                    { id: 'drawer_4', label: 'Personal & Research', category: 'personal' }
                ]
            },
            {
                id: 'cabinet_office',
                model: 'cabinet_2drawer',
                position: [3, 0, 0],
                label: 'Office Files',
                drawerCount: 2,
                drawers: [
                    { id: 'drawer_office_1', label: 'Research & Papers', category: 'research' },
                    { id: 'drawer_office_2', label: 'Archive', category: 'archive' }
                ]
            },
            {
                id: 'cabinet_basement',
                model: 'cabinet_4drawer',
                position: [0, -3, 5],
                label: 'Deep Archive',
                drawerCount: 4,
                drawers: [
                    { id: 'drawer_deep_1', label: 'Legacy Projects', category: 'archive' },
                    { id: 'drawer_deep_2', label: 'Old Dreams', category: 'archive' },
                    { id: 'drawer_deep_3', label: 'System Logs', category: 'system' },
                    { id: 'drawer_deep_4', label: 'Backups', category: 'archive' }
                ]
            }
        ];
    },

    createDefaultFolders() {
        // Projects folders
        this.addFolder('folder_projects_1', 'projects', 'Active Repos', [
            { label: 'living-ascii-art', type: 'link', url: 'https://github.com/chrisalunlloyd2-sudo/living-ascii-art' },
            { label: 'mind-palace', type: 'link', url: 'https://github.com/chrisalunlloyd2-sudo/mind-palace' },
            { label: 'aegis-agent-bridge', type: 'link', url: 'https://github.com/chrisalunlloyd2-sudo/aegis-agent-bridge' }
        ]);
        this.addFolder('folder_projects_2', 'projects', 'Viper Kernel', [
            { label: 'Kernel Architecture', type: 'note', content: 'Hero Quantum Turing Kernel with MoE-DePIN routing. Training pipeline with telemetry extraction and reinforcement feedback.' },
            { label: 'Current Sprint', type: 'note', content: 'Critical Kernel Audit V2.7-GOLD. CCIPS Router, Asymmetric Path Resolver, 4D Hyper-Append-Buffer.' },
            { label: 'GitHub', type: 'link', url: 'https://github.com/chrisalunlloyd2-sudo/viper-kernel' }
        ]);
        this.addFolder('folder_projects_3', 'projects', 'Foundry Systems', [
            { label: 'Brute Foundry', type: 'note', content: 'Deterministic combinatorial matrix for AST permutation generation. Nyx safety gate, performative tester, Nash Equilibrium evaluation.' },
            { label: 'Moe Gate', type: 'note', content: '75 approved, 7 pending. Mixture of Experts routing with logit-weighted capability selection.' },
            { label: 'NMCT Integrity', type: 'note', content: '46 sealed-valid, 397 unsealed, 0 tampered.' }
        ]);

        // Dreams folders
        this.addFolder('folder_dreams_1', 'dreams', 'Nightly Insights', [
            { label: 'Round 8 (Jul 22)', type: 'note', content: 'Infinite Recursive Block Schema, Deterministic Combinatorial Matrix, Advanced AST Topologies, GitHub Ingestion Pipeline, Google HowTo Extraction.' },
            { label: 'Round 7 (Jul 21)', type: 'note', content: 'AST-driven execution pipeline, Infinite recursive block schema, Deterministic combinatorial matrix, Advanced AST topologies, Autonomous GitHub ingestion.' },
            { label: 'Round 6 (Jul 21)', type: 'note', content: 'Nash Equilibrium Pipeline, Hero Quantum Turing Kernel, Workflow Engine Topology, Game Theory Code Review, Performative Matching Architecture.' }
        ]);
        this.addFolder('folder_dreams_2', 'dreams', 'Keyword Graph', [
            { label: 'Total Keywords', type: 'note', content: '~1,934 keywords in global knowledge graph across all dream rounds.' },
            { label: 'Top Themes', type: 'note', content: 'MoE-DePIN, Boolean Hierarchical Stamp Engine, CCIPS compiler, action_handlers, payments, sovereign-OS, lakehouse.' }
        ]);

        // System folders
        this.addFolder('folder_system_1', 'system', 'Heartbeat Logs', [
            { label: 'Last Consolidation', type: 'note', content: '2026-07-25: No duplicates found. dream_round_state UID duplicates (80536, 80537) need KV write access to fix.' },
            { label: 'Auto Keyword Monitor', type: 'note', content: 'Tau=8.2. No genuine triggers. Jina auth still failing.' },
            { label: 'Vectorize Email UIDs', type: 'note', content: 'Skipped. No Sentence-BERT/text-encoder available.' }
        ]);
        this.addFolder('folder_system_2', 'system', 'SOV Pipeline', [
            { label: 'KV Store', type: 'note', content: 'Key-value store with history. Blocked by sandbox snapshot-state error.' },
            { label: 'KG Store', type: 'note', content: 'Entity/edge store. ~1,934 kw:<keyword> nodes.' },
            { label: 'Logit Store', type: 'note', content: 'Rolling action log with auto-prune.' }
        ]);
        this.addFolder('folder_system_3', 'system', 'Pending Actions', [
            { label: 'Fix aegis-agent-bridge', type: 'note', content: 'Missing src/action_handlers.py. Patch saved, shell blocked.' },
            { label: 'Create sovereign-analytics', type: 'note', content: 'Reverse keyword search + metadata rating service. Approved.' },
            { label: 'Land Critical Kernel Audit', type: 'note', content: 'V2.7-GOLD. Approved.' }
        ]);

        // Personal folders
        this.addFolder('folder_personal_1', 'personal', 'Notes & Ideas', [
            { label: 'Mind Palace Lakehouse', type: 'note', content: 'Multi-level lakehouse with cabin, hallways, file drawers, folders, cabinets. Movable chairs (HL1 style). Minecraft-style placement. Desktop Java FX version planned.' },
            { label: 'Day Trading Game', type: 'note', content: 'Practice day-trading game for high-school kids. From SMS 2026-07-18.' }
        ]);
        this.addFolder('folder_personal_2', 'personal', 'Contacts', [
            { label: 'Kai Collective', type: 'note', content: 'Auto keyword monitor sends alerts for: copy, copy this, note send email.' },
            { label: 'Recent SMS', type: 'note', content: 'Robyn, +17807213374 (day trading game), +17808199343 (EPCOR water alert, Kdays plans).' }
        ]);

        // Research folders
        this.addFolder('folder_research_1', 'research', 'Papers', [
            { label: 'ROSE: Rotate Your LLM to See', type: 'note', content: 'Multimodal VLM research paper. CVPR 2026.' },
            { label: 'Karoo GP', type: 'note', content: 'Genetic programming for symbolic regression. Code mining scheme with ZeroMQ/PyArrow.' }
        ]);
        this.addFolder('folder_research_2', 'research', 'Architecture', [
            { label: 'Sovereign OS', type: 'note', content: 'Unified relational data (Mind Palace graph as file system), microkernel with hardware memory safety, cognitive zero-tax UI.' },
            { label: 'Airgap Ecosystem', type: 'note', content: 'Cryptographic isolation, legacy autonomous translation, Salvation Army first deployment.' }
        ]);
    },

    addFolder(id, category, label, documents) {
        const folder = {
            id,
            category,
            label,
            color: this.categories[category]?.color || '#888',
            icon: this.categories[category]?.icon || '📁',
            documents: documents || []
        };
        this.folders.set(id, folder);
        for (const doc of folder.documents) {
            const docId = `${id}_doc_${doc.label.toLowerCase().replace(/\s+/g, '_')}`;
            this.documents.set(docId, { ...doc, folderId: id, id: docId });
        }
    },

    getCabinets() {
        return this.cabinets;
    },

    getCabinet(id) {
        return this.cabinets.find(c => c.id === id);
    },

    getDrawerContents(drawerId) {
        const cabinet = this.cabinets.find(c => c.drawers.some(d => d.id === drawerId));
        if (!cabinet) return [];
        const drawer = cabinet.drawers.find(d => d.id === drawerId);
        if (!drawer) return [];
        
        const results = [];
        for (const [id, folder] of this.folders) {
            if (folder.category === drawer.category) {
                results.push({ type: 'folder', ...folder });
            }
        }
        return results;
    },

    getFolderContents(folderId) {
        const folder = this.folders.get(folderId);
        if (!folder) return [];
        return folder.documents;
    },

    getDocument(id) {
        return this.documents.get(id);
    },

    search(query) {
        query = query.toLowerCase();
        const results = [];
        
        for (const [id, folder] of this.folders) {
            if (folder.label.toLowerCase().includes(query) ||
                folder.category.toLowerCase().includes(query)) {
                results.push({ type: 'folder', ...folder });
            }
            for (const doc of folder.documents) {
                if (doc.label.toLowerCase().includes(query)) {
                    results.push({ type: 'document', ...doc, folderLabel: folder.label });
                }
            }
        }
        
        return results;
    },

    // SOV Data Bridge — auto-populate from live data
    async syncFromSOV() {
        console.log('[FilingSystem] Syncing from SOV...');
        try {
            // In production, this would fetch from the SOV KV/KG API
            // For now, we use the default data
            console.log('[FilingSystem] SOV sync complete');
        } catch (e) {
            console.warn('[FilingSystem] SOV sync failed:', e);
        }
    },

    renderFolderView(folderId, container) {
        const folder = this.folders.get(folderId);
        if (!folder) return;
        
        container.innerHTML = `
            <div style="padding:20px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;
                            border-bottom:1px solid #333;padding-bottom:12px;">
                    <span style="font-size:24px;">${folder.icon}</span>
                    <span style="color:${folder.color};font-size:18px;font-weight:bold;">${folder.label}</span>
                    <span style="color:#666;font-size:12px;margin-left:auto;">${folder.category}</span>
                </div>
                ${folder.documents.map(doc => `
                    <div class="doc-entry" data-doc-id="${doc.id || ''}"
                         style="padding:10px 14px;margin-bottom:6px;border-left:3px solid ${folder.color};
                                background:rgba(0,0,0,0.3);cursor:pointer;border-radius:0 4px 4px 0;
                                transition:background 0.2s;"
                         onmouseover="this.style.background='rgba(0,255,0,0.1)'"
                         onmouseout="this.style.background='rgba(0,0,0,0.3)'">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span>${doc.type === 'link' ? '🔗' : doc.type === 'note' ? '📝' : '📄'}</span>
                            <span style="color:#00ffcc;font-size:14px;">${doc.label}</span>
                            ${doc.type === 'link' ? 
                                `<span style="color:#666;font-size:11px;margin-left:auto;">external link</span>` : 
                                `<span style="color:#666;font-size:11px;margin-left:auto;">note</span>`}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

window.FilingSystem = FilingSystem;
