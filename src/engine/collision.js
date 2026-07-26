/**
 * Mind Palace Lakehouse — Physics Engine
 * Simple AABB collision, raycasting, object physics
 */

const PhysicsEngine = {
    gravity: 9.8,
    friction: 0.85,
    restitution: 0.3,
    objects: [],
    walls: [],
    debug: false,

    init() {
        console.log('[Physics] Initializing...');
        this.objects = [];
        this.walls = [];
        return true;
    },

    addWall(min, max) {
        this.walls.push({ min: [...min], max: [...max] });
    },

    addObject(instance) {
        if (instance) {
            this.objects.push(instance);
        }
    },

    raycast(origin, direction, maxDist) {
        const dir = direction;
        const len = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2]);
        if (len === 0) return null;
        const nd = [dir[0]/len, dir[1]/len, dir[2]/len];
        
        let closestDist = maxDist || 10;
        let closestHit = null;

        // Check walls
        for (const wall of this.walls) {
            const t = this.rayAABB(origin, nd, wall.min, wall.max);
            if (t !== null && t < closestDist) {
                closestDist = t;
                closestHit = { point: this.pointOnRay(origin, nd, t), object: null, wall: wall };
            }
        }

        // Check objects
        for (const obj of this.objects) {
            if (!obj.def || !obj.def.size) continue;
            const halfSize = [obj.def.size[0]/2, obj.def.size[1]/2, obj.def.size[2]/2];
            const min = [obj.position[0] - halfSize[0], obj.position[1], obj.position[2] - halfSize[2]];
            const max = [obj.position[0] + halfSize[0], obj.position[1] + obj.def.size[1], obj.position[2] + halfSize[2]];
            const t = this.rayAABB(origin, nd, min, max);
            if (t !== null && t < closestDist) {
                closestDist = t;
                closestHit = { point: this.pointOnRay(origin, nd, t), object: obj };
            }
        }

        return closestHit;
    },

    rayAABB(origin, dir, min, max) {
        let tmin = -Infinity, tmax = Infinity;
        for (let i = 0; i < 3; i++) {
            if (Math.abs(dir[i]) < 1e-8) {
                if (origin[i] < min[i] || origin[i] > max[i]) return null;
            } else {
                let t1 = (min[i] - origin[i]) / dir[i];
                let t2 = (max[i] - origin[i]) / dir[i];
                if (t1 > t2) [t1, t2] = [t2, t1];
                tmin = Math.max(tmin, t1);
                tmax = Math.min(tmax, t2);
                if (tmin > tmax) return null;
            }
        }
        return tmin > 0 ? tmin : null;
    },

    pointOnRay(origin, dir, t) {
        return [origin[0] + dir[0]*t, origin[1] + dir[1]*t, origin[2] + dir[2]*t];
    },

    update(dt) {
        // Simple object physics
        for (const obj of this.objects) {
            if (obj.velocity && (obj.velocity[0] !== 0 || obj.velocity[1] !== 0 || obj.velocity[2] !== 0)) {
                obj.position[0] += obj.velocity[0] * dt;
                obj.position[2] += obj.velocity[2] * dt;
                obj.velocity[0] *= this.friction;
                obj.velocity[2] *= this.friction;
                if (Math.abs(obj.velocity[0]) < 0.01) obj.velocity[0] = 0;
                if (Math.abs(obj.velocity[2]) < 0.01) obj.velocity[2] = 0;
            }
        }
    }
};

window.PhysicsEngine = PhysicsEngine;
