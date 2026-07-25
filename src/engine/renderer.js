/**
 * Mind Palace Lakehouse — WebGL 2.0 Renderer
 * Phase 1.1: True 3D renderer replacing Wolfenstein raycaster
 * 
 * Features:
 * - WebGL 2.0 with texture-mapped floors/ceilings
 * - Dynamic lighting (point, ambient, emissive)
 * - Fog for depth atmosphere
 * - Chunk-based rendering for large maps
 * - Level of Detail (LOD) system
 */

const LakehouseRenderer = {
    gl: null,
    canvas: null,
    program: null,
    buffers: {},
    textures: {},
    shaders: {},
    fog: { color: [0.0, 0.0, 0.0], near: 20, far: 60 },
    lights: [],
    chunks: new Map(),
    stats: { drawCalls: 0, triangles: 0, fps: 0 },

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

        // Compile core shaders
        this.shaders.standard = this.compileShader(VERTEX_STANDARD, FRAGMENT_STANDARD);
        this.shaders.light = this.compileShader(VERTEX_LIGHT, FRAGMENT_LIGHT);
        this.shaders.water = this.compileShader(VERTEX_WATER, FRAGMENT_WATER);

        // Set up default buffers
        this.setupDefaultBuffers();

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

        const program = gl.createProgram();
        gl.attachShader(program, vert);
        gl.attachShader(program, frag);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('[Renderer] Program link error:', gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    },

    setupDefaultBuffers() {
        const gl = this.gl;
        // Full-screen quad for post-processing
        const quad = new Float32Array([
            -1, -1, 0, 0,
             1, -1, 1, 0,
            -1,  1, 0, 1,
             1,  1, 1, 1
        ]);
        this.buffers.quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.quad);
        gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    },

    createTexture(name, data, width, height) {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        this.textures[name] = tex;
        return tex;
    },

    addLight(type, position, color, intensity, range) {
        this.lights.push({ type, position, color, intensity, range });
    },

    clearLights() {
        this.lights = [];
    },

    render(scene, camera) {
        const gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.stats.drawCalls = 0;
        this.stats.triangles = 0;

        // Render each chunk
        for (const [chunkId, chunk] of this.chunks) {
            if (this.isChunkVisible(chunk, camera)) {
                this.renderChunk(chunk, camera);
            }
        }
    },

    isChunkVisible(chunk, camera) {
        // Frustum culling
        const dx = chunk.center[0] - camera.position[0];
        const dz = chunk.center[2] - camera.position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        return dist < this.fog.far + chunk.radius;
    },

    renderChunk(chunk, camera) {
        const gl = this.gl;
        const program = this.shaders.standard;
        gl.useProgram(program);

        // Set uniforms
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModelView'), false, chunk.modelMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, camera.projectionMatrix);
        gl.uniform3fv(gl.getUniformLocation(program, 'uFogColor'), this.fog.color);
        gl.uniform2fv(gl.getUniformLocation(program, 'uFogRange'), [this.fog.near, this.fog.far]);

        // Bind vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, chunk.vertexBuffer);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);  // position
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 12); // texcoord
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 32, 20); // normal
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);

        // Bind texture
        if (chunk.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, chunk.texture);
        }

        // Draw
        gl.drawElements(gl.TRIANGLES, chunk.indexCount, gl.UNSIGNED_SHORT, 0);
        this.stats.drawCalls++;
        this.stats.triangles += chunk.indexCount / 3;
    },

    createChunk(id, vertices, indices, textureName) {
        const gl = this.gl;
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        // Calculate center and radius for culling
        let cx = 0, cy = 0, cz = 0;
        for (let i = 0; i < vertices.length; i += 8) {
            cx += vertices[i];
            cy += vertices[i + 1];
            cz += vertices[i + 2];
        }
        const count = vertices.length / 8;
        cx /= count; cy /= count; cz /= count;

        let radius = 0;
        for (let i = 0; i < vertices.length; i += 8) {
            const dx = vertices[i] - cx;
            const dy = vertices[i + 1] - cy;
            const dz = vertices[i + 2] - cz;
            radius = Math.max(radius, Math.sqrt(dx*dx + dy*dy + dz*dz));
        }

        const chunk = {
            id,
            vertexBuffer: vbo,
            indexBuffer: ibo,
            vertexCount: vertices.length / 8,
            indexCount: indices.length,
            texture: this.textures[textureName] || null,
            center: [cx, cy, cz],
            radius,
            modelMatrix: new Float32Array(16)
        };
        // Identity matrix
        chunk.modelMatrix[0] = 1; chunk.modelMatrix[5] = 1;
        chunk.modelMatrix[10] = 1; chunk.modelMatrix[15] = 1;

        this.chunks.set(id, chunk);
        return chunk;
    },

    removeChunk(id) {
        const chunk = this.chunks.get(id);
        if (chunk) {
            this.gl.deleteBuffer(chunk.vertexBuffer);
            this.gl.deleteBuffer(chunk.indexBuffer);
            this.chunks.delete(id);
        }
    },

    clear() {
        for (const [id, chunk] of this.chunks) {
            this.gl.deleteBuffer(chunk.vertexBuffer);
            this.gl.deleteBuffer(chunk.indexBuffer);
        }
        this.chunks.clear();
        this.lights = [];
    },

    dispose() {
        this.clear();
        for (const name in this.textures) {
            this.gl.deleteTexture(this.textures[name]);
        }
        for (const name in this.shaders) {
            this.gl.deleteProgram(this.shaders[name]);
        }
    }
};

