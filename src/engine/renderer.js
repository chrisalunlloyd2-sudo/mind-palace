/**
 * Mind Palace Lakehouse — WebGL 2.0 Renderer
 * Phase 1.1: True 3D renderer with room geometry generation
 * 
 * Features:
 * - Generates 3D geometry from room definitions (walls, floor, ceiling)
 * - Dynamic lighting (ambient + point lights)
 * - Fog for depth atmosphere
 * - Colored rooms with no external texture dependencies
 * - Works standalone — no image assets needed
 */

const LakehouseRenderer = {
    gl: null,
    canvas: null,
    program: null,
    buffers: {},
    rooms: [],
    roomTemplates: null,
    fog: { color: [0.05, 0.05, 0.08], near: 15, far: 40 },
    lights: [],
    stats: { drawCalls: 0, triangles: 0 },

    async init(canvasId = 'gameCanvas') {
        console.log('[Renderer] Initializing WebGL 2.0...');
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasId;
            document.body.appendChild(this.canvas);
        }

        this.gl = this.canvas.getContext('webgl2', {
            antialias: true,
            alpha: false,
            stencil: true,
            depth: true
        });

        if (!this.gl) {
            console.error('[Renderer] WebGL 2.0 not supported');
            return false;
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Compile shader
        this.program = this.compileShader(VERTEX_SRC, FRAGMENT_SRC);
        if (!this.program) return false;

        // Store room templates reference
        this.roomTemplates = window.MapLoader ? window.MapLoader.roomTemplates : null;

        console.log('[Renderer] WebGL 2.0 initialized');
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
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    compileShader(vertSrc, fragSrc) {
        const gl = this.gl;
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
    },

    /**
     * Room color palette
     */
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

    /**
     * Build a room as renderable geometry
     * Each room = 6 walls (4 sides + floor + ceiling) as colored quads
     * Each vertex: position (3) + normal (3) + color (3) = 9 floats
     */
    buildRoom(roomData) {
        const gl = this.gl;
        
        // Merge room data with template to get size
        const template = this.roomTemplates ? this.roomTemplates[roomData.type] : null;
        const size = template ? template.size : [8, 3, 8];
        const pos = roomData.position;
        
        const [cx, cy, cz] = pos;
        const [w, h, d] = size;
        const hw = w / 2, hh = h / 2, hd = d / 2;
        
        const baseColor = this.getRoomColors(roomData.type);
        
        // Generate all 6 faces as triangles (2 tris per face = 12 tris, 36 verts)
        // Each vertex: position (3) + normal (3) + color (3) = 9 floats
        const verts = [];
        
        // Helper: add a quad with a given normal
        function addQuad(p1, p2, p3, p4, normal, color) {
            // Triangle 1: p1-p2-p3
            verts.push(p1[0], p1[1], p1[2], normal[0], normal[1], normal[2], color[0], color[1], color[2]);
            verts.push(p2[0], p2[1], p2[2], normal[0], normal[1], normal[2], color[0], color[1], color[2]);
            verts.push(p3[0], p3[1], p3[2], normal[0], normal[1], normal[2], color[0], color[1], color[2]);
            // Triangle 2: p1-p3-p4
            verts.push(p1[0], p1[1], p1[2], normal[0], normal[1], normal[2], color[0], color[1], color[2]);
            verts.push(p3[0], p3[1], p3[2], normal[0], normal[1], normal[2], color[0], color[1], color[2]);
            verts.push(p4[0], p4[1], p4[2], normal[0], normal[1], normal[2], color[0], color[1], color[2]);
        }

        // Slightly darker for walls, lighter for floor, darker for ceiling
        const wallColor = baseColor.map(c => c * 0.9);
        const floorColor = baseColor.map(c => c * 0.7);
        const ceilColor = baseColor.map(c => c * 0.5);
        
        // Front wall (z+) — normal points +Z
        addQuad(
            [cx-hw, cy-hh, cz+hd], [cx+hw, cy-hh, cz+hd],
            [cx+hw, cy+hh, cz+hd], [cx-hw, cy+hh, cz+hd],
            [0, 0, 1], wallColor
        );
        // Back wall (z-) — normal points -Z
        addQuad(
            [cx+hw, cy-hh, cz-hd], [cx-hw, cy-hh, cz-hd],
            [cx-hw, cy+hh, cz-hd], [cx+hw, cy+hh, cz-hd],
            [0, 0, -1], wallColor
        );
        // Left wall (x-) — normal points -X
        addQuad(
            [cx-hw, cy-hh, cz-hd], [cx-hw, cy-hh, cz+hd],
            [cx-hw, cy+hh, cz+hd], [cx-hw, cy+hh, cz-hd],
            [-1, 0, 0], wallColor
        );
        // Right wall (x+) — normal points +X
        addQuad(
            [cx+hw, cy-hh, cz+hd], [cx+hw, cy-hh, cz-hd],
            [cx+hw, cy+hh, cz-hd], [cx+hw, cy+hh, cz+hd],
            [1, 0, 0], wallColor
        );
        // Floor — normal points +Y
        addQuad(
            [cx-hw, cy-hh, cz-hd], [cx+hw, cy-hh, cz-hd],
            [cx+hw, cy-hh, cz+hd], [cx-hw, cy-hh, cz+hd],
            [0, 1, 0], floorColor
        );
        // Ceiling — normal points -Y
        addQuad(
            [cx-hw, cy+hh, cz+hd], [cx+hw, cy+hh, cz+hd],
            [cx+hw, cy+hh, cz-hd], [cx-hw, cy+hh, cz-hd],
            [0, -1, 0], ceilColor
        );

        const vertexData = new Float32Array(verts);
        
        // Create VAO
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        
        // Position (3 floats) — location 0
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        // Normal (3 floats) — location 1
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
        // Color (3 floats) — location 2
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
        
        gl.bindVertexArray(null);
        
        this.rooms.push({
            vao,
            vbo,
            vertexCount: verts.length / 9,
            position: [cx, cy, cz],
            type: roomData.type,
            id: roomData.id
        });
        
        console.log(`[Renderer] Built room: ${roomData.id} (${roomData.type}) — ${verts.length/9} vertices`);
    },

    /**
     * Build all rooms from map data
     */
    buildAllRooms(mapData) {
        this.rooms = [];
        if (!mapData || !mapData.rooms) {
            console.warn('[Renderer] No rooms to build');
            return;
        }
        for (const room of mapData.rooms) {
            this.buildRoom(room);
        }
        console.log(`[Renderer] Built ${this.rooms.length} rooms total`);
    },

    /**
     * Add a light source
     */
    addLight(position, color, intensity) {
        this.lights.push({ position, color, intensity });
    },

    /**
     * Main render call
     */
    render(scene, camera) {
        const gl = this.gl;
        const prog = this.program;
        if (!gl || !prog) return;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        gl.useProgram(prog);

        // Set uniforms
        gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uProjection'), false, camera.projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uView'), false, camera.viewMatrix);
        gl.uniform3fv(gl.getUniformLocation(prog, 'uFogColor'), this.fog.color);
        gl.uniform1f(gl.getUniformLocation(prog, 'uFogNear'), this.fog.near);
        gl.uniform1f(gl.getUniformLocation(prog, 'uFogFar'), this.fog.far);

        // Set lights
        const lightPosLoc = gl.getUniformLocation(prog, 'uLightPos');
        const lightColorLoc = gl.getUniformLocation(prog, 'uLightColor');
        const lightIntensityLoc = gl.getUniformLocation(prog, 'uLightIntensity');
        
        if (this.lights.length > 0) {
            const light = this.lights[0];
            gl.uniform3fv(lightPosLoc, light.position);
            gl.uniform3fv(lightColorLoc, light.color);
            gl.uniform1f(lightIntensityLoc, light.intensity);
        } else {
            gl.uniform3fv(lightPosLoc, [0, 5, 0]);
            gl.uniform3fv(lightColorLoc, [1, 1, 1]);
            gl.uniform1f(lightIntensityLoc, 3.0);
        }

        this.stats.drawCalls = 0;
        this.stats.triangles = 0;

        // Draw each room
        for (const room of this.rooms) {
            gl.bindVertexArray(room.vao);
            gl.drawArrays(gl.TRIANGLES, 0, room.vertexCount);
            this.stats.drawCalls++;
            this.stats.triangles += room.vertexCount / 3;
        }

        gl.bindVertexArray(null);
    },

    dispose() {
        const gl = this.gl;
        if (!gl) return;
        for (const room of this.rooms) {
            gl.deleteBuffer(room.vbo);
            gl.deleteVertexArray(room.vao);
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
    
    // Lighting: diffuse from light position using pre-computed normal
    vec3 lightDir = normalize(uLightPos - aPosition);
    float diff = max(dot(aNormal, lightDir), 0.0);
    float ambient = 0.3;
    float dist = distance(uLightPos, aPosition);
    float attenuation = uLightIntensity / (1.0 + dist * 0.3);
    vColor = aColor * (ambient + diff * attenuation);
    
    // Fog
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
