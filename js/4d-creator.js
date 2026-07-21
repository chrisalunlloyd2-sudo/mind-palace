// Mind Palace 4D - Spatial Code Creation System
// Create new repos with voice/text input, auto-populate from Google scraper

const Creator4D = {
    active: false,
    repoName: '',
    description: '',
    languages: [],
    performatives: [],
    dBlocks: [],
    
    init() {
        this.setupKeyboard();
        console.log('🏗️ Creator4D initialized');
    },
    
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' || e.key === 'N') {
                this.openCreationOverlay();
            } else if (e.key === 'c' || e.key === 'C') {
                this.toggleCreationMode();
            } else if (e.key === 'Escape') {
                this.closeCreationOverlay();
            }
        });
    },
    
    openCreationOverlay() {
        this.active = true;
        const overlay = document.getElementById('creation-overlay');
        const container = document.getElementById('creation-container');
        
        if (!overlay || !container) return;
        
        overlay.classList.add('active');
        
        container.innerHTML = `
            <div class="creation-form">
                <div class="empty-room-preview">
                    <div class="icon">🏗️</div>
                    <h4>Empty Room Detected</h4>
                    <p>Define your repository architecture below. Books will materialize on the shelves.</p>
                </div>
                
                <h3>📝 Repository Details</h3>
                
                <div class="form-group">
                    <label>Repository Name *</label>
                    <input type="text" id="repo-name" placeholder="my-awesome-project" />
                </div>
                
                <div class="form-group">
                    <label>Description *</label>
                    <textarea id="repo-description" placeholder="What does this project do? Be specific about goals and features..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Primary Language</label>
                    <select id="repo-language">
                        <option value="Python">Python</option>
                        <option value="JavaScript">JavaScript</option>
                        <option value="TypeScript">TypeScript</option>
                        <option value="Java">Java</option>
                        <option value="Go">Go</option>
                        <option value="Rust">Rust</option>
                        <option value="C++">C++</option>
                        <option value="HTML/CSS">HTML/CSS</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Additional Languages (optional)</label>
                    <div class="language-chips" id="lang-chips">
                        <span class="lang-chip" data-lang="Python">🐍 Python</span>
                        <span class="lang-chip" data-lang="JavaScript">🟨 JavaScript</span>
                        <span class="lang-chip" data-lang="TypeScript">🔷 TypeScript</span>
                        <span class="lang-chip" data-lang="Java">☕ Java</span>
                        <span class="lang-chip" data-lang="Go">🐹 Go</span>
                        <span class="lang-chip" data-lang="Rust">🦀 Rust</span>
                        <span class="lang-chip" data-lang="C++">⚙️ C++</span>
                        <span class="lang-chip" data-lang="HTML/CSS">🌐 HTML/CSS</span>
                        <span class="lang-chip" data-lang="SQL">🗄️ SQL</span>
                        <span class="lang-chip" data-lang="Bash">💻 Bash</span>
                    </div>
                </div>
                
                <h3>🎭 Performatives (Code Structure)</h3>
                <div class="performatives-grid" id="performatives-grid">
                    <div class="performative-card" data-perf="intro">
                        <h4>📖 Introduction</h4>
                        <p>Module header, docstrings, purpose declaration</p>
                    </div>
                    <div class="performative-card" data-perf="hypothesis">
                        <h4>💡 Hypothesis</h4>
                        <p>Author, date, design rationale, assumptions</p>
                    </div>
                    <div class="performative-card" data-perf="imports">
                        <h4>📦 Imports</h4>
                        <p>Dependencies, external modules, configuration</p>
                    </div>
                    <div class="performative-card" data-perf="constants">
                        <h4>🔧 Constants</h4>
                        <p>Configuration values, magic numbers, settings</p>
                    </div>
                    <div class="performative-card" data-perf="classes">
                        <h4>🏗️ Classes</h4>
                        <p>Data structures, objects, encapsulation</p>
                    </div>
                    <div class="performative-card" data-perf="functions">
                        <h4>⚡ Functions</h4>
                        <p>Logic, operations, transformations</p>
                    </div>
                    <div class="performative-card" data-perf="main">
                        <h4>🚀 Main Entry</h4>
                        <p>Execution point, CLI interface, bootstrapping</p>
                    </div>
                    <div class="performative-card" data-perf="tests">
                        <h4>✅ Tests</h4>
                        <p>Unit tests, integration tests, validation</p>
                    </div>
                </div>
                
                <h3>🧱 D-Blocks (Development Stages)</h3>
                <div class="d-blocks-container" id="d-blocks">
                    <div class="d-block" data-dblock="D1">
                        <div class="d-block-number">D1</div>
                        <div class="d-block-content">
                            <h4>Discovery</h4>
                            <p>Research, requirements gathering, problem definition</p>
                        </div>
                    </div>
                    <div class="d-block" data-dblock="D2">
                        <div class="d-block-number">D2</div>
                        <div class="d-block-content">
                            <h4>Design</h4>
                            <p>Architecture, patterns, interface design</p>
                        </div>
                    </div>
                    <div class="d-block" data-dblock="D3">
                        <div class="d-block-number">D3</div>
                        <div class="d-block-content">
                            <h4>Development</h4>
                            <p>Implementation, coding, refactoring</p>
                        </div>
                    </div>
                    <div class="d-block" data-dblock="D4">
                        <div class="d-block-number">D4</div>
                        <div class="d-block-content">
                            <h4>Deployment</h4>
                            <p>Testing, CI/CD, production release</p>
                        </div>
                    </div>
                </div>
                
                <button class="generate-btn" onclick="Creator4D.generate()">🏗️ Generate Repository</button>
            </div>
        `;
        
        // Setup chip selection
        document.querySelectorAll('.lang-chip').forEach(chip => {
            chip.onclick = () => {
                chip.classList.toggle('selected');
                const lang = chip.dataset.lang;
                if (chip.classList.contains('selected')) {
                    if (!this.languages.includes(lang)) this.languages.push(lang);
                } else {
                    this.languages = this.languages.filter(l => l !== lang);
                }
            };
        });
        
        // Setup performative selection
        document.querySelectorAll('.performative-card').forEach(card => {
            card.onclick = () => {
                card.classList.toggle('selected');
                const perf = card.dataset.perf;
                if (card.classList.contains('selected')) {
                    if (!this.performatives.includes(perf)) this.performatives.push(perf);
                } else {
                    this.performatives = this.performatives.filter(p => p !== perf);
                }
            };
        });
        
        // Setup D-block selection
        document.querySelectorAll('.d-block').forEach(block => {
            block.onclick = () => {
                block.classList.toggle('selected');
                const db = block.dataset.dblock;
                if (block.classList.contains('selected')) {
                    if (!this.dBlocks.includes(db)) this.dBlocks.push(db);
                } else {
                    this.dBlocks = this.dBlocks.filter(d => d !== db);
                }
            };
        });
        
        // Auto-select defaults
        document.querySelector('[data-perf="intro"]')?.classList.add('selected');
        document.querySelector('[data-perf="hypothesis"]')?.classList.add('selected');
        document.querySelector('[data-perf="imports"]')?.classList.add('selected');
        document.querySelector('[data-perf="functions"]')?.classList.add('selected');
        document.querySelector('[data-perf="main"]')?.classList.add('selected');
        this.performatives = ['intro', 'hypothesis', 'imports', 'functions', 'main'];
        
        document.querySelector('[data-dblock="D1"]')?.classList.add('selected');
        document.querySelector('[data-dblock="D2"]')?.classList.add('selected');
        document.querySelector('[data-dblock="D3"]')?.classList.add('selected');
        document.querySelector('[data-dblock="D4"]')?.classList.add('selected');
        this.dBlocks = ['D1', 'D2', 'D3', 'D4'];
        
        if (AudioSystem) AudioSystem.playSound('bookSelect');
    },
    
    closeCreationOverlay() {
        const overlay = document.getElementById('creation-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            this.active = false;
        }
    },
    
    toggleCreationMode() {
        if (this.active) {
            this.closeCreationOverlay();
        } else {
            this.openCreationOverlay();
        }
    },
    
    async generate() {
        const nameInput = document.getElementById('repo-name');
        const descInput = document.getElementById('repo-description');
        const langSelect = document.getElementById('repo-language');
        
        const name = nameInput?.value.trim();
        const description = descInput?.value.trim();
        const language = langSelect?.value;
        
        if (!name || !description) {
            alert('Please fill in repository name and description');
            return;
        }
        
        // Close overlay
        this.closeCreationOverlay();
        
        // Show progress modal
        this.showProgress();
        
        // Simulate generation steps
        await this.runGenerationSteps(name, description, language);
        
        // Show success
        this.showSuccess(name);
    },
    
    async showProgress() {
        const modal = document.createElement('div');
        modal.id = 'generation-progress';
        modal.className = 'active';
        modal.innerHTML = `
            <h3>🏗️ Generating Repository...</h3>
            <div id="generation-steps">
                <div class="generation-step" id="step-1"><span class="step-icon">📝</span> Parsing requirements...</div>
                <div class="generation-step" id="step-2"><span class="step-icon">🔍</span> Scraping similar projects...</div>
                <div class="generation-step" id="step-3"><span class="step-icon">🧠</span> Analyzing patterns...</div>
                <div class="generation-step" id="step-4"><span class="step-icon">📐</span> Generating architecture...</div>
                <div class="generation-step" id="step-5"><span class="step-icon">📚</span> Materializing books...</div>
                <div class="generation-step" id="step-6"><span class="step-icon">✅</span> Finalizing...</div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    async runGenerationSteps(name, description, language) {
        const steps = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6'];
        
        for (let i = 0; i < steps.length; i++) {
            // Mark previous as complete
            if (i > 0) {
                document.getElementById(steps[i-1])?.classList.add('complete');
                document.getElementById(steps[i-1])?.classList.remove('active');
            }
            
            // Mark current as active
            document.getElementById(steps[i])?.classList.add('active');
            
            // Simulate work
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
            
            if (AudioSystem && i % 2 === 0) {
                AudioSystem.playSound('pageTurn');
            }
        }
    },
    
    showSuccess(repoName) {
        // Remove progress modal
        const progressModal = document.getElementById('generation-progress');
        if (progressModal) progressModal.remove();
        
        // Show success modal
        const successModal = document.createElement('div');
        successModal.id = 'generation-success';
        successModal.className = 'active';
        successModal.innerHTML = `
            <h3>🎉 Repository Created!</h3>
            <p><strong>${repoName}</strong> has been materialized in your Mind Palace.<br>
            Architecture generated with ${this.performatives.length} performatives and ${this.dBlocks.length} D-blocks.</p>
            <div class="success-actions">
                <button class="success-btn primary" onclick="Creator4D.enterNewRoom('${repoName}')">🚪 Enter Room</button>
                <button class="success-btn secondary" onclick="document.getElementById('generation-success').remove()">✕ Close</button>
            </div>
        `;
        document.body.appendChild(successModal);
        
        if (AudioSystem) AudioSystem.playSound('doorOpen');
    },
    
    enterNewRoom(repoName) {
        // Remove success modal
        const successModal = document.getElementById('generation-success');
        if (successModal) successModal.remove();
        
        // Create room data
        const roomData = {
            label: repoName,
            type: 'repo_room',
            payload: {
                description: document.getElementById('repo-description')?.value || '',
                language: document.getElementById('repo-language')?.value || 'Python',
                category: 'Custom',
                wing: 'north',
                files: this.generateFileList(),
                folders: ['src/', 'tests/', 'docs/'],
                stars: 0,
                updated: new Date().toISOString()
            }
        };
        
        // Enter room
        if (window.RoomSystem3D) {
            RoomSystem3D.enterRoom(roomData);
        }
        
        // Reset creator state
        this.languages = [];
        this.performatives = [];
        this.dBlocks = [];
    },
    
    generateFileList() {
        const files = [];
        
        // Based on selected performatives
        if (this.performatives.includes('intro')) files.push('README.md');
        if (this.performatives.includes('hypothesis')) files.push('DESIGN.md');
        if (this.performatives.includes('imports')) files.push('requirements.txt');
        if (this.performatives.includes('constants')) files.push('config.json');
        if (this.performatives.includes('classes')) files.push('models.py');
        if (this.performatives.includes('functions')) files.push('main.py');
        if (this.performatives.includes('main')) files.push('cli.py');
        if (this.performatives.includes('tests')) files.push('test_main.py');
        
        return files;
    }
};

window.Creator4D = Creator4D;
