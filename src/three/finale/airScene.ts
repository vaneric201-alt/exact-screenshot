import * as THREE from "three";
import { buildAAM, buildJ20, buildTargetDrone } from "../models/military";
import { loadModel, upgrade } from "../models/loaded";
import { canvasTex, mottle } from "../stage/textures";
import { createFire } from "../stage/fire";
import { rng } from "../stage/stage";
import { AIR_BEATS } from "./modernPhases";

/*
 * A low-level canyon run in the manner of a jet film: two J-20s race down a
 * real canyon (a downloaded terrain model; a hand-made one stands in while it
 * loads) with the camera chasing; the leader drops an air-to-air missile,
 * which lights its motor and pulls ahead — the camera rides beside it while the
 * page shows its card — and strikes a target drone in a fireball.
 * k (0–1) is how far the scene has played.
 */

/** The beats: missile release, close-up on the missile, impact (shared with the page). */
export const AIR = AIR_BEATS;

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** The line the jets follow: the canyon floor's centre and height along x. */
interface Path {
  x0: number;
  len: number;
  z(x: number): number;
  floor(x: number): number;
}

/** The stand-in canyon, used until the real terrain has loaded. */
function canyonGeo() {
  const L = 3600;
  const Wd = 900;
  const g = new THREE.PlaneGeometry(L, Wd, 360, 120);
  g.rotateX(-Math.PI / 2);
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const n = (x: number, z: number) =>
    Math.sin(x * 0.011 + Math.sin(z * 0.02)) * 0.5 + Math.sin(x * 0.031 + z * 0.017) * 0.3 + Math.sin(x * 0.073 - z * 0.05) * 0.2;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const centre = Math.sin(x * 0.004) * 40;
    const d = Math.abs(z - centre);
    const wall = Math.max(0, d - 55);
    let y = Math.min(170, wall * wall * 0.035 + wall * 0.6) + n(x, z) * (6 + wall * 0.12);
    y += Math.max(0, n(x * 0.5, z * 0.5)) * 10 * (1 - Math.min(1, wall / 30));
    pos.setY(i, y);
    const band = Math.sin(y * 0.25 + n(x, z) * 2) * 0.5 + 0.5;
    c.setHSL(0.05 + band * 0.025, 0.45 + band * 0.1, 0.32 + band * 0.16 + Math.min(0.12, y / 900));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * The real canyon: a terrain tile whose valley runs corner to corner, turned so
 * it runs along x. A height grid built from its vertices finds the valley
 * floor's centre line for the flight path.
 */
const TILE = 900;
async function realCanyon(): Promise<{ object: THREE.Object3D; path: Path }> {
  const src = await loadModel("canyon");
  const object = src.clone(true);
  // height grid over the fitted tile ([-0.5, 0.5] in x and z), highest surface per cell
  const N = 160;
  const grid = new Float32Array(N * N).fill(-1);
  object.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  object.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const p = m.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      const gx = Math.min(N - 1, Math.max(0, Math.floor((v.x + 0.5) * N)));
      const gz = Math.min(N - 1, Math.max(0, Math.floor((v.z + 0.5) * N)));
      const k = gz * N + gx;
      if (v.y > grid[k]!) grid[k] = v.y;
    }
  });
  // fill empty cells from their neighbours
  for (let pass = 0; pass < 4; pass++)
    for (let gz = 0; gz < N; gz++)
      for (let gx = 0; gx < N; gx++) {
        const k = gz * N + gx;
        if (grid[k]! >= 0) continue;
        let s = 0;
        let c = 0;
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const x = gx + dx;
          const z = gz + dz;
          if (x < 0 || z < 0 || x >= N || z >= N) continue;
          const h = grid[z * N + x]!;
          if (h >= 0) {
            s += h;
            c++;
          }
        }
        if (c) grid[k] = s / c;
      }
  const heightLocal = (lx: number, lz: number) => {
    const gx = Math.min(N - 1, Math.max(0, Math.floor((lx + 0.5) * N)));
    const gz = Math.min(N - 1, Math.max(0, Math.floor((lz + 0.5) * N)));
    return Math.max(0, grid[gz * N + gx]!);
  };
  // the valley runs from (-x, +z) to (+x, -z) in the tile: turn it 45° to run along +x
  const ROT = -Math.PI / 4;
  object.scale.setScalar(TILE);
  object.rotation.y = ROT;
  object.position.x = TILE * 0.7;
  const cos = Math.cos(-ROT);
  const sin = Math.sin(-ROT);
  const heightAt = (x: number, z: number) => {
    // world → tile: undo the offset, the turn and the scale
    const wx = (x - object.position.x) / TILE;
    const wz = z / TILE;
    const lx = wx * cos + wz * sin;
    const lz = -wx * sin + wz * cos;
    if (Math.abs(lx) > 0.5 || Math.abs(lz) > 0.5) return TILE * 0.5;
    return heightLocal(lx, lz) * TILE;
  };
  // walk along x, at each step finding the lowest point near the last one
  const x0 = TILE * 0.08;
  const x1 = TILE * 1.32;
  const STEPS = 140;
  const xs: number[] = [];
  const zs: number[] = [];
  const ys: number[] = [];
  let zc = 0;
  for (let i = 0; i <= STEPS; i++) {
    const x = x0 + ((x1 - x0) * i) / STEPS;
    const span = i === 0 ? TILE * 0.3 : TILE * 0.06;
    let best = zc;
    let bestH = Infinity;
    for (let j = -30; j <= 30; j++) {
      const z = zc + (j / 30) * span;
      // prefer the middle of the floor: the height plus a little pull toward the previous line
      const h = heightAt(x, z) + Math.abs(z - zc) * 0.05;
      if (h < bestH) {
        bestH = h;
        best = z;
      }
    }
    zc = best;
    xs.push(x);
    zs.push(zc);
    // clearance: the highest ground within a short reach either side, so a wing never clips a ledge
    let hi = 0;
    for (let j = -3; j <= 3; j++) hi = Math.max(hi, heightAt(x, zc + j * 4));
    ys.push(hi);
  }
  // smooth the line so the jets swing through the bends rather than jitter
  const smoothArr = (a: number[], r: number) =>
    a.map((_, i) => {
      let s = 0;
      let c = 0;
      for (let j = -r; j <= r; j++) {
        const v2 = a[i + j];
        if (v2 === undefined) continue;
        s += v2;
        c++;
      }
      return s / c;
    });
  const zS = smoothArr(smoothArr(zs, 6), 6);
  const yS = smoothArr(ys.map((y, i) => Math.max(y, ys[i - 1] ?? y, ys[i + 1] ?? y)), 5);
  const sample = (arr: number[], x: number) => {
    const f = Math.min(STEPS, Math.max(0, ((x - x0) / (x1 - x0)) * STEPS));
    const i = Math.floor(f);
    const t = f - i;
    return arr[i]! + (arr[Math.min(STEPS, i + 1)]! - arr[i]!) * t;
  };
  return { object, path: { x0, len: x1 - x0, z: (x) => sample(zS, x), floor: (x) => sample(yS, x) } };
}

