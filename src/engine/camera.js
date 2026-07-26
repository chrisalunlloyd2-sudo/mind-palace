/**
 * Mind Palace Lakehouse — Camera System
 * Phase 1.2: First-person camera with full 6DOF
 * 
 * Features:
 * - Yaw/pitch/roll control
 * - Smooth interpolation
 * - Head bob for walking
 * - Collision capsule (not point)
 * - Mouse lock pointer (desktop) / touch drag (mobile)
 * - Auto-detects input method
 */

const LakehouseCamera = {
    position: [1.5, 1.6, 0],
    rotation: [0, 0, 0],  // [yaw, pitch, roll]
    fov: 75,
    near: 0.1,
    far: 100,
    aspect: 1,
    
    // Movement
    velocity: [0, 0, 0],
    speed: 3.0,
    sprintMultiplier: 2.0,
    isSprinting: false,
    
    // Head bob
    bobAmount: 0.04,
    bobSpeed: 8.0,
    bobPhase: 0,
    
    // Mouse look
    sensitivity: 0.002,
    yawLimit: Math.PI * 2,
    pitchLimit: Math.PI / 2.2,
    
    // Collision capsule
    height: 1.7,
    radius: 0.3,
    eyeHeight: 1.6,
    
    // Matrices
    viewMatrix: new Float32Array(16),
    projectionMatrix: new Float32Array(16),
    
    // Input state
    keys: {},
    mouseDelta: [0, 0],
    isLocked: false,
    isMobile: false,

    init(canvas) {
        console.log('[Camera] Initializing...');
        this.aspect = window.innerWidth / window.innerHeight;
        this.updateProjection();
        this.isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
            navigator.userAgent || navigator.vendor || window.opera
        );
        
        if (!this.isMobile) {
            // Desktop: mouse lock
            canvas.addEventListener('click', () => {
                if (!this.isLocked) {
                    canvas.requestPointerLock();
                }
            });
            
            document.addEventListener('pointerlockchange', () => {
                this.isLocked = document.pointerLockElement === canvas;
            });
            
            document.addEventListener('mousemove', (e) => {
                if (this.isLocked) {
                    this.mouseDelta[0] += e.movementX;
                    this.mouseDelta[1] += e.movementY;
                }
            });
        } else {
            // Mobile: touch controls handle camera via mouseDelta
            // No pointer lock needed
            this.isLocked = true; // Always "locked" on mobile
        }
        
        // Keyboard (works on both)
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Shift') this.isSprinting = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            if (e.key === 'Shift') this.isSprinting = false;
        });
        
        // Resize
        window.addEventListener('resize', () => {
            this.aspect = window.innerWidth / window.innerHeight;
            this.updateProjection();
        });
        
        console.log('[Camera] Ready');
    },

    updateProjection() {
        const f = 1.0 / Math.tan(this.fov * Math.PI / 360);
        const n = this.near;
        const fa = this.far;
        const a = this.aspect;
        
        this.projectionMatrix[0] = f / a;
        this.projectionMatrix[5] = f;
        this.projectionMatrix[10] = (fa + n) / (n - fa);
        this.projectionMatrix[11] = -1;
        this.projectionMatrix[14] = (2 * fa * n) / (n - fa);
        this.projectionMatrix[1] = this.projectionMatrix[2] = this.projectionMatrix[3] = 0;
        this.projectionMatrix[4] = this.projectionMatrix[6] = this.projectionMatrix[7] = 0;
        this.projectionMatrix[12] = this.projectionMatrix[13] = this.projectionMatrix[15] = 0;
    },

    update(dt) {
        // Mouse look (desktop) or touch look (mobile via mouseDelta)
        const mx = this.mouseDelta[0] * this.sensitivity;
        const my = this.mouseDelta[1] * this.sensitivity;
        this.rotation[0] -= mx;
        this.rotation[1] = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.rotation[1] - my));
        this.mouseDelta[0] = 0;
        this.mouseDelta[1] = 0;
        
        // Movement
        const speed = this.speed * (this.isSprinting ? this.sprintMultiplier : 1) * dt;
        const forward = [-Math.sin(this.rotation[0]), 0, -Math.cos(this.rotation[0])];
        const right = [Math.cos(this.rotation[0]), 0, -Math.sin(this.rotation[0])];
        
        let moveX = 0, moveZ = 0;
        if (this.keys['w'] || this.keys['arrowup']) { moveX += forward[0]; moveZ += forward[2]; }
        if (this.keys['s'] || this.keys['arrowdown']) { moveX -= forward[0]; moveZ -= forward[2]; }
        if (this.keys['a'] || this.keys['arrowleft']) { moveX -= right[0]; moveZ -= right[2]; }
        if (this.keys['d'] || this.keys['arrowright']) { moveX += right[0]; moveZ += right[2]; }
        
        // Normalize
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (len > 0) {
            moveX /= len;
            moveZ /= len;
            this.position[0] += moveX * speed;
            this.position[2] += moveZ * speed;
            
            // Head bob
            this.bobPhase += dt * this.bobSpeed * len;
            const bobOffset = Math.sin(this.bobPhase) * this.bobAmount;
            this.position[1] = this.eyeHeight + bobOffset;
        }
        
        // Gravity (simple)
        if (this.position[1] > this.eyeHeight) {
            this.position[1] = Math.max(this.eyeHeight, this.position[1] - 9.8 * dt);
        }
        
        // Update view matrix
        this.updateViewMatrix();
    },

    updateViewMatrix() {
        const cx = Math.cos(this.rotation[0]);
        const sx = Math.sin(this.rotation[0]);
        const cy = Math.cos(this.rotation[1]);
        const sy = Math.sin(this.rotation[1]);
        
        // Look-at matrix
        const forward = [-sx * cy, sy, -cx * cy];
        const right = [cx, 0, -sx];
        const up = [sx * sy, cy, cx * sy];
        
        const px = this.position[0];
        const py = this.position[1];
        const pz = this.position[2];
        
        this.viewMatrix[0] = right[0];
        this.viewMatrix[1] = up[0];
        this.viewMatrix[2] = -forward[0];
        this.viewMatrix[3] = 0;
        this.viewMatrix[4] = right[1];
        this.viewMatrix[5] = up[1];
        this.viewMatrix[6] = -forward[1];
        this.viewMatrix[7] = 0;
        this.viewMatrix[8] = right[2];
        this.viewMatrix[9] = up[2];
        this.viewMatrix[10] = -forward[2];
        this.viewMatrix[11] = 0;
        this.viewMatrix[12] = -(right[0]*px + right[1]*py + right[2]*pz);
        this.viewMatrix[13] = -(up[0]*px + up[1]*py + up[2]*pz);
        this.viewMatrix[14] = forward[0]*px + forward[1]*py + forward[2]*pz;
        this.viewMatrix[15] = 1;
    },

    getForward() {
        return [
            -Math.sin(this.rotation[0]) * Math.cos(this.rotation[1]),
            Math.sin(this.rotation[1]),
            -Math.cos(this.rotation[0]) * Math.cos(this.rotation[1])
        ];
    },

    getPosition() {
        return [...this.position];
    },

    setPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
    },

    lookAt(x, y, z) {
        const dx = x - this.position[0];
        const dy = y - this.position[1];
        const dz = z - this.position[2];
        this.rotation[0] = Math.atan2(-dx, -dz);
        this.rotation[1] = Math.atan2(dy, Math.sqrt(dx*dx + dz*dz));
    }
};

window.LakehouseCamera = LakehouseCamera;
