// Mind Palace 3D - First Person Controls
// Pointer lock + WASD + mouselook

const Controls3D = {
    camera: null,
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    canJump: false,
    prevTime: performance.now(),
    
    init(camera, domElement) {
        this.camera = camera;
        
        // Pointer lock
        domElement.addEventListener('click', () => {
            domElement.requestPointerLock();
        });
        
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === domElement) {
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this));
            }
        });
        
        // Keyboard
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    },
    
    onMouseMove(event) {
        if (!this.camera) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        // Yaw (left/right)
        this.camera.rotation.y -= movementX * 0.002;
        
        // Pitch (up/down) - limited
        this.camera.rotation.x -= movementY * 0.002;
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
    },
    
    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.canJump) this.velocity.y += 10;
                this.canJump = false;
                break;
            case 'KeyE':
                // Toggle expert panel
                if (window.ExpertSystem) ExpertSystem.toggle();
                break;
        }
    },
    
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    },
    
    update() {
        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;
        
        if (!this.camera) return;
        
        // Damping
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= this.velocity.y * 10.0 * delta;
        
        // Movement direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        // Apply movement
        const speed = 8.0;
        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * speed * delta;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * speed * delta;
        }
        
        // Move camera
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        euler.y = this.camera.rotation.y;
        euler.x = 0; // Lock pitch for movement
        
        const direction = new THREE.Vector3();
        direction.setFromEuler(euler);
        
        this.camera.position.x -= direction.x * this.velocity.x * delta;
        this.camera.position.z -= direction.z * this.velocity.z * delta;
        this.camera.position.y += this.velocity.y * delta;
        
        // Floor collision
        if (this.camera.position.y < 1.6) {
            this.velocity.y = 0;
            this.camera.position.y = 1.6;
            this.canJump = true;
        }
        
        this.prevTime = time;
    },
    
    getPosition() {
        return this.camera.position.clone();
    },
    
    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }
};

window.Controls3D = Controls3D;
