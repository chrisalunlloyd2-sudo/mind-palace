/**
 * Mind Palace Lakehouse — Dual Renderer (WebGL 2.0 + Raycaster Fallback)
 * 
 * Tries WebGL 2.0 first. Falls back to a Wolfenstein-style raycaster
 * that works on ANY device including old phones.
 */

const LakehouseRenderer = {
    gl: null,
    canvas: null,
    program: null,
    rooms: [],
    roomTemplates: null,
    fog: { color: [0.05, 0.05, 0.08], near: 15, far: 40 },
    lights: [],
    stats: { drawCalls: 0, triangles: 0 },
    useWebGL: true,
    ctx: null,
    map: [],       // 2D grid for raycaster
    mapW: 0,
    mapH: 0,
    textures: {},

    async init(canvasId = 'gameCanvas') {
        console.log('[Renderer] Initializing...');
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            document.body.appendChild(this.canvas);
        }

        // Try WebGL 2.0
        this.gl = this.canvas.getContext('webgl2', {
            antialias: true, alpha: false, stencil: true, depth: true
        });

        if (this.gl) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.program = this.compileShader(VERTEX_SRC, FRAGMENT_SRC);
            if (!this.program) {
                console.warn('[Renderer] Shader failed, using raycaster');
                this.useWebGL = false;
                this.gl = null;
            }
        } else {
            console.warn('[Renderer] WebGL 2.0 not supported, using raycaster');
            this.useWebGL = false;
        }

        if (!this.useWebGL) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        this.roomTemplates = window.MapLoader ? window.MapLoader.roomTemplates : null;
        console.log(`[Renderer] Mode: ${this.useWebGL ? 'WebGL 2.0' : 'Raycaster'}`);
        return true;
    },

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        if (this.useWebGL && this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    compileShader(vertSrc, fragSrc) {
        const gl = this.gl;
        try {
            const vert = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vert, vertSrc);
            gl.compileShader(vert);
            if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
                console.error('[Renderer] Vertex shader error:', gl.getShaderInfoLog(vert));
                return null;
            }
            const frag = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(frag, fragSrc);
            gl.compileShader(frag);
            if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
                console.error('[Renderer] Fragment shader error:', gl.getShaderInfoLog(frag));
                return null;
            }
            const prog = gl.createProgram();
            gl.attachShader(prog, vert);
            gl.attachShader(prog, frag);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                console.error('[Renderer] Program link error:', gl.getProgramInfoLog(prog));
                return null;
            }
            return prog;
        } catch (e) {
            console.error('[Renderer] Shader exception:', e);
            return null;
        }
    },

    getRoomColors(type) {
        const palette = {
            living_room: [0.25, 0.18, 0.12],
            kitchen: [0.3, 0.25, 0.2],
            dining_room: [0.22, 0.15, 0.1],
            master_bedroom: [0.2, 0.15, 0.18],
            guest_bedroom: [0.18, 0.2, 0.22],
            office: [0.15, 0.2, 0.15],
            library: [0.12, 0.08, 0.05],
            hallway: [0.2, 0.2, 0.22],
            stairwell: [0.18, 0.18, 0.2],
            bathroom: [0.25, 0.28, 0.3],
            basement: [0.08, 0.08, 0.1],
            attic: [0.15, 0.12, 0.08],
            porch: [0.3, 0.25, 0.2],
            deck: [0.25, 0.22, 0.18],
            mudroom: [0.2, 0.18, 0.15],
            laundry: [0.22, 0.22, 0.25],
            default: [0.2, 0.2, 0.2]
        };
        return palette[type] || palette.default;
    },

    buildRoom(roomData) {
        const template = this.roomTemplates ? this.roomTemplates[roomData.type] : null;
        const size = template ? template.size : [8, 3, 8];
        const pos = roomData.position;
        const baseColor = this.getRoomColors(roomData.type);
        
        if (this.useWebGL) {
            this.buildRoomWebGL(roomData, pos, size, baseColor);
        } else {
            this.buildRoomRaycaster(roomData, pos, size, baseColor);
        }
    },

    buildRoomWebGL(roomData, pos, size, baseColor) {
        const gl = this.gl;
        const [cx, cy, cz] = pos;
        const [w, h, d] = size;
        const hw = w/2, hh = h/2, hd = d/2;
        const verts = [];
        
        function addQuad(p1, p2, p3, p4, n, c) {
            for (let i = 0; i < 6; i++) {
                const p = i < 3 ? (i === 0 ? p1 : i === 1 ? p2 : p3) : (i === 3 ? p1 : i === 4 ? p3 : p4);
                verts.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2]);
            }
        }

        const wc = baseColor.map(c => c * 0.9);
        const fc = baseColor.map(c => c * 0.7);
        const cc = baseColor.map(c => c * 0.5);
        
        addQuad([cx-hw,cy-hh,cz+hd],[cx+hw,cy-hh,cz+hd],[cx+hw,cy+hh,cz+hd],[cx-hw,cy+hh,cz+hd],[0,0,1],wc);
        addQuad([cx+hw,cy-hh,cz-hd],[cx-hw,cy-hh,cz-hd],[cx-hw,cy+hh,cz-hd],[cx+hw,cy+hh,cz-hd],[0,0,-1],wc);
        addQuad([cx-hw,cy-hh,cz-hd],[cx-hw,cy-hh,cz+hd],[cx-hw,cy+hh,cz+hd],[cx-hw,cy+hh,cz-hd],[-1,0,0],wc);
        addQuad([cx+hw,cy-hh,cz+hd],[cx+hw,cy-hh,cz-hd],[cx+hw,cy+hh,cz-hd],[cx+hw,cy+hh,cz+hd],[1,0,0],wc);
        addQuad([cx-hw,cy-hh,cz-hd],[cx+hw,cy-hh,cz-hd],[cx+hw,cy-hh,cz+hd],[cx-hw,cy-hh,cz+hd],[0,1,0],fc);
        addQuad([cx-hw,cy+hh,cz+hd],[cx+hw,cy+hh,cz+hd],[cx+hw,cy+hh,cz-hd],[cx-hw,cy+hh,cz-hd],[0,-1,0],cc);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
        gl.bindVertexArray(null);
        
        this.rooms.push({ vao, vbo, vertexCount: verts.length / 9, position: [cx,cy,cz], type: roomData.type, id: roomData.id });
    },

    buildRoomRaycaster(roomData, pos, size, baseColor) {
        // Convert room to grid cells for raycaster
        const [cx, cy, cz] = pos;
        const [w, h, d] = size;
        const hw = Math.round(w/2), hd = Math.round(d/2);
        
        // Store as wall segments
        const color = baseColor.map(c => Math.floor(c * 255));
        const hexColor = `rgb(${color[0]},${color[1]},${color[2]})`;
        const floorColor = `rgb(${Math.floor(color[0]*0.7)},${Math.floor(color[1]*0.7)},${Math.floor(color[2]*0.7)})`;
        const ceilColor = `rgb(${Math.floor(color[0]*0.5)},${Math.floor(color[1]*0.5)},${Math.floor(color[2]*0.5)})`;
        
        this.rooms.push({
            id: roomData.id,
            type: roomData.type,
            x: Math.round(cx), z: Math.round(cz),
            w: hw * 2, d: hd * 2,
            wallColor: hexColor,
            floorColor: floorColor,
            ceilColor: ceilColor,
            is2D: true
        });
    },

    buildAllRooms(mapData) {
        this.rooms = [];
        if (!mapData || !mapData.rooms) {
            console.warn('[Renderer] No rooms to build');
            return;
        }
        for (const room of mapData.rooms) {
            this.buildRoom(room);
        }
        console.log(`[Renderer] Built ${this.rooms.length} rooms`);
    },

    addLight(position, color, intensity) {
        this.lights.push({ position, color, intensity });
    },

    render(scene, camera) {
        if (this.useWebGL) {
            this.renderWebGL(camera);
        } else {
            this.renderRaycaster(camera);
        }
    },

    renderWebGL(camera) {
        const gl = this.gl;
        const prog = this.program;
        if (!gl || !prog) return;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.useProgram(prog);

        gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uProjection'), false, camera.projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uView'), false, camera.viewMatrix);
        gl.uniform3fv(gl.getUniformLocation(prog, 'uFogColor'), this.fog.color);
        gl.uniform1f(gl.getUniformLocation(prog, 'uFogNear'), this.fog.near);
        gl.uniform1f(gl.getUniformLocation(prog, 'uFogFar'), this.fog.far);

        const light = this.lights.length > 0 ? this.lights[0] : { position: [0,5,0], color: [1,1,1], intensity: 3 };
        gl.uniform3fv(gl.getUniformLocation(prog, 'uLightPos'), light.position);
        gl.uniform3fv(gl.getUniformLocation(prog, 'uLightColor'), light.color);
        gl.uniform1f(gl.getUniformLocation(prog, 'uLightIntensity'), light.intensity);

        this.stats.drawCalls = 0;
        this.stats.triangles = 0;
        for (const room of this.rooms) {
            gl.bindVertexArray(room.vao);
            gl.drawArrays(gl.TRIANGLES, 0, room.vertexCount);
            this.stats.drawCalls++;
            this.stats.triangles += room.vertexCount / 3;
        }
        gl.bindVertexArray(null);
    },

    renderRaycaster(camera) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        // Camera
        const pos = camera.getPosition();
        const rot = camera.rotation;
        const dirX = -Math.sin(rot[0]);
        const dirZ = -Math.cos(rot[0]);
        const planeX = Math.cos(rot[0]) * 0.66;
        const planeZ = -Math.sin(rot[0]) * 0.66;

        // Draw ceiling and floor
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h/2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, h/2, w, h/2);

        // Raycast each column
        for (let x = 0; x < w; x++) {
            const camX = 2 * x / w - 1;
            const rayDirX = dirX + planeX * camX;
            const rayDirZ = dirZ + planeZ * camX;

            let mapX = Math.floor(pos[0]);
            let mapZ = Math.floor(pos[2]);

            const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
            const deltaDistZ = rayDirZ === 0 ? 1e30 : Math.abs(1 / rayDirZ);

            let stepX, stepZ, sideDistX, sideDistZ;
            let hit = false, side = 0;

            if (rayDirX < 0) { stepX = -1; sideDistX = (pos[0] - mapX) * deltaDistX; }
            else { stepX = 1; sideDistX = (mapX + 1.0 - pos[0]) * deltaDistX; }
            if (rayDirZ < 0) { stepZ = -1; sideDistZ = (pos[2] - mapZ) * deltaDistZ; }
            else { stepZ = 1; sideDistZ = (mapZ + 1.0 - pos[2]) * deltaDistZ; }

            // DDA algorithm
            let maxDist = 30;
            for (let i = 0; i < maxDist; i++) {
                if (sideDistX < sideDistZ) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistZ += deltaDistZ;
                    mapZ += stepZ;
                    side = 1;
                }

                // Check if this cell has a room wall
                for (const room of this.rooms) {
                    const rx = room.x, rz = room.z;
                    const hw = room.w / 2, hd = room.d / 2;
                    if (mapX >= rx - hw && mapX <= rx + hw && mapZ >= rz - hd && mapZ <= rz + hd) {
                        hit = true;
                        break;
                    }
                }
                if (hit) break;
            }

            if (hit) {
                const perpDist = side === 0 ? 
                    (mapX - pos[0] + (1 - stepX) / 2) / rayDirX :
                    (mapZ - pos[2] + (1 - stepZ) / 2) / rayDirZ;

                const lineH = Math.abs(Math.floor(h / perpDist));
                const drawStart = Math.max(0, -lineH / 2 + h / 2);
                const drawEnd = Math.min(h - 1, lineH / 2 + h / 2);

                // Find which room we hit
                let roomColor = '#444';
                for (const room of this.rooms) {
                    const rx = room.x, rz = room.z;
                    const hw = room.w / 2, hd = room.d / 2;
                    if (mapX >= rx - hw && mapX <= rx + hw && mapZ >= rz - hd && mapZ <= rz + hd) {
                        roomColor = room.wallColor;
                        break;
                    }
                }

                // Darken for side walls
                if (side === 1) {
                    ctx.fillStyle = this.darkenColor(roomColor, 0.7);
                } else {
                    ctx.fillStyle = roomColor;
                }
                ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
            }
        }

        // Crosshair
        ctx.strokeStyle = 'rgba(0,255,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w/2 - 10, h/2);
        ctx.lineTo(w/2 + 10, h/2);
        ctx.moveTo(w/2, h/2 - 10);
        ctx.lineTo(w/2, h/2 + 10);
        ctx.stroke();
    },

    darkenColor(color, factor) {
        const match = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
        if (!match) return color;
        return `rgb(${Math.floor(match[1]*factor)},${Math.floor(match[2]*factor)},${Math.floor(match[3]*factor)})`;
    },

    dispose() {
        if (this.useWebGL && this.gl) {
            for (const room of this.rooms) {
                if (room.vao) this.gl.deleteVertexArray(room.vao);
                if (room.vbo) this.gl.deleteBuffer(room.vbo);
            }
        }
        this.rooms = [];
    }
};

// ====== SHADERS ======

const VERTEX_SRC = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
in vec3 aColor;
uniform mat4 uProjection;
uniform mat4 uView;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
out vec3 vColor;
out float vFogFactor;
void main() {
    vec4 worldPos = vec4(aPosition, 1.0);
    gl_Position = uProjection * uView * worldPos;
    vec3 lightDir = normalize(uLightPos - aPosition);
    float diff = max(dot(aNormal, lightDir), 0.0);
    float ambient = 0.3;
    float dist = distance(uLightPos, aPosition);
    float attenuation = uLightIntensity / (1.0 + dist * 0.3);
    vColor = aColor * (ambient + diff * attenuation);
    float viewDist = length(worldPos.xyz);
    vFogFactor = clamp((viewDist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec3 vColor;
in float vFogFactor;
uniform vec3 uFogColor;
out vec4 fragColor;
void main() {
    vec3 color = mix(vColor, uFogColor, vFogFactor);
    fragColor = vec4(color, 1.0);
}
`;

window.LakehouseRenderer = LakehouseRenderer;
