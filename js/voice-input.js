// Mind Palace — Voice Input System
// Web Speech API for voice-controlled repo creation

const VoiceInput = {
    recognition: null,
    listening: false,
    callback: null,
    
    init() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('🎤 Voice input not supported in this browser');
            return false;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.listening = true;
            console.log('🎤 Listening...');
            if (AudioSystem) AudioSystem.playSound('bookHover');
        };
        
        this.recognition.onend = () => {
            this.listening = false;
            console.log('🎤 Stopped listening');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('🎤 Heard:', transcript);
            this.parseCommand(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('🎤 Voice error:', event.error);
            this.listening = false;
        };
        
        console.log('🎤 VoiceInput initialized');
        return true;
    },
    
    startListening(callback) {
        if (!this.recognition) {
            alert('Voice input not supported. Use Chrome or Edge browser.');
            return;
        }
        
        this.callback = callback;
        this.recognition.start();
    },
    
    stopListening() {
        if (this.recognition && this.listening) {
            this.recognition.stop();
        }
    },
    
    parseCommand(transcript) {
        // Parse voice command into repo creation parameters
        const command = transcript.toLowerCase();
        
        const parsed = {
            name: this.extractRepoName(command),
            description: this.extractDescription(command),
            language: this.extractLanguage(command),
            features: this.extractFeatures(command),
            raw: transcript
        };
        
        console.log('🎤 Parsed command:', parsed);
        
        if (this.callback) {
            this.callback(parsed);
        }
        
        return parsed;
    },
    
    extractRepoName(command) {
        // Try to extract repo name from patterns like:
        // "create a python api server" → "python-api-server"
        // "make my awesome project" → "my-awesome-project"
        
        const stopWords = ['create', 'make', 'build', 'a', 'an', 'the', 'my', 'new', 'for', 'with', 'using'];
        const words = command.split(' ').filter(w => !stopWords.includes(w));
        
        // Take first 3-5 meaningful words
        const nameWords = words.slice(0, 5);
        return nameWords.join('-').replace(/[^a-z0-9-]/g, '');
    },
    
    extractDescription(command) {
        // Simple extraction - just return the full command as description
        // More sophisticated NLP could be added later
        return command.charAt(0).toUpperCase() + command.slice(1);
    },
    
    extractLanguage(command) {
        const langMap = {
            'python': 'Python',
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'typescript': 'TypeScript',
            'ts': 'TypeScript',
            'java': 'Java',
            'go': 'Go',
            'golang': 'Go',
            'rust': 'Rust',
            'c++': 'C++',
            'cpp': 'C++',
            'html': 'HTML/CSS',
            'css': 'HTML/CSS',
            'react': 'JavaScript',
            'vue': 'JavaScript',
            'angular': 'TypeScript'
        };
        
        for (const [keyword, lang] of Object.entries(langMap)) {
            if (command.includes(keyword)) {
                return lang;
            }
        }
        
        return 'Python'; // Default
    },
    
    extractFeatures(command) {
        const features = [];
        
        const featureKeywords = {
            'api': 'API server',
            'server': 'Backend server',
            'web': 'Web interface',
            'gui': 'GUI application',
            'game': 'Game engine',
            'bot': 'Bot/Automation',
            'scraper': 'Web scraper',
            'ml': 'Machine learning',
            'ai': 'AI/ML features',
            'database': 'Database integration',
            'auth': 'Authentication',
            'test': 'Testing suite',
            'cli': 'Command-line interface',
            'desktop': 'Desktop app'
        };
        
        for (const [keyword, feature] of Object.entries(featureKeywords)) {
            if (command.includes(keyword)) {
                features.push(feature);
            }
        }
        
        return features;
    },
    
    // Voice command examples for user
    getExamples() {
        return [
            'Create a Python API server with authentication',
            'Make a JavaScript web scraper for data collection',
            'Build a Rust game engine with physics',
            'Create a TypeScript React dashboard',
            'Make a Go microservice with database'
        ];
    }
};

window.VoiceInput = VoiceInput;
