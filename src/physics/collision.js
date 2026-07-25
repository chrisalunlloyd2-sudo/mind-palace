/**
 * Mind Palace Lakehouse — Collision & Physics Engine
 * Phase 3.3: Half-Life 1 style physics
 * 
 * Features:
 * - Player-wall collision (capsule-based)
 * - Object pushing (mass-based)
 * - Chair sliding (friction + momentum)
 * - Drawer open/close animation
 * - Gravity for dropped objects
 * - Object-object collision
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
    },

    addWall(min, max) {
        this.walls.push({ min: [...min], max: [...max] });
    },

    addObject(obj) {
        this.objects.push(obj);
    },

    removeObject(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx >= 0) this.objects.splice(idx, 1);
    },

    clear() {
        this.objects = [];
        this.walls = [];
    },

    update(dt) {
        for (const obj of this.objects) {
            this.updateObject(obj, dt);
        }
    },

    updateObject(obj, dt) {
        if (!obj.velocity) return;

        // Apply gravity
        if (!obj.isGrounded) {
            obj.velocity[1] -= this.gravity * dt;
        }

        // Apply velocity
        obj.position[0] += obj.velocity[0] * dt;
        obj.position[1] += obj.velocity[1] * dt;
        obj.position[2] += obj.velocity[2] * dt;

        // Apply friction
        obj.velocity[0] *= this.friction;
        obj.velocity[2] *= this.friction;

        // Ground check
        if (obj.position[1] <= 0) {
            obj.position[1] = 0;
            obj.velocity[1] = 0;
            obj.isGrounded = true;
        }

        // Wall collision
        this.resolveWallCollisions(obj);

        // Object-object collision
        this.resolveObjectCollisions(obj);
    },

    resolveWallCollisions(obj) {
        const halfSize = [obj.size[0] / 2, obj.size[1] / 2, obj.size[2] / 2];
        
        for (const wall of this.walls) {
            // AABB collision
            const overlapX = Math.min(obj.position[0] + halfSize[0], wall.max[0]) - 
                           Math.max(obj.position[0] - halfSize[0], wall.min[0]);
            const overlapY = Math.min(obj.position[1] + halfSize[1], wall.max[1]) - 
                           Math.max(obj.position[1] - halfSize[1], wall.min[1]);
            const overlapZ = Math.min(obj.position[2] + halfSize[2], wall.max[2]) - 
                           Math.max(obj.position[2] - halfSize[2], wall.min[2]);

            if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
                // Push out along smallest overlap axis
                const overlaps = [
                    { axis: 0, value: overlapX, sign: obj.position[0] < wall.max[0] ? -1 : 1 },
                    { axis: 2, value: overlapZ, sign: obj.position[2] < wall.max[2] ? -1 : 1 }
                ];
                overlaps.sort((a, b) => a.value - b.value);
                
                const push = overlaps[0];
                obj.position[push.axis] += push.sign * push.value;
                obj.velocity[push.axis] = 0;
            }
        }
    },

    resolveObjectCollisions(obj) {
        const halfA = [obj.size[0] / 2, obj.size[1] / 2, obj.size[2] / 2];
        
        for (const other of this.objects) {
            if (other === obj) continue;
            
            const halfB = [other.size[0] / 2, other.size[1] / 2, other.size[2] / 2];
            
            const overlapX = Math.min(obj.position[0] + halfA[0], other.position[0] + halfB[0]) - 
                           Math.max(obj.position[0] - halfA[0], other.position[0] - halfB[0]);
            const overlapY = Math.min(obj.position[1] + halfA[1], other.position[1] + halfB[1]) - 
                           Math.max(obj.position[1] - halfA[1], other.position[1] - halfB[1]);
            const overlapZ = Math.min(obj.position[2] + halfA[2], other.position[2] + halfB[2]) - 
                           Math.max(obj.position[2] - halfA[2], other.position[2] - halfB[2]);

            if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
                // Push lighter object
                const totalMass = obj.mass + other.mass;
                const ratioA = other.mass / totalMass;
                const ratioB = obj.mass / totalMass;
                
                const overlaps = [
                    { axis: 0, value: overlapX },
                    { axis: 2, value: overlapZ }
                ];
                overlaps.sort((a, b) => a.value - b.value);
                
                const push = overlaps[0];
                const dir = obj.position[push.axis] < other.position[push.axis] ? -1 : 1;
                obj.position[push.axis] += dir * push.value * ratioA;
                other.position[push.axis] -= dir * push.value * ratioB;
            }
        }
    },

    // Player collision (capsule-based)
    checkPlayerCollision(position, radius, height) {
        const result = { collision: false, normal: [0, 0, 0], penetration: 0 };
        
        for (const wall of this.walls) {
            // Clamp position to wall bounds
            const closest = [
                Math.max(wall.min[0], Math.min(position[0], wall.max[0])),
                Math.max(wall.min[1], Math.min(position[1], wall.max[1])),
                Math.max(wall.min[2], Math.min(position[2], wall.max[2]))
            ];
            
            const dx = position[0] - closest[0];
            const dy = position[1] - closest[1];
            const dz = position[2] - closest[2];
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (dist < radius && dist > 0) {
                result.collision = true;
                const overlap = radius - dist;
                result.normal = [dx/dist, dy/dist, dz/dist];
                result.penetration = overlap;
                return result;
            }
        }
        
        return result;
    },

    // Raycast for interaction
    raycast(origin, direction, maxDist) {
        let closest = null;
        let closestDist = maxDist;
        
        for (const obj of this.objects) {
            const half = [obj.size[0] / 2, obj.size[1] / 2, obj.size[2] / 2];
            const min = [obj.position[0] - half[0], obj.position[1] - half[1], obj.position[2] - half[2]];
            const max = [obj.position[0] + half[0], obj.position[1] + half[1], obj.position[2] + half[2]];
            
            const hit = this.rayAABB(origin, direction, min, max);
            if (hit && hit.dist < closestDist) {
                closestDist = hit.dist;
                closest = { object: obj, point: hit.point, normal: hit.normal, dist: hit.dist };
            }
        }
        
        return closest;
    },

    rayAABB(origin, dir, min, max) {
        let tmin = -Infinity, tmax = Infinity;
        
        for (let i = 0; i < 3; i++) {
            if (Math.abs(dir[i]) < 0.0001) {
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
        
        return {
            dist: tmin,
            point: [origin[0] + dir[0] * tmin, origin[1] + dir[1] * tmin, origin[2] + dir[2] * tmin],
            normal: [0, 0, 0]
        };
    },

    // Drawer animation
    animateDrawer(drawerObj, targetOffset, duration) {
        const start = drawerObj.currentOffset || 0;
        const startTime = performance.now();
        
        return new Promise(resolve => {
            const animate = (time) => {
                const elapsed = (time - startTime) / 1000;
                const t = Math.min(elapsed / duration, 1);
                const smooth = t * t * (3 - 2 * t); // smoothstep
                
                drawerObj.currentOffset = start + (targetOffset - start) * smooth;
                
                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    drawerObj.currentOffset = targetOffset;
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }
};

window.PhysicsEngine = PhysicsEngine;