export function createAirScene(env: THREE.Texture) {
  const scene = new THREE.Scene();
  scene.environment = env;
  scene.environmentIntensity = 0.95;
  scene.background = canvasTex(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#2f6fb8");
    g.addColorStop(0.5, "#8fbbe0");
    g.addColorStop(0.72, "#efd8b0");
    g.addColorStop(1, "#e8b27c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  scene.fog = new THREE.Fog("#e4cfae", 300, 1700);
  const sun = new THREE.DirectionalLight("#fff0d6", 3.6);
  sun.position.set(-300, 600, 250);
  scene.add(sun, new THREE.HemisphereLight("#cfe0f4", "#a8714a", 1.5));

  // the stand-in canyon, with a rock texture over its strata colours
  const rock = canvasTex(
    1024,
    1024,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#b8a08a";
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, "rgba(60,40,30,1)", 0.5, 8, 5);
      mottle(ctx, w, h, r, "rgba(255,240,220,1)", 0.25, 12, 4);
    },
    991,
    true,
    { normal: 3, rough: [0.85, 1] },
  );
  rock.repeat.set(60, 15);
  const terrain = new THREE.Mesh(
    canyonGeo(),
    new THREE.MeshStandardMaterial({ vertexColors: true, map: rock, normalMap: rock.userData["normalMap"] as THREE.Texture, roughness: 0.95 }),
  );
  terrain.position.x = 1500;
  scene.add(terrain);
  let path: Path = {
    x0: 0,
    len: 2600,
    z: (x) => Math.sin((x - 1500) * 0.004) * 40,
    floor: () => 0,
  };
  // swap in the real canyon when it arrives
  realCanyon()
    .then((c) => {
      scene.remove(terrain);
      scene.add(c.object);
      path = c.path;
    })
    .catch(() => {});

  // clouds above the rim
  const puff = canvasTex(128, 128, (ctx, w, h, r) => {
    for (let k = 0; k < 22; k++) {
      const x = 30 + r() * 68;
      const y = 40 + r() * 50;
      const rr = 16 + r() * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, "rgba(255,255,255,0.5)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
  const rr = rng(9);
  for (let k = 0; k < 60; k++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, color: "#fff4e8", transparent: true, opacity: 0.75, depthWrite: false }));
    s.position.set(-200 + rr() * 1800, 430 + rr() * 200, -700 + rr() * 1400);
    s.scale.setScalar(140 + rr() * 220);
    scene.add(s);
  }

  // the jets: hand-built stand-ins, replaced by the real J-20 model when it loads
  const lead = buildJ20();
  const wing = buildJ20();
  upgrade(lead, "j20");
  upgrade(wing, "j20");
  lead.scale.setScalar(3.2);
  wing.scale.setScalar(3.2);
  scene.add(lead, wing);
  const burners = [lead, wing].map((j) => {
    const f = createFire(140, 0.1, 0.55);
    f.setJet(new THREE.Vector3(-1, 0, 0), 11);
    scene.add(f.object);
    return { j, f };
  });
  // wingtip vapour trails
  const VAP = 70;
  const vapours = [0, 1, 2, 3].map(() => {
    const pos = new Float32Array(VAP * 3);
    const geo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55 }));
    line.frustumCulled = false;
    scene.add(line);
    return { pos, geo };
  });
  const tip = new THREE.Vector3();

  // missile, target and explosion
  const aam = buildAAM();
  aam.scale.setScalar(0.95);
  scene.add(aam);
  const motor = createFire(380, 0.08, 1.4);
  motor.setJet(new THREE.Vector3(-1, 0, 0), 40);
  scene.add(motor.object);
  const smokeTex = canvasTex(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  const TRAIL = 160;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ size: 3.6, map: smokeTex, color: "#ece7df", transparent: true, opacity: 0.6, depthWrite: false }));
  trail.frustumCulled = false;
  scene.add(trail);
  const drone = buildTargetDrone();
  drone.scale.setScalar(3);
  scene.add(drone);
  const fireball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.MeshBasicMaterial({ color: "#ffd27a", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  const flashL = new THREE.PointLight("#ffb050", 0, 400, 1.5);
  scene.add(fireball, flashL);
  // the explosion: hot fragments flung out, cooling from white through orange to smoke
  const BOOM = 900;
  const boomDir = new Float32Array(BOOM * 3);
  const boomSpd = new Float32Array(BOOM);
  for (let i = 0; i < BOOM; i++) {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    boomDir[i * 3] = Math.cos(a) * r;
    boomDir[i * 3 + 1] = u;
    boomDir[i * 3 + 2] = Math.sin(a) * r;
    boomSpd[i] = 0.35 + Math.random() * 0.65;
  }
  const boomPos = new Float32Array(BOOM * 3);
  const boomCol = new Float32Array(BOOM * 3);
  const boomGeo = new THREE.BufferGeometry();
  boomGeo.setAttribute("position", new THREE.BufferAttribute(boomPos, 3));
  boomGeo.setAttribute("color", new THREE.BufferAttribute(boomCol, 3));
  const boom = new THREE.Points(boomGeo, new THREE.PointsMaterial({ size: 7, map: smokeTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  boom.frustumCulled = false;
  scene.add(boom);
  const smokeMat = new THREE.SpriteMaterial({ map: smokeTex, color: "#3a2e26", transparent: true, opacity: 0, depthWrite: false });
  const smokes = Array.from({ length: 14 }, () => {
    const sp = new THREE.Sprite(smokeMat);
    sp.userData["d"] = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.6, Math.random() - 0.5).normalize();
    scene.add(sp);
    return sp;
  });

  const camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.5, 4000);
  const tmp = new THREE.Vector3();
  const look = new THREE.Vector3();
  const ALT = 30;
  // the jets' path: down the canyon floor, banking with its bends
  const jetAt = (k: number, lane: number, t: number, out: THREE.Vector3) => {
    const x = path.x0 + k * path.len * 0.86;
    out.set(x, path.floor(x) + ALT + Math.sin(k * 9 + lane) * 3 + lane * 3, path.z(x) + lane * 12 + Math.sin(t * 0.8 + lane) * 1.2);
    return out;
  };

  return {
    scene,
    camera,
    update(k: number, t: number, dt: number) {
      const L = jetAt(k, 0, t, new THREE.Vector3());
      const Wg = jetAt(k - 0.006, 1, t, new THREE.Vector3());
      const ahead = jetAt(k + 0.004, 0, t, new THREE.Vector3());
      const behind = jetAt(k - 0.004, 0, t, new THREE.Vector3());
      // bank into the bends: how fast the heading turns
      const turn = Math.atan2(ahead.z - L.z, ahead.x - L.x) - Math.atan2(L.z - behind.z, L.x - behind.x);
      lead.position.copy(L);
      lead.lookAt(ahead);
      lead.rotateY(-Math.PI / 2);
      lead.rotateX(THREE.MathUtils.clamp(-turn * 18, -0.9, 0.9));
      wing.position.copy(Wg);
      wing.quaternion.copy(lead.quaternion);
      burners.forEach(({ j, f }) => {
        f.object.position.copy(j.position).add(new THREE.Vector3(-3.4, -0.04, 0).applyQuaternion(j.quaternion));
        f.update(dt, 1);
      });
      vapours.forEach((v, i) => {
        const j = i < 2 ? lead : wing;
        tip.set(-1.6, 0.05, i % 2 ? 2.2 : -2.2).applyQuaternion(j.quaternion).add(j.position);
        v.pos.copyWithin(3, 0, (VAP - 1) * 3);
        v.pos[0] = tip.x;
        v.pos[1] = tip.y;
        v.pos[2] = tip.z;
        v.geo.getAttribute("position").needsUpdate = true;
      });

      // the missile: drops from the bay, lights, overtakes and runs ahead to the drone
      const rel = AIR.release;
      const mk = Math.max(0, k - rel);
      const dropT = Math.min(1, mk / 0.03);
      const boost = Math.max(0, mk - 0.03);
      const droneX = path.x0 + (AIR.hit + 0.004) * path.len * 0.86 + 150;
      const dronePos = new THREE.Vector3(droneX - (1 - smooth((k - 0.3) / 0.5)) * 40, path.floor(droneX) + ALT + 16, path.z(droneX) - 6);
      drone.position.copy(dronePos);
      drone.rotation.y = Math.PI;
      drone.visible = k < AIR.hit + 0.01;
      aam.visible = k >= rel && k < AIR.hit;
      if (aam.visible) {
        const from = new THREE.Vector3(L.x + 2, L.y - 1.5 - dropT * 2.5, L.z);
        const u = Math.min(1, boost / (AIR.hit - rel - 0.03));
        aam.position.lerpVectors(from, dronePos, u * u * (1.6 - 0.6 * u));
        aam.lookAt(dronePos);
        aam.rotateY(-Math.PI / 2);
      }
      motor.object.position.copy(aam.position).add(new THREE.Vector3(-1.9, 0, 0).applyQuaternion(aam.quaternion));
      motor.update(dt, aam.visible && dropT >= 1 ? 1 : 0);
      trailPos.copyWithin(3, 0, (TRAIL - 1) * 3);
      trailPos[0] = motor.object.position.x;
      trailPos[1] = motor.object.position.y;
      trailPos[2] = motor.object.position.z;
      trailGeo.getAttribute("position").needsUpdate = true;
      trail.visible = aam.visible && dropT >= 1;

      // impact
      const b = Math.min(1, Math.max(0, (k - AIR.hit) / 0.1));
      fireball.position.copy(dronePos);
      fireball.scale.setScalar(2 + Math.sqrt(b) * 16);
      (fireball.material as THREE.MeshBasicMaterial).opacity = b > 0 ? Math.pow(1 - b, 2) * 0.9 : 0;
      flashL.position.copy(dronePos);
      flashL.intensity = b > 0 ? 4e5 * Math.pow(1 - b, 2) : 0;
      const spread = (1 - Math.exp(-b * 5)) * 38;
      const c = new THREE.Color();
      for (let i = 0; i < BOOM; i++) {
        const d = spread * boomSpd[i]!;
        boomPos[i * 3] = dronePos.x + boomDir[i * 3]! * d;
        boomPos[i * 3 + 1] = dronePos.y + boomDir[i * 3 + 1]! * d - b * b * 10 * boomSpd[i]!;
        boomPos[i * 3 + 2] = dronePos.z + boomDir[i * 3 + 2]! * d;
        // white-hot, then orange, then a dull red ember fading out
        const heat = Math.max(0, 1 - b * (1.4 + boomSpd[i]!));
        c.setRGB(1, 0.35 + heat * 0.6, heat * 0.5).multiplyScalar(b > 0 ? Math.max(0, 1 - b * 1.1) : 0);
        boomCol[i * 3] = c.r;
        boomCol[i * 3 + 1] = c.g;
        boomCol[i * 3 + 2] = c.b;
      }
      boomGeo.getAttribute("position").needsUpdate = true;
      boomGeo.getAttribute("color").needsUpdate = true;
      smokeMat.opacity = b > 0.05 ? Math.min(0.75, (b - 0.05) * 3) * (1 - b * 0.4) : 0;
      smokes.forEach((sp, i) => {
        const d = sp.userData["d"] as THREE.Vector3;
        const r = 4 + b * (16 + (i % 4) * 4);
        sp.position.copy(dronePos).addScaledVector(d, r * 0.9);
        sp.position.y += b * 8;
        sp.scale.setScalar(8 + b * 34);
      });

      // camera, in film shots: low chase behind; alongside the leader through the bends;
      // under the jet as the missile drops; riding beside the missile; then the fireball
      const side = smooth((k - 0.16) / 0.06) * (1 - smooth((k - 0.34) / 0.05));
      const zoom = smooth((k - AIR.zoom[0]) / 0.05) * (1 - smooth((k - AIR.zoom[1]) / 0.04));
      const chase = new THREE.Vector3(L.x - 24, L.y + 5, L.z + 8);
      const alongside = new THREE.Vector3(L.x + 4, L.y + 1.5, L.z - 16);
      tmp.lerpVectors(chase, alongside, side);
      look.set(L.x + 40 - side * 36, L.y, L.z);
      const mPos = aam.visible ? aam.position : L;
      const close = new THREE.Vector3(mPos.x - 3.5, mPos.y + 1.2, mPos.z + 4.2);
      const lookClose = new THREE.Vector3(mPos.x + 2, mPos.y, mPos.z);
      tmp.lerp(close, zoom);
      look.lerp(lookClose, zoom);
      if (k > AIR.hit) {
        const hk = smooth((k - AIR.hit) / 0.06);
        tmp.lerp(new THREE.Vector3(dronePos.x - 90, dronePos.y + 18, dronePos.z + 60), hk);
        look.lerp(dronePos, hk);
      }
      camera.position.copy(tmp);
      camera.position.y += Math.sin(t * 17) * 0.06 + Math.sin(t * 11) * 0.05;
      camera.lookAt(look);
    },
    resize(aspect: number) {
      camera.aspect = aspect;
      camera.fov = aspect < 1 ? 64 : 48;
      camera.updateProjectionMatrix();
    },
  };
}
