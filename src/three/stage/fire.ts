import * as THREE from "three";

/*
 * A small particle fire: additive sprites that rise, shrink and cool from
 * yellow to red. `emit` sets how strongly it burns (0 = out); `jet` points it
 * along a direction for a fire lance.
 */

export interface Fire {
  object: THREE.Points;
  update(dt: number, emit: number): void;
  setJet(dir: THREE.Vector3 | null, speed?: number): void;
}

let sprite: THREE.Texture | null = null;
function flameSprite() {
  if (sprite) return sprite;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  sprite = new THREE.CanvasTexture(c);
  return sprite;
}

export function createFire(count = 220, radius = 0.12, size = 0.22): Fire {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const vel = new Float32Array(count * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({
    size,
    map: flameSprite(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const pts = new THREE.Points(g, m);
  pts.frustumCulled = false;
  let jet: THREE.Vector3 | null = null;
  let jetSpeed = 3;
  const hot = new THREE.Color("#fff2b0");
  const mid = new THREE.Color("#ff9a2e");
  const cold = new THREE.Color("#8a1e0a");
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) life[i] = -Math.random();
  const respawn = (i: number) => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = Math.sin(a) * r;
    if (jet) {
      const s = jetSpeed * (0.7 + Math.random() * 0.6);
      vel[i * 3] = jet.x * s + (Math.random() - 0.5) * 0.5;
      vel[i * 3 + 1] = jet.y * s + (Math.random() - 0.5) * 0.5;
      vel[i * 3 + 2] = jet.z * s + (Math.random() - 0.5) * 0.5;
    } else {
      vel[i * 3] = (Math.random() - 0.5) * 0.15;
      vel[i * 3 + 1] = 0.5 + Math.random() * 0.6;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    life[i] = 0;
  };
  return {
    object: pts,
    setJet(dir, speed = 3) {
      jet = dir ? dir.clone().normalize() : null;
      jetSpeed = speed;
    },
    update(dt, emit) {
      for (let i = 0; i < count; i++) {
        if (life[i]! < 0) {
          life[i]! += dt * 2;
          if (life[i]! >= 0) {
            if (Math.random() < emit) respawn(i);
            else life[i] = -Math.random() * 0.3;
          }
          col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0;
          continue;
        }
        life[i]! += dt * (jet ? 2.2 : 1.4);
        if (life[i]! >= 1) {
          life[i] = emit > 0 ? -Math.random() * 0.2 : -1;
          col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0;
          continue;
        }
        pos[i * 3]! += vel[i * 3]! * dt;
        pos[i * 3 + 1]! += vel[i * 3 + 1]! * dt;
        pos[i * 3 + 2]! += vel[i * 3 + 2]! * dt;
        // flames lick sideways a little
        pos[i * 3]! += Math.sin(life[i]! * 12 + i) * 0.002;
        const L = life[i]!;
        if (L < 0.4) c.copy(hot).lerp(mid, L / 0.4);
        else c.copy(mid).lerp(cold, (L - 0.4) / 0.6);
        const fade = (1 - L) * 0.9;
        col[i * 3] = c.r * fade;
        col[i * 3 + 1] = c.g * fade;
        col[i * 3 + 2] = c.b * fade;
      }
      g.getAttribute("position").needsUpdate = true;
      g.getAttribute("color").needsUpdate = true;
    },
  };
}
