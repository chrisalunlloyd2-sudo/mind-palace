// Mind Palace Expert System - Phase 2
// Auto-suggests file architecture based on repo goals and patterns

const ExpertSystem = {
    // Goal → suggested file structure
    patterns: {
        'conversational': {
            name: 'Conversational AI',
            keywords: ['chat', 'conversation', 'dialog', 'assistant', 'bot'],
            files: [
                { name: 'chat_interface.py', type: 'file', desc: 'User chat UI component' },
                { name: 'server.py', type: 'file', desc: 'Main server process' },
                { name: 'kernel.py', type: 'file', desc: 'Core inference engine' },
                { name: 'memory.py', type: 'file', desc: 'Conversation history & context' },
                { name: 'autocreate.py', type: 'file', desc: 'Dynamic response generation' },
                { name: 'web_host.py', type: 'file', desc: 'HTTP server & routing' },
                { name: 'inference.py', type: 'file', desc: 'Model inference pipeline' },
                { name: 'config.json', type: 'file', desc: 'System configuration' },
            ],
            folders: ['models/', 'data/', 'logs/', 'tests/']
        },
        'game': {
            name: 'Game Engine',
            keywords: ['game', 'play', 'player', 'score', 'level', 'sprite'],
            files: [
                { name: 'main.py', type: 'file', desc: 'Game loop entry point' },
                { name: 'engine.py', type: 'file', desc: 'Core game engine' },
                { name: 'renderer.py', type: 'file', desc: 'Graphics rendering' },
                { name: 'physics.py', type: 'file', desc: 'Collision & movement' },
                { name: 'assets.py', type: 'file', desc: 'Asset loader' },
                { name: 'input.py', type: 'file', desc: 'Player input handling' },
                { name: 'audio.py', type: 'file', desc: 'Sound effects & music' },
            ],
            folders: ['assets/', 'levels/', 'sprites/', 'sounds/']
        },
        'api': {
            name: 'API Service',
            keywords: ['api', 'endpoint', 'route', 'request', 'response', 'rest'],
            files: [
                { name: 'app.py', type: 'file', desc: 'Flask/FastAPI application' },
                { name: 'routes.py', type: 'file', desc: 'API route definitions' },
                { name: 'models.py', type: 'file', desc: 'Data models' },
                { name: 'database.py', type: 'file', desc: 'DB connection & queries' },
                { name: 'auth.py', type: 'file', desc: 'Authentication middleware' },
                { name: 'utils.py', type: 'file', desc: 'Helper functions' },
                { name: 'config.py', type: 'file', desc: 'Environment configuration' },
            ],
            folders: ['endpoints/', 'middleware/', 'schemas/', 'tests/']
        },
        'scraper': {
            name: 'Web Scraper',
            keywords: ['scrape', 'crawl', 'fetch', 'extract', 'parse', 'spider'],
            files: [
                { name: 'scraper.py', type: 'file', desc: 'Main scraping logic' },
                { name: 'parser.py', type: 'file', desc: 'HTML/XML parser' },
                { name: 'storage.py', type: 'file', desc: 'Data persistence' },
                { name: 'scheduler.py', type: 'file', desc: 'Crawl scheduling' },
                { name: 'proxy.py', type: 'file', desc: 'Proxy rotation' },
                { name: 'export.py', type: 'file', desc: 'Data export utilities' },
            ],
            folders: ['data/', 'cache/', 'proxies/', 'exports/']
        },
        'ml': {
            name: 'ML Pipeline',
            keywords: ['train', 'model', 'learn', 'predict', 'neural', 'tensor'],
            files: [
                { name: 'train.py', type: 'file', desc: 'Training pipeline' },
                { name: 'model.py', type: 'file', desc: 'Model architecture' },
                { name: 'preprocess.py', type: 'file', desc: 'Data preprocessing' },
                { name: 'evaluate.py', type: 'file', desc: 'Model evaluation' },
                { name: 'inference.py', type: 'file', desc: 'Prediction pipeline' },
                { name: 'utils.py', type: 'file', desc: 'ML utilities' },
            ],
            folders: ['models/', 'data/', 'checkpoints/', 'notebooks/']
        },
        'default': {
            name: 'General Project',
            keywords: [],
            files: [
                { name: 'main.py', type: 'file', desc: 'Main entry point' },
                { name: 'README.md', type: 'file', desc: 'Project documentation' },
                { name: 'requirements.txt', type: 'file', desc: 'Python dependencies' },
                { name: 'config.json', type: 'file', desc: 'Configuration' },
            ],
            folders: ['src/', 'tests/', 'docs/']
        }
    },
    
    // Structure templates (intro → hypothesis → blocks → conclusion)
    structureTemplates: {
        'python': {
            intro: '#!/usr/bin/env python3\n"""Module docstring"""\n\n',
            hypothesis: '# Purpose: [DESCRIPTION]\n# Author: [AUTHOR]\n# Date: [DATE]\n\n',
            blocks: [
                '### BLOCK 1: Imports\n[IMPORTS]\n\n',
                '### BLOCK 2: Constants\n[CONSTANTS]\n\n',
                '### BLOCK 3: Classes\n[CLASSES]\n\n',
                '### BLOCK 4: Functions\n[FUNCTIONS]\n\n',
            ],
            conclusion: '\n### END BLOCKS\n\nif __name__ == "__main__":\n    main()\n'
        },
        'javascript': {
            intro: '// Module: [NAME]\n// Description: [DESCRIPTION]\n\n',
            hypothesis: '// Purpose: [DESCRIPTION]\n// Author: [AUTHOR]\n\n',
            blocks: [
                '/* BLOCK 1: Imports */\n[IMPORTS]\n\n',
                '/* BLOCK 2: Constants */\n[CONSTANTS]\n\n',
                '/* BLOCK 3: Classes */\n[CLASSES]\n\n',
                '/* BLOCK 4: Functions */\n[FUNCTIONS]\n\n',
            ],
            conclusion: '\n/* END BLOCKS */\n\nexport default module;\n'
        },
        'java': {
            intro: '/**\n * Module: [NAME]\n * Description: [DESCRIPTION]\n */\n\n',
            hypothesis: '// Purpose: [DESCRIPTION]\n// Author: [AUTHOR]\n\n',
            blocks: [
                '// BLOCK 1: Imports\n[IMPORTS]\n\n',
                '// BLOCK 2: Constants\n[CONSTANTS]\n\n',
                '// BLOCK 3: Classes\n[CLASSES]\n\n',
                '// BLOCK 4: Methods\n[METHODS]\n\n',
            ],
            conclusion: '\n// END BLOCKS\n}\n'
        }
    },
    
    analyze(repoData) {
        const desc = (repoData.payload?.description || '').toLowerCase();
        const name = (repoData.label || '').toLowerCase();
        const text = `${desc} ${name}`;
        
        // Find best matching pattern
        let bestMatch = this.patterns.default;
        let bestScore = 0;
        
        for (const [key, pattern] of Object.entries(this.patterns)) {
            if (key === 'default') continue;
            
            let score = 0;
            pattern.keywords.forEach(kw => {
                if (text.includes(kw)) score += 2;
                if (name.includes(kw)) score += 1;
            });
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = pattern;
            }
        }
        
        return {
            pattern: bestMatch,
            confidence: bestScore > 0 ? Math.min(bestScore / 10, 1.0) : 0.3,
            suggestions: this.generateSuggestions(bestMatch, repoData)
        };
    },
    
    generateSuggestions(pattern, repoData) {
        const language = repoData.payload?.language || 'Python';
        const langKey = language.toLowerCase().includes('python') ? 'python' :
                       language.toLowerCase().includes('java') ? 'java' : 'javascript';
        
        return {
            files: pattern.files.map(f => ({
                ...f,
                status: 'suggested',
                approved: false
            })),
            folders: pattern.folders.map(f => ({
                name: f,
                status: 'suggested',
                approved: false
            })),
            template: this.structureTemplates[langKey] || this.structureTemplates.python,
            language: language
        };
    },
    
    approveFile(suggestions, filename) {
        const file = suggestions.files.find(f => f.name === filename);
        if (file) {
            file.approved = true;
            file.status = 'approved';
        }
        return suggestions;
    },
    
    approveAll(suggestions) {
        suggestions.files.forEach(f => {
            f.approved = true;
            f.status = 'approved';
        });
        suggestions.folders.forEach(f => {
            f.approved = true;
            f.status = 'approved';
        });
        return suggestions;
    },
    
    generateFileContent(template, filename, repoData) {
        let content = template.intro;
        content = content.replace('[NAME]', filename);
        content = content.replace('[DESCRIPTION]', repoData.payload?.description || 'Module');
        content = content.replace('[AUTHOR]', 'Auto-generated');
        content = content.replace('[DATE]', new Date().toISOString().split('T')[0]);
        
        content += template.hypothesis;
        content = content.replace('[DESCRIPTION]', repoData.payload?.description || 'Module');
        
        template.blocks.forEach(block => {
            content += block.replace('[IMPORTS]', '# import statements here')
                           .replace('[CONSTANTS]', '# constants here')
                           .replace('[CLASSES]', '# classes here')
                           .replace('[FUNCTIONS]', '# functions here')
                           .replace('[METHODS]', '// methods here');
        });
        
        content += template.conclusion;
        return content;
    },
    
    toggle() {
        const panel = document.getElementById('expert-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    renderPanel(analysis, repoData) {
        const panel = document.getElementById('expert-panel');
        const content = document.getElementById('expert-content');
        if (!panel || !content) return;
        
        const { pattern, confidence, suggestions } = analysis;
        
        let html = `
            <div class="expert-match">
                <h4>🎯 ${pattern.name}</h4>
                <div class="expert-confidence">Confidence: ${(confidence * 100).toFixed(0)}%</div>
            </div>
            
            <h4 style="color:#90ee90;margin:15px 0 10px 0;">📁 Suggested Folders</h4>
            <ul class="suggestion-list">
        `;
        
        suggestions.folders.forEach(folder => {
            html += `
                <li class="suggestion-item" data-name="${folder.name}" data-type="folder">
                    <span class="suggestion-icon">📁</span>
                    <div>
                        <span class="suggestion-name">${folder.name}</span>
                        <span class="status-badge status-${folder.status}">${folder.status}</span>
                    </div>
                    <button class="approve-btn" onclick="ExpertSystem.approveFolder('${folder.name}')">✓</button>
                </li>
            `;
        });
        
        html += `</ul><h4 style="color:#90ee90;margin:15px 0 10px 0;">📄 Suggested Files</h4><ul class="suggestion-list">`;
        
        suggestions.files.forEach(file => {
            html += `
                <li class="suggestion-item" data-name="${file.name}" data-type="file">
                    <span class="suggestion-icon">📄</span>
                    <div>
                        <span class="suggestion-name">${file.name}</span>
                        <span class="suggestion-desc">${file.desc}</span>
                        <span class="status-badge status-${file.status}">${file.status}</span>
                    </div>
                    <button class="approve-btn" onclick="ExpertSystem.approveFileByName('${file.name}')">✓</button>
                </li>
            `;
        });
        
        html += `
            </ul>
            <button class="approve-all-btn" onclick="ExpertSystem.approveAllAndGenerate()">✓ Approve All & Generate Files</button>
            
            <div class="structure-preview">
                <h4>📐 File Structure Template</h4>
                <div class="template-block"><strong>INTRO</strong>: Module header & docstring</div>
                <div class="template-block"><strong>HYPOTHESIS</strong>: Purpose & author</div>
                <div class="template-block"><strong>BLOCK 1</strong>: Imports</div>
                <div class="template-block"><strong>BLOCK 2</strong>: Constants</div>
                <div class="template-block"><strong>BLOCK 3</strong>: Classes</div>
                <div class="template-block"><strong>BLOCK 4</strong>: Functions/Methods</div>
                <div class="template-block"><strong>CONCLUSION</strong>: Main entry point</div>
            </div>
        `;
        
        content.innerHTML = html;
        panel.style.display = 'block';
    },
    
    approveFileByName(filename) {
        if (this.currentSuggestions) {
            this.approveFile(this.currentSuggestions.suggestions, filename);
            this.renderPanel(this.currentSuggestions, RoomSystem.activeRoom);
            RoomSystem.renderRoom(RoomSystem.activeRoom);
            AudioSystem.playSound('pageTurn');
        }
    },
    
    approveFolder(folderName) {
        if (this.currentSuggestions) {
            const folder = this.currentSuggestions.suggestions.folders.find(f => f.name === folderName);
            if (folder) {
                folder.approved = true;
                folder.status = 'approved';
            }
            this.renderPanel(this.currentSuggestions, RoomSystem.activeRoom);
            RoomSystem.renderRoom(RoomSystem.activeRoom);
            AudioSystem.playSound('pageTurn');
        }
    },
    
    approveAllAndGenerate() {
        if (this.currentSuggestions) {
            this.approveAll(this.currentSuggestions.suggestions);
            this.renderPanel(this.currentSuggestions, RoomSystem.activeRoom);
            RoomSystem.renderRoom(RoomSystem.activeRoom);
            AudioSystem.playSound('pageTurn');
            
            // Trigger file generation
            this.generateAllFiles(this.currentSuggestions, RoomSystem.activeRoom);
        }
    },
    
    generateAllFiles(suggestions, repoData) {
        const generated = [];
        suggestions.files.forEach(file => {
            if (file.approved) {
                const content = this.generateFileContent(suggestions.template, file.name, repoData);
                generated.push({ name: file.name, content });
            }
        });
        
        // Show generation summary
        const viewer = document.getElementById('file-viewer');
        const content = document.getElementById('file-content');
        const title = document.getElementById('file-title');
        
        if (viewer && content && title) {
            title.textContent = `✅ Generated ${generated.length} Files`;
            viewer.style.display = 'block';
            
            let summary = '<div style="line-height:1.8;">';
            generated.forEach((f, i) => {
                summary += `<div style="padding:10px;margin:10px 0;background:rgba(66,153,225,0.1);border-radius:6px;border-left:3px solid #4299e1;">
                    <strong style="color:#63b3ed;">${i+1}. ${f.name}</strong><br>
                    <small style="color:#888;">${f.content.substring(0, 150)}...</small>
                </div>`;
            });
            summary += '</div>';
            
            summary += `<div style="margin-top:20px;padding:15px;background:rgba(144,238,144,0.1);border-radius:6px;border:2px solid #90ee90;">
                <h4 style="color:#90ee90;margin-bottom:10px;">🎉 Architecture Complete!</h4>
                <p style="color:#ddd;">All ${generated.length} files generated with proper structure.</p>
                <p style="color:#888;font-size:12px;margin-top:10px;">Next: Commit to GitHub or download as ZIP</p>
            </div>`;
            
            content.innerHTML = summary;
        }
    }
};

// Store current suggestions globally for approval methods
ExpertSystem.currentSuggestions = null;

window.ExpertSystem = ExpertSystem;
