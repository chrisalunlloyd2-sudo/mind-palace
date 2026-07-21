// Mind Palace 3D Engine - Three.js Implementation
// True 3D hallway with doors, lighting, and room interiors

const Engine3D = {
    scene: null,
    camera: null,
    renderer: null,
    hallway: null,
    rooms: [],
    doors: [],
    books: [],
    loadingProgress: 0,
    
    async init() {
        // Update loading screen
        this.updateLoading(10, 'Initializing Three.js...');
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 1, 15);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(1.5, 1.6, 0); // Eye level
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas3D'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        
        this.updateLoading(30, 'Building hallway...');
        
        // Build hallway
        this.buildHallway();
        
        // Load room data
        this.updateLoading(50, 'Loading room data...');
        const palaceData = await this.loadPalaceData();
        
        // Build doors
        this.updateLoading(70, 'Creating doors...');
        this.buildDoors(palaceData);
        
        // Lighting
        this.updateLoading(85, 'Setting up lighting...');
        this.setupLighting();
        
        // Controls
        Controls3D.init(this.camera, this.renderer.domElement);
        
        // Audio system
        if (window.AudioSystem) AudioSystem.init();
        
        // Room system
        if (window.RoomSystem3D) RoomSystem3D.init();
        
        this.updateLoading(100, 'Ready!');
        
        // Hide loading screen after brief delay
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
        }, 500);
        
        // Start render loop
        this.animate();
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('🏛️ Mind Palace 3D initialized');
    },
    
    updateLoading(percent, text) {
        this.loadingProgress = percent;
        const bar = document.getElementById('loading-progress');
        const txt = document.getElementById('loading-text');
        if (bar) bar.style.width = percent + '%';
        if (txt) txt.textContent = text;
    },
    
    buildHallway() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(4, 40);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a0f0a,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Ceiling
        const ceilingGeo = new THREE.PlaneGeometry(4, 40);
        const ceilingMat = new THREE.MeshStandardMaterial({ 
            color: 0x0d0705,
            roughness: 0.9
        });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 3;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);
        
        // Left wall
        const leftWallGeo = new THREE.PlaneGeometry(40, 3);
        const leftWallMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a1810,
            roughness: 0.7
        });
        const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
        leftWall.position.set(-2, 1.5, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        
        // Right wall
        const rightWall = new THREE.Mesh(leftWallGeo, leftWallMat);
        rightWall.position.set(2, 1.5, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
        
        // Back wall (end of hallway)
        const backWallGeo = new THREE.PlaneGeometry(4, 3);
        const backWall = new THREE.Mesh(backWallGeo, leftWallMat);
        backWall.position.set(0, 1.5, -20);
        backWall.receiveShadow = true;
        this.scene.add(backWall);
        
        this.hallway = { floor, ceiling, leftWall, rightWall, backWall };
    },
    
    buildDoors(palaceData) {
        const repoRooms = palaceData.nodes.filter(n => n.type === 'repo_room');
        
        // Position doors along both walls
        const doorSpacing = 1.8;
        let leftZ = -2;
        let rightZ = -2;
        
        repoRooms.forEach((room, i) => {
            const isLeft = i % 2 === 0;
            const z = isLeft ? leftZ : rightZ;
            const x = isLeft ? -1.95 : 1.95;
            
            if (isLeft) leftZ -= doorSpacing;
            else rightZ -= doorSpacing;
            
            // Door frame
            const frameGeo = new THREE.BoxGeometry(0.1, 2.2, 1.4);
            const frameMat = new THREE.MeshStandardMaterial({ 
                color: 0x8b4513,
                roughness: 0.6
            });
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(x, 1.1, z);
            frame.castShadow = true;
            frame.receiveShadow = true;
            this.scene.add(frame);
            
            // Door (rotates open)
            const doorGeo = new THREE.BoxGeometry(0.05, 2, 1.2);
            const doorMat = new THREE.MeshStandardMaterial({ 
                color: 0x654321,
                roughness: 0.7
            });
            const door = new THREE.Mesh(doorGeo, doorMat);
            door.position.set(x + (isLeft ? 0.05 : -0.05), 1, z);
            door.rotation.y = isLeft ? 0 : Math.PI;
            door.geometry.translate(0.6, 0, 0); // Pivot on left edge
            door.castShadow = true;
            door.userData = { 
                room: room, 
                isOpen: false,
                isLeft: isLeft
            };
            this.scene.add(door);
            this.doors.push(door);
            
            // Door glow effect
            const glowGeo = new THREE.PlaneGeometry(1.2, 2);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xffd700,
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.set(x, 1, z);
            glow.rotation.y = isLeft ? 0 : Math.PI;
            glow.userData = { door: door };
            this.scene.add(glow);
            
            // Door label (floating text)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 20px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(room.label.substring(0, 20), 128, 40);
            
            const texture = new THREE.CanvasTexture(canvas);
            const labelMat = new THREE.SpriteMaterial({ map: texture });
            const label = new THREE.Sprite(labelMat);
            label.position.set(x, 2.4, z);
            label.scale.set(1.5, 0.4, 1);
            this.scene.add(label);
        });
    },
    
    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);
        
        // Ceiling lights (spaced along hallway)
        for (let z = -2; z > -18; z -= 4) {
            const light = new THREE.PointLight(0xffaa00, 0.8, 8);
            light.position.set(0, 2.8, z);
            light.castShadow = true;
            this.scene.add(light);
            
            // Light fixture mesh
            const fixtureGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 16);
            const fixtureMat = new THREE.MeshStandardMaterial({ 
                color: 0xffaa00,
                emissive: 0xffaa00,
                emissiveIntensity: 0.5
            });
            const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
            fixture.position.set(0, 2.75, z);
            this.scene.add(fixture);
        }
    },
    
    async loadPalaceData() {
        try {
            const response = await fetch('data/palace.json?v=' + Date.now());
            return await response.json();
        } catch (e) {
            console.error('Failed to load palace data:', e);
            return { nodes: [], edges: [] };
        }
    },
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        Controls3D.update();
        
        // Check for door clicks
        this.checkDoorInteractions();
        
        this.renderer.render(this.scene, this.camera);
    },
    
    checkDoorInteractions() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(0, 0); // Center of screen
        
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.doors);
        
        if (intersects.length > 0 && intersects[0].distance < 3) {
            const door = intersects[0].object;
            document.body.style.cursor = 'pointer';
            
            // Highlight door
            if (door.material.emissive) {
                door.material.emissive.setHex(0x332211);
            }
        } else {
            document.body.style.cursor = 'crosshair';
        }
    },
    
    enterRoom(door) {
        if (!door) return;
        
        const room = door.userData.room;
        
        // Open door animation
        const isLeft = door.userData.isLeft;
        door.rotation.y += (isLeft ? -1 : 1) * Math.PI / 2;
        door.userData.isOpen = true;
        
        // Audio
        if (AudioSystem) AudioSystem.playSound('doorOpen');
        
        // Show room UI
        RoomSystem3D.enterRoom(room);
    },
    
    exitRoom() {
        // Close all open doors
        this.doors.forEach(door => {
            if (door.userData.isOpen) {
                const isLeft = door.userData.isLeft;
                door.rotation.y += (isLeft ? 1 : -1) * Math.PI / 2;
                door.userData.isOpen = false;
            }
        });
        
        // Hide room UI
        RoomSystem3D.exitRoom();
        
        // Audio
        if (AudioSystem) AudioSystem.playSound('doorClose');
    },
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};

window.Engine3D = Engine3D;

// Auto-start when page loads
window.addEventListener('load', () => {
    Engine3D.init();
});
