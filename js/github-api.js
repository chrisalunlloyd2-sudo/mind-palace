// Mind Palace — GitHub API Integration
// Create repos, commit files, fetch similar projects

const GitHubAPI = {
    token: null,
    username: null,
    initialized: false,
    
    async init() {
        // Try to load token from localStorage
        const stored = localStorage.getItem('github_pat');
        if (stored) {
            this.token = stored;
            await this.verifyToken();
        }
        console.log('🐙 GitHubAPI initialized', this.initialized ? '(authenticated)' : '(no token)');
    },
    
    setToken(token) {
        this.token = token;
        localStorage.setItem('github_pat', token);
        this.verifyToken();
    },
    
    async verifyToken() {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                this.username = user.login;
                this.initialized = true;
                console.log(`✅ GitHub authenticated as @${this.username}`);
                return true;
            } else {
                console.error('❌ GitHub token invalid');
                this.initialized = false;
                return false;
            }
        } catch (e) {
            console.error('GitHub API error:', e);
            this.initialized = false;
            return false;
        }
    },
    
    async createRepo(name, description, privateRepo = false) {
        if (!this.initialized) {
            throw new Error('GitHub not authenticated. Please enter your PAT.');
        }
        
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                description: description,
                private: privateRepo,
                auto_init: true,
                has_issues: true,
                has_wiki: true
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create repository');
        }
        
        const repo = await response.json();
        console.log(`✅ Created repository: ${repo.html_url}`);
        return repo;
    },
    
    async commitFile(repoName, filePath, content, message) {
        if (!this.initialized) {
            throw new Error('GitHub not authenticated');
        }
        
        // Check if file exists (need to get SHA for update)
        let sha = null;
        try {
            const existing = await fetch(
                `https://api.github.com/repos/${this.username}/${repoName}/contents/${filePath}`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (existing.ok) {
                const data = await existing.json();
                sha = data.sha;
            }
        } catch (e) {
            // File doesn't exist, that's fine
            sha = null;
        }
        
        // Commit file
        const body = {
            message: message,
            content: btoa(unescape(encodeURIComponent(content))),
            branch: 'main'
        };
        
        if (sha) {
            body.sha = sha;
        }
        
        const response = await fetch(
            `https://api.github.com/repos/${this.username}/${repoName}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to commit ${filePath}`);
        }
        
        const result = await response.json();
        console.log(`✅ Committed ${filePath} to ${repoName}`);
        return result;
    },
    
    async commitMultipleFiles(repoName, files) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.commitFile(
                    repoName,
                    file.path,
                    file.content,
                    file.message || `Add ${file.path}`
                );
                results.push({ success: true, path: file.path, result });
            } catch (e) {
                results.push({ success: false, path: file.path, error: e.message });
            }
        }
        
        return results;
    },
    
    async searchSimilarRepos(query, language = 'Python', minStars = 50) {
        const searchQuery = `${query} language:${language} stars:>=${minStars}`;
        const encoded = encodeURIComponent(searchQuery);
        
        const response = await fetch(
            `https://api.github.com/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=10`,
            {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            console.error('Failed to search repos');
            return [];
        }
        
        const data = await response.json();
        return data.items || [];
    },
    
    async getRepoContents(owner, repo, path = '') {
        const endpoint = path 
            ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
            : `https://api.github.com/repos/${owner}/${repo}/contents`;
        
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            return [];
        }
        
        return await response.json();
    },
    
    async getFileContent(owner, repo, path) {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        // Decode base64 content
        const content = atob(data.content);
        return { ...data, content };
    },
    
    logout() {
        this.token = null;
        this.username = null;
        this.initialized = false;
        localStorage.removeItem('github_pat');
        console.log('👋 GitHub logged out');
    }
};

window.GitHubAPI = GitHubAPI;

    // Create a new repository
    async createRepo(name, description = '', private = false, autoInit = true) {
        if (!this.token) {
            throw new Error('GitHub token required. Please authenticate first.');
        }
        
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                description: description,
                private: private,
                auto_init: autoInit
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create repository');
        }
        
        const repo = await response.json();
        console.log('✅ Repository created:', repo.html_url);
        return repo;
    }
    
    // Commit a file to a repository
    async commitFile(owner, repo, path, content, message = 'Update file') {
        if (!this.token) {
            throw new Error('GitHub token required');
        }
        
        // First, check if file exists to get SHA
        let sha = null;
        try {
            const existing = await this.getFileContent(owner, repo, path);
            if (existing) {
                sha = existing.sha;
            }
        } catch (e) {
            // File doesn't exist, that's fine
        }
        
        const body = {
            message: message,
            content: btoa(content),
            branch: 'main'
        };
        
        if (sha) {
            body.sha = sha;
        }
        
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to commit file');
        }
        
        return await response.json();
    }
    
    // Create multiple files in a repository
    async createFiles(owner, repo, files, commitMessage = 'Generate files from Mind Palace') {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.commitFile(owner, repo, file.name, file.content, commitMessage);
                results.push({ success: true, file: file.name, result });
            } catch (error) {
                results.push({ success: false, file: file.name, error: error.message });
            }
        }
        
        return results;
    }
    
    // Search for similar repositories
    async searchSimilarRepos(query, language = 'Python', minStars = 10, limit = 10) {
        const searchQuery = `${query} language:${language} stars:>=${minStars}`;
        const response = await fetch(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=${limit}`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (!response.ok) {
            return [];
        }
        
        const data = await response.json();
        return data.items || [];
    }
    
    // Get common file patterns from repositories
    async getCommonPatterns(repos) {
        const fileCounts = {};
        
        for (const repo of repos.slice(0, 5)) { // Limit to 5 repos
            try {
                const contents = await this.getRepoContents(repo.owner.login, repo.name);
                for (const item of contents) {
                    if (item.type === 'file') {
                        fileCounts[item.name] = (fileCounts[item.name] || 0) + 1;
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch contents for', repo.name);
            }
        }
        
        // Sort by frequency
        return Object.entries(fileCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
    }
