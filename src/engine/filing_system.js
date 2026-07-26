/**
 * Mind Palace Lakehouse — Filing System
 * File cabinets with searchable documents
 */

const FilingSystem = {
    cabinets: [],
    documents: [],

    async init() {
        console.log('[FilingSystem] Initializing...');
        this.createDefaultCabinets();
        this.createDefaultDocuments();
        console.log(`[FilingSystem] Created ${this.cabinets.length} cabinets, ${this.documents.length} documents`);
        return true;
    },

    createDefaultCabinets() {
        this.cabinets = [
            { id: 'cabinet_01', position: [1.5, 0, 1.5], label: 'Project Files', color: '#4488ff' },
            { id: 'cabinet_02', position: [2.5, 0, 1.5], label: 'Research', color: '#44ff88' },
            { id: 'cabinet_03', position: [3.5, 0, 1.5], label: 'Personal', color: '#ff8844' }
        ];
    },

    createDefaultDocuments() {
        this.documents = [
            { id: 'doc_01', cabinetId: 'cabinet_01', title: 'Project Alpha Spec', content: 'Project Alpha is a multi-agent system for autonomous code generation...' },
            { id: 'doc_02', cabinetId: 'cabinet_01', title: 'Architecture Overview', content: 'The system uses a MoE architecture with 8 expert models...' },
            { id: 'doc_03', cabinetId: 'cabinet_02', title: 'Research Notes - Q2', content: 'Key findings from Q2 research on LLM inference optimization...' },
            { id: 'doc_04', cabinetId: 'cabinet_02', title: 'Paper Summaries', content: 'Summaries of recent papers on attention mechanisms...' },
            { id: 'doc_05', cabinetId: 'cabinet_03', title: 'Journal Entry', content: 'Today I explored the lakehouse and found the filing system...' }
        ];
    },

    getCabinets() {
        return this.cabinets;
    },

    getDocuments(cabinetId) {
        return this.documents.filter(d => d.cabinetId === cabinetId);
    },

    getDocument(docId) {
        return this.documents.find(d => d.id === docId) || null;
    },

    searchDocuments(query) {
        const q = query.toLowerCase();
        return this.documents.filter(d => 
            d.title.toLowerCase().includes(q) || 
            d.content.toLowerCase().includes(q)
        );
    },

    addDocument(cabinetId, title, content) {
        const doc = {
            id: 'doc_' + Date.now(),
            cabinetId: cabinetId,
            title: title,
            content: content
        };
        this.documents.push(doc);
        return doc;
    }
};

window.FilingSystem = FilingSystem;
