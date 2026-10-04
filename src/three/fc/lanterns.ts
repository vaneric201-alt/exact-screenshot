import * as THREE from "three";
import { mergeSimple } from "./builders";

/*
 * Red palace lanterns (宫灯) hung between the front columns of the buildings
 * the walk-through visits, lit at sunset: a silk drum on gold caps with a
 * tassel, emissive so the bloom pass makes them glow. A few real lights follow
 * the current shot so the lanterns also light the columns and paving near them.
 *
 * The rows are [x-centre, eave height, front z, width, bays] for each hall,
 * matching the halls built in fc/layout.ts.
 */

const ROWS: [number, number, number, number, number][] = [
  [0, 13.05, 321.6, 44, 9], // Gate of Supreme Harmony
  [0, 19.2, 65.2, 60, 11], // Hall of Supreme Harmony
  [0, 17.2, -6.4, 22, 5], // Hall of Middle Harmony
  [0, 17.6, -70.4, 44, 9], // Hall of Preserving Harmony
  [0, 10.1, -170, 36, 5], // Gate of Heavenly Purity
  [0, 11.5, -214.4, 46, 9], // Palace of Heavenly Purity
  [0, 8.6, -260.6, 14, 3], // Hall of Union
  [0, 10.9, -300.4, 42, 9], // Palace of Earthly Tranquility
  [0, 8.4, -416.4, 30, 5], // Hall of Imperial Peace
];

function lanternGeo() {
  // silk body: a barrel from a lathe, then gold cap rings and a tassel
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    prof.push(new THREE.Vector2(0.42 * Math.sin(Math.PI * (0.12 + 0.76 * t)) + 0.08, -0.5 + t));
  }
  const body = new THREE.LatheGeometry(prof, 16);
  return body;
}

function capGeo() {
  const parts: THREE.BufferGeometry[] = [];
  const top = new THREE.CylinderGeometry(0.3, 0.34, 0.12, 16);
  top.translate(0, 0.56, 0);
  const bot = new THREE.CylinderGeometry(0.34, 0.3, 0.12, 16);
  bot.translate(0, -0.56, 0);
  const hook = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6);
  hook.translate(0, 0.92, 0);
  const tassel = new THREE.ConeGeometry(0.14, 0.55, 10);
  tassel.rotateX(Math.PI);
  tassel.translate(0, -0.9, 0);
  parts.push(top, bot, hook, tassel);
  return mergeSimple(parts);
}

export function buildLanterns() {
  const group = new THREE.Group();
  const spots: THREE.Vector3[] = [];
  for (const [x0, eave, z, w, bays] of ROWS) {
    for (let i = 0; i < bays; i++) {
      const x = x0 - w / 2 + ((i + 0.5) * w) / bays;
      spots.push(new THREE.Vector3(x, eave - 1.9, z + 0.6));
    }
  }
  const silk = new THREE.MeshStandardMaterial({ color: "#c2241a", emissive: new THREE.Color("#ff4a24"), emissiveIntensity: 2.2, roughness: 0.6 });
  const gold = new THREE.MeshStandardMaterial({ color: "#d9a441", metalness: 0.9, roughness: 0.35, emissive: new THREE.Color("#5a3a10"), emissiveIntensity: 0.4 });
  const body = new THREE.InstancedMesh(lanternGeo(), silk, spots.length);
  const caps = new THREE.InstancedMesh(capGeo(), gold, spots.length);
  const m = new THREE.Matrix4();
  spots.forEach((p, i) => {
    m.makeScale(1.25, 1.35, 1.25).setPosition(p);
    body.setMatrixAt(i, m);
    caps.setMatrixAt(i, m);
  });
  body.computeBoundingSphere();
  caps.computeBoundingSphere();
  group.add(body, caps);

  // three warm lights travel to whichever row is nearest the camera
  const lights = [0, 1, 2].map(() => {
    const l = new THREE.PointLight("#ff8a4a", 0, 26, 2);
    group.add(l);
    return l;
  });
  const near: { d: number; p: THREE.Vector3 }[] = [];
  return {
    group,
    /** Move the lights to the lanterns closest to the camera; `on` (0–1) dims them in daylight. */
    update(cam: THREE.Vector3, time: number, on = 1) {
      near.length = 0;
      for (const p of spots) near.push({ d: p.distanceToSquared(cam), p });
      near.sort((a, b) => a.d - b.d);
      lights.forEach((l, i) => {
        const n = near[i];
        if (!n) return;
        l.position.copy(n.p);
        l.intensity = on * (90 + Math.sin(time * 7 + i * 2) * 6);
      });
      silk.emissiveIntensity = 1.4 + on * 1.2;
    },
  };
}
