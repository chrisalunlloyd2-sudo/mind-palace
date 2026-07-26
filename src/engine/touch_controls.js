/**
 * Mind Palace Lakehouse — Touch Controls
 * Virtual joystick for mobile movement + touch look
 */

const TouchControls = {
    canvas: null,
    camera: null,
    enabled: false,
    joystick: null,
    joystickActive: false,
    joystickId: null,
    joystickCenter: [0, 0],
    joystickDelta: [0, 0],
    lookTouchId: null,
    lookStartX: 0,
    lookStartY: 0,
    lookMoved: false,

    init(canvas, camera) {
        console.log('[TouchControls] Initializing...');
        this.canvas = canvas;
        this.camera = camera;
        this.enabled = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
            navigator.userAgent || navigator.vendor || window.opera
        );
        if (!this.enabled) {
            console.log('[TouchControls] Not mobile, skipping');
            return;
        }
        this.setupListeners();
        this.createJoystickUI();
        console.log('[TouchControls] Ready');
    },

    setupListeners() {
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
    },

    createJoystickUI() {
        this.joystick = document.createElement('div');
        this.joystick.id = 'touch-joystick';
        this.joystick.style.cssText = 'position:fixed;bottom:30px;left:30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.2);z-index:1000;display:none;';
        const knob = document.createElement('div');
        knob.style.cssText = 'position:absolute;top:50%;left:50%;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.3);transform:translate(-50%,-50%);';
        this.joystick.appendChild(knob);
        document.body.appendChild(this.joystick);
    },

    onTouchStart(e) {
        for (const touch of e.changedTouches) {
            const x = touch.clientX;
            const y = touch.clientY;
            // Left half = movement joystick
            if (x < window.innerWidth / 2 && !this.joystickActive) {
                this.joystickActive = true;
                this.joystickId = touch.identifier;
                this.joystickCenter = [x, y];
                this.joystickDelta = [0, 0];
                this.joystick.style.display = 'block';
                this.joystick.style.left = (x - 50) + 'px';
                this.joystick.style.top = (y - 50) + 'px';
            }
            // Right half = look
            if (x >= window.innerWidth / 2 && this.lookTouchId === null) {
                this.lookTouchId = touch.identifier;
                this.lookStartX = x;
                this.lookStartY = y;
                this.lookMoved = false;
            }
        }
        e.preventDefault();
    },

    onTouchMove(e) {
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystickId) {
                const dx = touch.clientX - this.joystickCenter[0];
                const dy = touch.clientY - this.joystickCenter[1];
                const maxDist = 40;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > maxDist) {
                    this.joystickDelta = [dx/dist * maxDist, dy/dist * maxDist];
                } else {
                    this.joystickDelta = [dx, dy];
                }
                // Update knob position
                const knob = this.joystick.querySelector('div');
                if (knob) {
                    knob.style.transform = `translate(${-20 + this.joystickDelta[0]}px, ${-20 + this.joystickDelta[1]}px)`;
                }
                // Apply movement to camera
                if (this.camera) {
                    const threshold = 10;
                    if (Math.abs(this.joystickDelta[0]) > threshold) {
                        const moveX = this.joystickDelta[0] / maxDist;
                        this.camera.keys['d'] = moveX > 0.2;
                        this.camera.keys['a'] = moveX < -0.2;
                    } else {
                        this.camera.keys['d'] = false;
                        this.camera.keys['a'] = false;
                    }
                    if (Math.abs(this.joystickDelta[1]) > threshold) {
                        const moveZ = this.joystickDelta[1] / maxDist;
                        this.camera.keys['w'] = moveZ < -0.2;
                        this.camera.keys['s'] = moveZ > 0.2;
                    } else {
                        this.camera.keys['w'] = false;
                        this.camera.keys['s'] = false;
                    }
                }
            }
            if (touch.identifier === this.lookTouchId) {
                const dx = touch.clientX - this.lookStartX;
                const dy = touch.clientY - this.lookStartY;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.lookMoved = true;
                if (this.camera) {
                    this.camera.mouseDelta[0] += dx * 0.5;
                    this.camera.mouseDelta[1] += dy * 0.5;
                }
                this.lookStartX = touch.clientX;
                this.lookStartY = touch.clientY;
            }
        }
        e.preventDefault();
    },

    onTouchEnd(e) {
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystickId) {
                this.joystickActive = false;
                this.joystickId = null;
                this.joystickDelta = [0, 0];
                this.joystick.style.display = 'none';
                if (this.camera) {
                    this.camera.keys['w'] = false;
                    this.camera.keys['s'] = false;
                    this.camera.keys['a'] = false;
                    this.camera.keys['d'] = false;
                }
            }
            if (touch.identifier === this.lookTouchId) {
                this.lookTouchId = null;
            }
        }
        e.preventDefault();
    },

    show() {
        if (this.enabled && this.joystick) {
            this.joystick.style.display = 'block';
        }
    },

    hide() {
        if (this.joystick) {
            this.joystick.style.display = 'none';
        }
    },

    dispose() {
        if (this.joystick && this.joystick.parentNode) {
            this.joystick.parentNode.removeChild(this.joystick);
        }
    }
};

window.TouchControls = TouchControls;