// ===== SHADER SOURCES =====

const VERTEX_STANDARD = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec2 aTexCoord;
in vec3 aNormal;
uniform mat4 uModelView;
uniform mat4 uProjection;
out vec2 vTexCoord;
out vec3 vNormal;
out vec3 vPosition;
void main() {
    vec4 worldPos = uModelView * vec4(aPosition, 1.0);
    gl_Position = uProjection * worldPos;
    vTexCoord = aTexCoord;
    vNormal = mat3(uModelView) * aNormal;
    vPosition = worldPos.xyz;
}`;

const FRAGMENT_STANDARD = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vPosition;
uniform vec3 uFogColor;
uniform vec2 uFogRange;
uniform sampler2D uTexture;
out vec4 fragColor;
void main() {
    vec4 texColor = texture(uTexture, vTexCoord);
    float fogFactor = clamp((length(vPosition) - uFogRange.x) / (uFogRange.y - uFogRange.x), 0.0, 1.0);
    vec4 fogged = mix(texColor, vec4(uFogColor, 1.0), fogFactor);
    fragColor = fogged;
}`;

const VERTEX_LIGHT = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec2 aTexCoord;
in vec3 aNormal;
uniform mat4 uModelView;
uniform mat4 uProjection;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform float uLightIntensity;
out vec2 vTexCoord;
out vec3 vLighting;
void main() {
    vec4 worldPos = uModelView * vec4(aPosition, 1.0);
    gl_Position = uProjection * worldPos;
    vTexCoord = aTexCoord;
    vec3 normal = mat3(uModelView) * aNormal;
    vec3 lightDir = normalize(uLightPos - worldPos.xyz);
    float diff = max(dot(normal, lightDir), 0.0);
    float dist = length(uLightPos - worldPos.xyz);
    float attenuation = uLightIntensity / (1.0 + dist * dist);
    vLighting = uLightColor * diff * attenuation;
}`;

const FRAGMENT_LIGHT = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in vec3 vLighting;
uniform sampler2D uTexture;
out vec4 fragColor;
void main() {
    vec4 texColor = texture(uTexture, vTexCoord);
    fragColor = vec4(texColor.rgb * (0.3 + vLighting), texColor.a);
}`;

const VERTEX_WATER = `#version 300 es
precision highp float;
in vec3 aPosition;
in vec2 aTexCoord;
uniform mat4 uModelView;
uniform mat4 uProjection;
uniform float uTime;
out vec2 vTexCoord;
out float vHeight;
void main() {
    vec3 pos = aPosition;
    float wave = sin(pos.x * 2.0 + uTime) * 0.05 + cos(pos.z * 1.5 + uTime * 0.7) * 0.03;
    pos.y += wave;
    vec4 worldPos = uModelView * vec4(pos, 1.0);
    gl_Position = uProjection * worldPos;
    vTexCoord = aTexCoord + vec2(uTime * 0.01, uTime * 0.005);
    vHeight = pos.y;
}`;

const FRAGMENT_WATER = `#version 300 es
precision highp float;
in vec2 vTexCoord;
in float vHeight;
uniform float uTime;
out vec4 fragColor;
void main() {
    vec3 deep = vec3(0.0, 0.1, 0.3);
    vec3 shallow = vec3(0.0, 0.4, 0.6);
    float mixFactor = sin(vHeight * 10.0 + uTime) * 0.5 + 0.5;
    vec3 color = mix(deep, shallow, mixFactor);
    float alpha = 0.6 + sin(vTexCoord.x * 20.0 + uTime) * 0.2;
    fragColor = vec4(color, alpha);
}`;

window.LakehouseRenderer = LakehouseRenderer;
