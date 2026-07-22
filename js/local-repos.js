/**
 * Local Repository Browser - No PAT Required
 * Uses GitHub's public API to fetch your public repos
 * Falls back to mock data for testing
 */

class LocalRepoBrowser {
    constructor(username = 'chrisalunlloyd2-sudo') {
        this.username = username;
        this.repos = [];
        this.rooms = {}; // repo name → room config
    }

    // Fetch public repos from GitHub API (no auth needed for public repos)
    async fetchRepos() {
        try {
            const response = await fetch(`https://api.github.com/users/${this.username}/repos?per_page=100&sort=updated`);
            if (!response.ok) throw new Error('GitHub API failed');
            
            const data = await response.json();
            this.repos = data.map(repo => ({
                name: repo.name,
                description: repo.description || 'No description',
                language: repo.language || 'Unknown',
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                updated: new Date(repo.updated_at),
                private: repo.private,
                html_url: repo.html_url
            }));
            
            console.log(`📚 Loaded ${this.repos.length} repos from GitHub`);
            this.generateRooms();
            return this.repos;
        } catch (error) {
            console.warn('⚠️ GitHub API failed, using fallback repos:', error);
            this.useFallbackRepos();
            return this.repos;
        }
    }

    // Fallback repos for testing
    useFallbackRepos() {
        this.repos = [
            { name: 'ViperKernel', description: 'Core kernel infrastructure', language: 'Python', stars: 12, updated: new Date() },
            { name: 'MindPalace', description: 'Spatial IDE with 3D navigation', language: 'JavaScript', stars: 8, updated: new Date() },
            { name: 'AegisAgent', description: 'Autonomous agent framework', language: 'TypeScript', stars: 15, updated: new Date() },
            { name: 'LivingASCIIArt', description: 'Live tech dashboard', language: 'HTML', stars: 5, updated: new Date() },
            { name: 'MoeGUI', description: 'Mixture of Experts interface', language: 'Python', stars: 7, updated: new Date() },
        ];
        this.generateRooms();
    }

    // Generate room config for each repo
    generateRooms() {
        this.rooms = {};
        this.repos.forEach((repo, index) => {
            const wing = this.getWingForRepo(repo);
            const position = this.getPositionForIndex(index, wing);
            
            this.rooms[repo.name] = {
                name: repo.name,
                description: repo.description,
                wing: wing,
                doorPosition: position,
                color: this.getColorForLanguage(repo.language),
                bookshelf: this.generateBookshelf(repo)
            };
        });
        console.log('🏛️ Generated rooms:', Object.keys(this.rooms).length);
    }

    getWingForRepo(repo) {
        if (repo.name.includes('Viper') || repo.name.includes('Kernel')) return 'west';
        if (repo.name.includes('AI') || repo.name.includes('Agent') || repo.name.includes('Moe')) return 'east';
        if (repo.name.includes('Test') || repo.name.includes('Exp')) return 'north';
        return 'south'; // Default for new repos
    }

    getPositionForIndex(index, wing) {
        const spacing = 4;
        const offset = (index % 10) * spacing;
        
        if (wing === 'west' || wing === 'north') {
            return { x: -10, z: -offset };
        } else {
            return { x: 10, z: -offset };
        }
    }

    getColorForLanguage(language) {
        const colors = {
            'Python': '#3776ab',
            'JavaScript': '#f7df1e',
            'TypeScript': '#3178c6',
            'HTML': '#e34c26',
            'CSS': '#563d7c',
            'Rust': '#dea584',
            'Go': '#00add8',
            'Java': '#b07219'
        };
        return colors[language] || '#888888';
    }

    // Generate bookshelf with folders and files
    generateBookshelf(repo) {
        return {
            folders: [
                { name: 'src', type: 'folder', files: ['main.py', 'utils.py', 'config.py'] },
                { name: 'tests', type: 'folder', files: ['test_main.py', 'test_utils.py'] },
                { name: 'docs', type: 'folder', files: ['README.md', 'API.md'] },
                { name: 'research', type: 'folder', files: ['notes.txt', 'hypotheses.md'] }
            ],
            surfaceFiles: [
                { name: 'README.md', content: `# ${repo.name}\n\n${repo.description}` },
                { name: 'LICENSE', content: 'MIT License' },
                { name: '.gitignore', content: 'node_modules/\n*.pyc\n.env' }
            ]
        };
    }

    // Add a new research room (not tied to GitHub repo)
    addResearchRoom(name, description = 'Research notes') {
        const roomKey = `research-${name.toLowerCase().replace(/\s+/g, '-')}`;
        
        this.rooms[roomKey] = {
            name: name,
            description: description,
            wing: 'south',
            doorPosition: { x: 10, z: -(Object.keys(this.rooms).length * 4) },
            color: '#9b59b6', // Purple for research
            isResearch: true,
            bookshelf: {
                folders: [
                    { name: 'Notes', type: 'folder', files: ['idea-1.md', 'idea-2.md'] },
                    { name: 'Papers', type: 'folder', files: ['paper-1.pdf', 'paper-2.pdf'] },
                    { name: 'Sketches', type: 'folder', files: ['sketch-1.png', 'sketch-2.png'] }
                ],
                surfaceFiles: [
                    { name: 'OVERVIEW.md', content: `# ${name}\n\n${description}` },
                    { name: 'TODO.md', content: '- [ ] Research task 1\n- [ ] Research task 2' }
                ]
            }
        };
        
        console.log(`📝 Added research room: ${roomKey}`);
        return roomKey;
    }

    getRoom(roomName) {
        return this.rooms[roomName];
    }

    getAllRooms() {
        return Object.values(this.rooms);
    }
}

// Global instance
window.localRepoBrowser = new LocalRepoBrowser();
