// Mind Palace Audio System - Spatial Cues for Memory Anchoring
// Minimal Y-axis, horizontal navigation focused

const AudioSystem = {
    ctx: null,
    masterGain: null,
    wingThemes: {},
    
    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Keep it subtle
        this.masterGain.connect(this.ctx.destination);
        
        // Wing-specific ambient themes (low drone for proprioceptive anchoring)
        this.wingThemes = {
            west: this.createDrone(110, 'sine'),      // A2 - Core Systems
            east: this.createDrone(164, 'triangle'),  // E3 - AI/ML Foundry
            north: this.createDrone(130, 'sine'),     // C3 - Experiments
            south: this.createDrone(98, 'square'),    // G2 - Tests/Archive
        };
        
        // Event sounds (short, distinct for memory encoding)
        this.sounds = {
            doorOpen: () => this.tone(440, 0.2, 'square', 0.5),      // A4
            doorClose: () => this.tone(330, 0.2, 'square', 0.5),     // E4
            doorHover: () => this.tone(523, 0.05, 'sine', 0.2),      // C5 (soft)
            bookSelect: () => this.tone(659, 0.08, 'triangle', 0.3), // E5
            bookHover: () => this.tone(784, 0.03, 'sine', 0.15),     // G5 (very soft)
            pageTurn: () => this.tone(880, 0.06, 'triangle', 0.25),  // A5
            backNav: () => this.tone(262, 0.15, 'sine', 0.4),        // C4 (descend)
            step: () => this.noise(0.02, 0.1),                       // Footstep
            wallBump: () => this.tone(150, 0.1, 'sawtooth', 0.3),   // Low thud
        };
        
        // Start ambient based on current wing
        this.currentWing = 'west';
        this.playAmbient('west');
    },
    
    createDrone(freq, type) {
        return () => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(this.masterGain);
            gain.gain.value = 0.15;
            osc.start();
            return { osc, gain };
        };
    },
    
    tone(freq, duration, type, volume = 0.3) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(this.masterGain);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    
    noise(duration, volume = 0.2) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = volume;
        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    },
    
    playSound(name) {
        if (this.sounds[name]) this.sounds[name]();
    },
    
    playAmbient(wing) {
        if (wing === this.currentWing) return;
        this.currentWing = wing;
        
        // Smooth crossfade between wing themes
        if (this.currentDrone) {
            this.currentDrone.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
            this.currentDrone.osc.stop(this.ctx.currentTime + 0.5);
        }
        
        const drone = this.wingThemes[wing]();
        this.currentDrone = drone;
    },
    
    setVolume(vol) {
        if (this.masterGain) this.masterGain.gain.value = vol;
    },
    
    suspend() {
        if (this.ctx) this.ctx.suspend();
    },
    
    resume() {
        if (this.ctx) this.ctx.resume();
    }
};

window.AudioSystem = AudioSystem;
