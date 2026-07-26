/**
 * Mind Palace Lakehouse — Touch Controls & Mobile UI
 * Phase 3.6: Phone-compatible navigation
 * 
 * Features:
 * - Virtual joystick for movement (left thumb)
 * - Touch drag for camera look (right side)
 * - On-screen action buttons (interact, push, inventory)
 * - Responsive layout for all screen sizes
 * - Auto-detect mobile vs desktop
 * - Gesture support (swipe, pinch, tap)
 */

const TouchControls = {
    enabled: false,
    canvas: null,
    camera: null,
    
    // Joystick
    joystick: null,
    joystickKnob: null,
    joystickActive: false,
    joystickId: null,
    joystickCenter: { x: 0, y: 0 },
    joystickInput: { x: 0, y: 0 },
    joystickRadius: 50,
    
    // Look controls
    lookActive: false,
    lookId: null,
    lastTouchX: 0,
    lastTouchY: 0,
    lookSensitivity: 0.004,
    
    // Buttons
    buttons: {},
    
    // Gesture detection
    lastTapTime: 0,
    tapCount: 0,
    
    // Device detection
    isMobile: false,
    isPortrait: false,

    init(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        this.isMobile = this.detectMobile();
        this.isPortrait = window.innerHeight > window.innerWidth;
        
        if (!this.isMobile) {
            console.log('[TouchControls] Desktop detected, touch controls disabled');
            return;
        }
        
        console.log('[TouchControls] Mobile detected, initializing touch controls');
        this.enabled = true;
        this.createJoystick();
        this.createActionButtons();
        this.createLookZone();
        this.bindTouchEvents();
        this.handleResize();
        
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 300);
        });
        
        console.log('[TouchControls] Ready');
    },

    detectMobile() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const mobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
        const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        return mobile || touch;
    },

    createJoystick() {
        // Joystick container
        this.joystick = document.createElement('div');
        this.joystick.id = 'joystick-container';
        this.joystick.style.cssText = `
            position: fixed; bottom: 40px; left: 40px;
            width: 120px; height: 120px; z-index: 2000;
            display: none; touch-action: none;
        `;
        
        // Outer ring
        const outer = document.createElement('div');
        outer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            border: 2px solid rgba(0, 255, 0, 0.3);
            border-radius: 50%; background: rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
        `;
        
        // Inner knob
        this.joystickKnob = document.createElement('div');
        this.joystickKnob.style.cssText = `
            position: absolute; top: 50%; left: 50%;
            width: 50px; height: 50px;
            transform: translate(-50%, -50%);
            border: 2px solid rgba(0, 255, 0, 0.6);
            border-radius: 50%; background: rgba(0, 255, 0, 0.15);
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.2);
            transition: none;
        `;
        
        // Center dot
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: absolute; top: 50%; left: 50%;
            width: 8px; height: 8px;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 0, 0.5);
            border-radius: 50%;
        `;
        
        // Label
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute; bottom: -20px; left: 50%;
            transform: translateX(-50%);
            color: rgba(0, 255, 0, 0.4); font-size: 10px;
            font-family: 'Courier New', monospace;
            white-space: nowrap;
        `;
        label.textContent = 'MOVE';
        
        outer.appendChild(this.joystickKnob);
        this.joystickKnob.appendChild(dot);
        this.joystick.appendChild(outer);
        this.joystick.appendChild(label);
        document.body.appendChild(this.joystick);
    },

    createActionButtons() {
        const btnStyle = (label, key, color = '#00ff00', bottom = 40, right = 20) => {
            const btn = document.createElement('div');
            btn.id = `touch-btn-${key}`;
            btn.dataset.key = key;
            btn.style.cssText = `
                position: fixed; bottom: ${bottom}px; right: ${right}px;
                width: 60px; height: 60px; z-index: 2000; display: none;
                border: 2px solid ${color}; border-radius: 50%;
                background: rgba(0, 0, 0, 0.5);
                color: ${color}; font-size: 11px; font-weight: bold;
                font-family: 'Courier New', monospace;
                display: flex; align-items: center; justify-content: center;
                touch-action: none; cursor: pointer;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.1);
                user-select: none; -webkit-user-select: none;
            `;
            btn.textContent = label;
            return btn;
        };

        // Action buttons arranged in a ring on the right side
        const buttons = [
            { label: 'E', key: 'e', color: '#00ffcc', bottom: 120, right: 20 },
            { label: 'F', key: 'f', color: '#ff8800', bottom: 190, right: 20 },
            { label: 'I', key: 'i', color: '#8888ff', bottom: 260, right: 20 },
            { label: 'M', key: 'm', color: '#ff44ff', bottom: 330, right: 20 },
        ];

        buttons.forEach(b => {
            const btn = btnStyle(b.label, b.key, b.color, b.bottom, b.right);
            document.body.appendChild(btn);
            this.buttons[b.key] = btn;

            // Touch events
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                btn.style.background = 'rgba(0, 255, 0, 0.3)';
                btn.style.transform = 'scale(0.9)';
                this.handleButtonPress(b.key);
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.style.background = 'rgba(0, 0, 0, 0.5)';
                btn.style.transform = 'scale(1)';
            }, { passive: false });

            btn.addEventListener('touchcancel', (e) => {
                btn.style.background = 'rgba(0, 0, 0, 0.5)';
                btn.style.transform = 'scale(1)';
            });
        });

        // Sprint button (bottom center)
        const sprintBtn = document.createElement('div');
        sprintBtn.id = 'touch-btn-sprint';
        sprintBtn.style.cssText = `
            position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
            width: 80px; height: 40px; z-index: 2000; display: none;
            border: 2px solid #ff4444; border-radius: 20px;
            background: rgba(0, 0, 0, 0.5);
            color: #ff4444; font-size: 11px; font-weight: bold;
            font-family: 'Courier New', monospace;
            display: flex; align-items: center; justify-content: center;
            touch-action: none; cursor: pointer;
            user-select: none; -webkit-user-select: none;
        `;
        sprintBtn.textContent = 'SPRINT';
        document.body.appendChild(sprintBtn);
        this.buttons['sprint'] = sprintBtn;

        sprintBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            sprintBtn.style.background = 'rgba(255, 0, 0, 0.3)';
            if (this.camera) this.camera.isSprinting = true;
        }, { passive: false });

        sprintBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            sprintBtn.style.background = 'rgba(0, 0, 0, 0.5)';
            if (this.camera) this.camera.isSprinting = false;
        }, { passive: false });
    },

    createLookZone() {
        // Right half of screen for look controls
        this.lookZone = document.createElement('div');
        this.lookZone.id = 'look-zone';
        this.lookZone.style.cssText = `
            position: fixed; top: 0; right: 0;
            width: 50%; height: 100%; z-index: 1999;
            display: none; touch-action: none;
            background: transparent;
        `;
        document.body.appendChild(this.lookZone);
    },

    bindTouchEvents() {
        // Joystick events
        this.joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.joystickActive = true;
            this.joystickId = touch.identifier;
            const rect = this.joystick.getBoundingClientRect();
            this.joystickCenter.x = rect.left + rect.width / 2;
            this.joystickCenter.y = rect.top + rect.height / 2;
            this.updateJoystick(touch);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.joystickId) {
                    e.preventDefault();
                    this.updateJoystick(touch);
                }
                if (touch.identifier === this.lookId) {
                    e.preventDefault();
                    this.updateLook(touch);
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.joystickId) {
                    this.joystickActive = false;
                    this.joystickId = null;
                    this.resetJoystick();
                }
                if (touch.identifier === this.lookId) {
                    this.lookActive = false;
                    this.lookId = null;
                }
            }
        });

        // Look zone events
        this.lookZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.lookActive = true;
            this.lookId = touch.identifier;
            this.lastTouchX = touch.clientX;
            this.lastTouchY = touch.clientY;
        }, { passive: false });

        // Double-tap detection on canvas
        this.canvas.addEventListener('touchstart', (e) => {
            const now = Date.now();
            const timeSince = now - this.lastTapTime;
            if (timeSince < 300 && timeSince > 0) {
                this.tapCount++;
                if (this.tapCount >= 2) {
                    this.handleDoubleTap(e);
                    this.tapCount = 0;
                }
            } else {
                this.tapCount = 1;
            }
            this.lastTapTime = now;
        });
    },

    updateJoystick(touch) {
        const dx = touch.clientX - this.joystickCenter.x;
        const dy = touch.clientY - this.joystickCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = this.joystickRadius;
        
        let clampedX = dx;
        let clampedY = dy;
        
        if (dist > maxDist) {
            clampedX = (dx / dist) * maxDist;
            clampedY = (dy / dist) * maxDist;
        }
        
        // Update knob position
        this.joystickKnob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
        
        // Normalize input (-1 to 1)
        this.joystickInput.x = clampedX / maxDist;
        this.joystickInput.y = clampedY / maxDist;
        
        // Update camera movement keys
        if (this.camera) {
            this.camera.keys['w'] = this.joystickInput.y < -0.2;
            this.camera.keys['s'] = this.joystickInput.y > 0.2;
            this.camera.keys['a'] = this.joystickInput.x < -0.2;
            this.camera.keys['d'] = this.joystickInput.x > 0.2;
        }
    },

    resetJoystick() {
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        this.joystickInput.x = 0;
        this.joystickInput.y = 0;
        if (this.camera) {
            this.camera.keys['w'] = false;
            this.camera.keys['s'] = false;
            this.camera.keys['a'] = false;
            this.camera.keys['d'] = false;
        }
    },

    updateLook(touch) {
        if (!this.camera) return;
        
        const dx = touch.clientX - this.lastTouchX;
        const dy = touch.clientY - this.lastTouchY;
        
        this.camera.mouseDelta[0] -= dx * this.lookSensitivity * 100;
        this.camera.mouseDelta[1] -= dy * this.lookSensitivity * 100;
        
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
    },

    handleButtonPress(key) {
        if (!this.camera) return;
        
        switch(key) {
            case 'e':
                // Trigger interaction
                if (window.Lakehouse) {
                    window.Lakehouse.interact();
                }
                break;
            case 'f':
                if (window.Lakehouse) {
                    window.Lakehouse.pushObject();
                }
                break;
            case 'i':
                if (window.LakehouseHUD) {
                    const inv = document.getElementById('inventory');
                    if (inv) {
                        inv.style.display = inv.style.display === 'flex' ? 'none' : 'flex';
                    }
                }
                break;
            case 'm':
                if (window.LakehouseHUD) {
                    const mm = document.getElementById('minimap');
                    if (mm) {
                        mm.style.display = mm.style.display === 'none' ? 'block' : 'none';
                    }
                }
                break;
        }
    },

    handleDoubleTap(e) {
        // Double tap to toggle pointer lock / fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    },

    handleResize() {
        this.isPortrait = window.innerHeight > window.innerWidth;
        
        if (!this.enabled) return;
        
        // Adjust layout based on orientation
        if (this.isPortrait) {
            // Portrait: smaller controls, stacked
            this.joystick.style.bottom = '30px';
            this.joystick.style.left = '20px';
            this.joystick.style.width = '100px';
            this.joystick.style.height = '100px';
            this.joystickRadius = 40;
            
            // Reposition buttons
            const positions = [
                { key: 'e', bottom: 100, right: 15 },
                { key: 'f', bottom: 170, right: 15 },
                { key: 'i', bottom: 240, right: 15 },
                { key: 'm', bottom: 310, right: 15 },
            ];
            positions.forEach(p => {
                const btn = this.buttons[p.key];
                if (btn) {
                    btn.style.bottom = p.bottom + 'px';
                    btn.style.right = p.right + 'px';
                    btn.style.width = '50px';
                    btn.style.height = '50px';
                    btn.style.fontSize = '10px';
                }
            });
        } else {
            // Landscape: larger controls, spread out
            this.joystick.style.bottom = '40px';
            this.joystick.style.left = '40px';
            this.joystick.style.width = '120px';
            this.joystick.style.height = '120px';
            this.joystickRadius = 50;
            
            const positions = [
                { key: 'e', bottom: 120, right: 20 },
                { key: 'f', bottom: 190, right: 20 },
                { key: 'i', bottom: 260, right: 20 },
                { key: 'm', bottom: 330, right: 20 },
            ];
            positions.forEach(p => {
                const btn = this.buttons[p.key];
                if (btn) {
                    btn.style.bottom = p.bottom + 'px';
                    btn.style.right = p.right + 'px';
                    btn.style.width = '60px';
                    btn.style.height = '60px';
                    btn.style.fontSize = '11px';
                }
            });
        }
    },

    show() {
        if (!this.enabled) return;
        this.joystick.style.display = 'block';
        this.lookZone.style.display = 'block';
        Object.values(this.buttons).forEach(b => b.style.display = 'flex');
        
        // Hide desktop instructions, show mobile ones
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.innerHTML = `
                <strong>🕹 Left</strong> Move &nbsp; <strong>👆 Right</strong> Look &nbsp; 
                <strong>E</strong> Interact &nbsp; <strong>F</strong> Push &nbsp; 
                <strong>I</strong> Inventory &nbsp; <strong>M</strong> Map
            `;
        }
    },

    hide() {
        if (!this.enabled) return;
        this.joystick.style.display = 'none';
        this.lookZone.style.display = 'none';
        Object.values(this.buttons).forEach(b => b.style.display = 'none');
    },

    dispose() {
        if (this.joystick) this.joystick.remove();
        if (this.lookZone) this.lookZone.remove();
        Object.values(this.buttons).forEach(b => b.remove());
        this.enabled = false;
    }
};

window.TouchControls = TouchControls;
