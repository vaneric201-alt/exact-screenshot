import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/*
 * A procedural golden Chinese dragon (long 龍): a scaled serpentine body that
 * coils and undulates, flame-shaped dorsal fins, four legs with curved claws,
 * and a head with open jaws, bulbous nostrils, antler horns, mane and whiskers.
 * Everything is geometry built in code; the body is re-skinned every frame.
 *
 * Units are metres in "dragon space" (the thickest body radius is ~0.9).
 */

export interface DragonOptions {
  segments?: number;
  radial?: number;
  length?: number;
  /** Returns the body centre-line at parameter t ∈ [0,1] (0 = neck) for time `time`. */
  path: (t: number, time: number, out: THREE.Vector3) => THREE.Vector3;
  gold: THREE.Material;
  goldRough: THREE.Material;
  scaleTile?: number;
  /** Body radius multiplier. */
  thickness?: number;
  headScale?: number;
  /** Where the head looks (dragon space); the neck bends toward it. */
  face?: (time: number, out: THREE.Vector3) => THREE.Vector3 | null;
}

export interface GoldenDragon {
  group: THREE.Group;
  update(time: number): void;
  dispose(): void;
}

// ---------------- textures ----------------

export function createScaleTextures() {
  const W = 512;
  const H = 256;
  const cols = 8;
  const rows = 4;
  const hC = document.createElement("canvas");
  hC.width = W;
  hC.height = H;
  const h = hC.getContext("2d", { willReadFrequently: true })!;
  h.fillStyle = "#000";
  h.fillRect(0, 0, W, H);
  const cw = W / cols;
  const rh = H / rows;
  // overlapping round scales, each row offset by half a scale
  for (let r = rows; r >= -1; r--) {
    for (let c = -1; c <= cols; c++) {
      const x = c * cw + (r % 2 ? cw / 2 : 0) + cw / 2;
      const y = r * rh;
      for (const dx of [-W, 0, W]) {
        const g = h.createRadialGradient(x + dx, y + rh * 0.2, 2, x + dx, y + rh * 0.35, cw * 0.62);
        g.addColorStop(0, "#fff");
        g.addColorStop(0.72, "#9a9a9a");
        g.addColorStop(0.9, "#2a2a2a");
        g.addColorStop(1, "#000");
        h.fillStyle = g;
        h.beginPath();
        h.ellipse(x + dx, y + rh * 0.35, cw * 0.56, rh * 0.95, 0, 0, Math.PI);
        h.fill();
      }
    }
  }
  const hd = h.getImageData(0, 0, W, H).data;
  const at = (x: number, y: number) => hd[(((y + H) % H) * W + ((x + W) % W)) * 4]! / 255;
  const nC = document.createElement("canvas");
  nC.width = W;
  nC.height = H;
  const n = nC.getContext("2d")!;
  const img = n.createImageData(W, H);
  const cC = document.createElement("canvas");
  cC.width = W;
  cC.height = H;
  const c = cC.getContext("2d")!;
  const cimg = c.createImageData(W, H);
  const rC = document.createElement("canvas");
  rC.width = W;
  rC.height = H;
  const rc = rC.getContext("2d")!;
  const rimg = rc.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 3;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 3;
      const nz = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * W + x) * 4;
      img.data[i] = (-dx * nz * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy * nz * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
      // colour: gilded scales, darker in the grooves between them
      const v = at(x, y);
      const k = 0.55 + v * 0.5;
      cimg.data[i] = Math.min(255, 232 * k);
      cimg.data[i + 1] = Math.min(255, 172 * k);
      cimg.data[i + 2] = Math.min(255, 70 * k);
      cimg.data[i + 3] = 255;
      // roughness: polished scale crowns, dull grooves, each scale a little different
      const cell = Math.floor(x / cw) * 7 + Math.floor(y / rh) * 13;
      const jitter = (Math.sin(cell * 12.9898) * 43758.5453) % 1;
      const rough = 0.18 + (1 - v) * 0.55 + Math.abs(jitter) * 0.12;
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = Math.min(255, rough * 255);
      rimg.data[i + 3] = 255;
    }
  }
  n.putImageData(img, 0, 0);
  c.putImageData(cimg, 0, 0);
  rc.putImageData(rimg, 0, 0);
  const normal = new THREE.CanvasTexture(nC);
  const color = new THREE.CanvasTexture(cC);
  const rough = new THREE.CanvasTexture(rC);
  for (const t of [normal, color, rough]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  color.colorSpace = THREE.SRGBColorSpace;
  return { normal, color, rough };
}

/** Belly plates: broad transverse bands, pale gold, with a dark seam between them. */
function bellyTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  for (let x = 0; x < 256; x += 32) {
    const g = ctx.createLinearGradient(x, 0, x + 32, 0);
    g.addColorStop(0, "#fbe7a8");
    g.addColorStop(0.7, "#e8c070");
    g.addColorStop(0.92, "#a8782c");
    g.addColorStop(1, "#5a3a10");
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 32, 64);
  }
  // the plates narrow towards the sides of the belly
  const side = ctx.createLinearGradient(0, 0, 0, 64);
  side.addColorStop(0, "rgba(90,58,16,0.55)");
  side.addColorStop(0.18, "rgba(90,58,16,0)");
  side.addColorStop(0.82, "rgba(90,58,16,0)");
  side.addColorStop(1, "rgba(90,58,16,0.55)");
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, 256, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Ring grooves for the horns, as a bump map along the tube's length. */
function ringBump() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 8;
  const ctx = c.getContext("2d")!;
  for (let x = 0; x < 256; x++) {
    const v = Math.pow(0.5 + 0.5 * Math.sin((x / 256) * Math.PI * 2 * 14), 3);
    ctx.fillStyle = `rgb(${v * 255},${v * 255},${v * 255})`;
    ctx.fillRect(x, 0, 1, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------------- shapes ----------------

function flameShape() {
  // a flame-tongue fin: fat base, curling tip leaning back
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.05, 0.45, -0.1, 0.8, -0.35, 1.05);
  s.bezierCurveTo(-0.15, 0.85, 0.2, 0.7, 0.3, 0.45);
  s.bezierCurveTo(0.35, 0.62, 0.3, 0.72, 0.22, 0.82);
  s.bezierCurveTo(0.5, 0.62, 0.55, 0.3, 0.62, 0);
  s.lineTo(0, 0);
  return s;
}

function flameGeo(depth = 0.06) {
  const g = new THREE.ExtrudeGeometry(flameShape(), { depth, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 10 });
  g.translate(-0.3, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** A tapered tube along points (radius r0 → r1). */
function taperTube(points: THREE.Vector3[], r0: number, r1: number, seg = 24, radial = 8) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(seg, false);
  const pos: number[] = [];
  const idx: number[] = [];
  const uv: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    curve.getPointAt(t, p);
    const r = r0 + (r1 - r0) * t;
    const N = frames.normals[i]!;
    const B = frames.binormals[i]!;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cx = Math.cos(a) * r;
      const cy = Math.sin(a) * r;
      pos.push(p.x + N.x * cx + B.x * cy, p.y + N.y * cx + B.y * cy, p.z + N.z * cx + B.z * cy);
      uv.push(t, j / radial);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * row + j;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------------- head ----------------

function buildHead(gold: THREE.Material, goldRough: THREE.Material) {
  const head = new THREE.Group();
  const eyeMat = new THREE.MeshStandardMaterial({ color: "#f2c14e", emissive: "#6b2a00", emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.2 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: "#120a05", roughness: 0.3 });
  const toothMat = new THREE.MeshStandardMaterial({ color: "#f3e7c8", roughness: 0.35, metalness: 0.1 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: "#5a1410", roughness: 0.7 });
  const tongueMat = new THREE.MeshStandardMaterial({ color: "#a3261d", roughness: 0.45 });

  // the head is polished smooth gold; only the body carries scales
  const ell = (r: number, sx: number, sy: number, sz: number, x: number, y: number, z: number, mat = goldRough) => {
    const m = mesh(new THREE.SphereGeometry(r, 28, 20), mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    head.add(m);
    return m;
  };

  // skull, cheeks and brow
  ell(1, 1.15, 0.85, 0.92, 0, 0.3, 0);
  for (const s of [-1, 1]) {
    ell(0.55, 1.2, 0.9, 0.9, 0.55, -0.05, s * 0.52);
    ell(0.36, 1.5, 0.72, 0.95, 1.02, 0.88, s * 0.42); // brow ridge
  }
  // upper snout, tapering forward, with the bulbous nose the reference shows
  const snout = mesh(new THREE.CylinderGeometry(0.4, 0.58, 2.1, 24, 1), goldRough);
  snout.rotation.z = -Math.PI / 2;
  snout.scale.set(0.78, 1, 0.92);
  snout.position.set(1.65, 0.28, 0);
  head.add(snout);
  for (const s of [-1, 1]) {
    ell(0.28, 1.1, 0.8, 0.9, 2.74, 0.47, s * 0.26);
    const nostril = mesh(new THREE.TorusGeometry(0.12, 0.05, 10, 20), goldRough);
    nostril.position.set(2.98, 0.52, s * 0.28);
    nostril.rotation.y = Math.PI / 2;
    head.add(nostril);
    ell(0.085, 1, 1, 1, 2.99, 0.52, s * 0.28, pupilMat);
  }
  // mouth cavity and upper teeth
  ell(0.5, 2.1, 0.45, 0.8, 1.45, -0.12, 0, mouthMat);
  const fang = new THREE.ConeGeometry(0.075, 0.34, 10);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const t = mesh(fang, toothMat);
      const big = k === 5;
      t.scale.setScalar(big ? 1.7 : 1);
      t.rotation.z = Math.PI;
      t.position.set(0.95 + k * 0.26, -0.2 - (big ? 0.12 : 0), s * (0.42 - k * 0.02));
      head.add(t);
    }
  }
  // lower jaw hinged open
  const jaw = new THREE.Group();
  jaw.position.set(0.25, -0.2, 0);
  jaw.rotation.z = -0.42;
  const jawBone = mesh(new THREE.CylinderGeometry(0.28, 0.46, 2.1, 20, 1), goldRough);
  jawBone.rotation.z = -Math.PI / 2;
  jawBone.scale.set(0.5, 1, 0.9);
  jawBone.position.set(1.05, -0.12, 0);
  jaw.add(jawBone);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const t = mesh(fang, toothMat);
      t.position.set(0.55 + k * 0.28, 0.1, s * (0.34 - k * 0.02));
      t.scale.setScalar(k === 5 ? 1.5 : 0.9);
      jaw.add(t);
    }
  }
  const tongue = mesh(new THREE.TorusGeometry(0.7, 0.1, 10, 24, Math.PI * 0.8), tongueMat);
  tongue.position.set(1.1, 0.35, 0);
  tongue.rotation.z = Math.PI * 1.05;
  tongue.scale.set(1.2, 0.5, 1.4);
  jaw.add(tongue);
  // beard: flames hanging from the chin
  const flame = flameGeo(0.05);
  for (let k = 0; k < 6; k++) {
    const b = mesh(flame, goldRough);
    b.scale.setScalar(1 + (k % 3) * 0.25);
    b.position.set(1.7 - k * 0.28, -0.3, (k - 2.5) * 0.14);
    b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-0.7, -1, (k - 2.5) * 0.25).normalize());
    jaw.add(b);
  }
  head.add(jaw);

  // eyes, fierce and slightly glowing
  for (const s of [-1, 1]) {
    ell(0.24, 1.45, 0.8, 0.75, 1.14, 0.66, s * 0.56, eyeMat);
    ell(0.07, 0.7, 2.6, 0.6, 1.2, 0.66, s * 0.74, pupilMat); // slit pupil
    ell(0.26, 1.55, 0.3, 0.8, 1.12, 0.88, s * 0.56); // heavy upper lid
  }

  // ridge of plates along the top of the snout
  for (let k = 0; k < 8; k++) {
    const t = k / 7;
    const plate = ell(0.16 - t * 0.06, 1.3, 0.5, 1, 0.95 + t * 1.6, 0.66 - t * 0.12, 0);
    plate.rotation.z = -0.15;
  }
  // bushy brows: strands flicking up and back from above the eyes
  const browGeos: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const u = k / 6;
      const start = new THREE.Vector3(1.35 - u * 0.5, 0.95 + u * 0.08, s * (0.5 + u * 0.06));
      browGeos.push(
        taperTube(
          [start, start.clone().add(new THREE.Vector3(-0.5, 0.45 + u * 0.2, s * 0.25)), start.clone().add(new THREE.Vector3(-1.2, 0.75 + u * 0.35, s * (0.45 + u * 0.2)))],
          0.05,
          0.008,
          14,
          5,
        ),
      );
    }
  }
  head.add(mesh(mergeGeometries(browGeos)!, gold));

  // antler horns sweeping back, each with a branch, ringed like real antlers
  const hornMat = (gold as THREE.MeshStandardMaterial).clone();
  hornMat.map = null;
  hornMat.normalMap = null;
  hornMat.color.set("#d9a54e");
  hornMat.roughness = 0.42;
  hornMat.bumpMap = ringBump();
  hornMat.bumpMap.repeat.set(1, 1);
  hornMat.bumpScale = 2.2;
  for (const s of [-1, 1]) {
    const main = [
      new THREE.Vector3(0.35, 0.95, s * 0.32),
      new THREE.Vector3(-0.4, 1.75, s * 0.48),
      new THREE.Vector3(-1.5, 2.3, s * 0.62),
      new THREE.Vector3(-2.7, 2.35, s * 0.58),
    ];
    head.add(mesh(taperTube(main, 0.2, 0.05, 30, 10), hornMat));
    const branch = [new THREE.Vector3(-0.7, 1.95, s * 0.52), new THREE.Vector3(-0.9, 2.6, s * 0.6), new THREE.Vector3(-0.7, 3.05, s * 0.6)];
    head.add(mesh(taperTube(branch, 0.1, 0.03, 16, 8), hornMat));
  }

  // mane: a few broad flames for volume, then many fine strands streaming back
  const Y = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const m = mesh(flame, goldRough);
    const len = 1.3 + Math.abs(Math.sin(k * 2.3)) * 0.6;
    m.scale.set(len * 0.7, len, len * 0.7);
    m.position.set(-0.4, 0.3 + Math.sin(a) * 0.6, Math.cos(a) * 0.7);
    dir.set(-1, Math.sin(a) * 0.6 + 0.2, Math.cos(a) * 0.6).normalize();
    m.quaternion.setFromUnitVectors(Y, dir);
    m.rotateY(a);
    head.add(m);
  }
  const hair: THREE.BufferGeometry[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 90; k++) {
    // roots on the back of the skull and the cheeks
    const a = rnd() * Math.PI * 2;
    const rootR = 0.55 + rnd() * 0.25;
    const root = new THREE.Vector3(-0.1 - rnd() * 0.4, 0.3 + Math.sin(a) * rootR * 0.9, Math.cos(a) * rootR);
    const out = new THREE.Vector3(0, Math.sin(a), Math.cos(a));
    const len = 1.8 + rnd() * 1.8;
    const pts: THREE.Vector3[] = [root];
    for (let j = 1; j <= 4; j++) {
      const u = j / 4;
      // streams back, fans outwards, waves a little like flame
      pts.push(
        root
          .clone()
          .add(new THREE.Vector3(-len * u, 0, 0))
          .addScaledVector(out, len * u * (0.45 + rnd() * 0.25))
          .add(new THREE.Vector3(0, Math.sin(u * 5 + k) * 0.15 + u * 0.3, Math.cos(u * 4 + k) * 0.12)),
      );
    }
    hair.push(taperTube(pts, 0.05 + rnd() * 0.03, 0.006, 18, 5));
  }
  head.add(mesh(mergeGeometries(hair)!, gold));

  // whiskers from the upper lip, animated in update()
  const whiskers = new THREE.Group();
  for (const s of [-1, 1]) {
    const w = [
      new THREE.Vector3(2.35, 0.1, s * 0.42),
      new THREE.Vector3(2.8, -0.35, s * 1.1),
      new THREE.Vector3(2.3, -1.2, s * 1.9),
      new THREE.Vector3(1.2, -1.7, s * 2.6),
      new THREE.Vector3(0.1, -1.5, s * 3.1),
    ];
    whiskers.add(mesh(taperTube(w, 0.07, 0.015, 40, 6), gold));
  }
  head.add(whiskers);
  head.userData["whiskers"] = whiskers;
  head.userData["jaw"] = jaw;
  return head;
}

// ---------------- the dragon ----------------

export function createGoldenDragon(opts: DragonOptions): GoldenDragon {
  const S = opts.segments ?? 200;
  const R = opts.radial ?? 18;
  const K = opts.thickness ?? 1;
  const group = new THREE.Group();

  const radiusAt = (t: number) => {
    // neck → shoulders swell → long body → thin tail
    const neck = THREE.MathUtils.smoothstep(t, 0, 0.08);
    const tail = 1 - THREE.MathUtils.smoothstep(t, 0.4, 1);
    return K * (0.62 + neck * 0.35 * (0.35 + 0.65 * tail) + (tail - 1) * 0.58);
  };

  // body geometry, re-skinned every frame
  const vCount = (S + 1) * (R + 1);
  const pos = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  const idx: number[] = [];
  const tile = opts.scaleTile ?? 34;
  for (let i = 0; i <= S; i++)
    for (let j = 0; j <= R; j++) {
      const k = i * (R + 1) + j;
      uv[k * 2] = (i / S) * tile;
      uv[k * 2 + 1] = (j / R) * 3;
    }
  for (let i = 0; i < S; i++)
    for (let j = 0; j < R; j++) {
      const a = i * (R + 1) + j;
      const b = a + R + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  bodyGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  bodyGeo.setIndex(idx);
  const body = mesh(bodyGeo, opts.gold);
  body.frustumCulled = false;
  group.add(body);

  // belly: a band of pale transverse plates along the underside
  const BR = 8;
  const BELLY_A = 0.8;
  const bVCount = (S + 1) * (BR + 1);
  const bpos = new Float32Array(bVCount * 3);
  const buv = new Float32Array(bVCount * 2);
  const bidx: number[] = [];
  for (let i = 0; i <= S; i++)
    for (let j = 0; j <= BR; j++) {
      const k = i * (BR + 1) + j;
      buv[k * 2] = (i / S) * tile * 0.55;
      buv[k * 2 + 1] = j / BR;
    }
  for (let i = 0; i < S; i++)
    for (let j = 0; j < BR; j++) {
      const a = i * (BR + 1) + j;
      const b = a + BR + 1;
      bidx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const bellyGeo = new THREE.BufferGeometry();
  bellyGeo.setAttribute("position", new THREE.BufferAttribute(bpos, 3));
  bellyGeo.setAttribute("uv", new THREE.BufferAttribute(buv, 2));
  bellyGeo.setIndex(bidx);
  const bellyMat = new THREE.MeshPhysicalMaterial({ map: bellyTexture(), metalness: 0.65, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  const belly = mesh(bellyGeo, bellyMat);
  belly.frustumCulled = false;
  group.add(belly);

  // dorsal fins
  const FINS = 46;
  const fins = new THREE.InstancedMesh(flameGeo(0.07), opts.goldRough, FINS);
  fins.castShadow = true;
  fins.frustumCulled = false;
  group.add(fins);
  // tail flame
  const tailTuft = new THREE.Group();
  const tf = flameGeo(0.05);
  for (let k = 0; k < 7; k++) {
    const m = mesh(tf, opts.goldRough);
    m.scale.setScalar(1.6 + (k % 3) * 0.5);
    m.rotation.set((k / 7) * Math.PI * 2, 0, -Math.PI / 2 + (k - 3) * 0.2);
    tailTuft.add(m);
  }
  group.add(tailTuft);

  // legs: thigh, shin and a foot of four curved claws
  const legs: { t: number; side: number; g: THREE.Group }[] = [];
  const clawGeo = new THREE.TorusGeometry(0.28, 0.065, 8, 14, Math.PI * 0.6);
  for (const [t, side] of [
    [0.13, 1],
    [0.16, -1],
    [0.5, 1],
    [0.53, -1],
  ] as const) {
    const g = new THREE.Group();
    const thigh = mesh(taperTube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2, -0.9, 0.5), new THREE.Vector3(0.6, -1.5, 0.8)], 0.42, 0.26, 12, 12), opts.gold);
    const shin = mesh(taperTube([new THREE.Vector3(0.6, -1.5, 0.8), new THREE.Vector3(0.95, -2.2, 0.9), new THREE.Vector3(1.3, -2.55, 0.95)], 0.26, 0.18, 12, 10), opts.gold);
    g.add(thigh, shin);
    // elbow flame
    const ef = mesh(tf, opts.goldRough);
    ef.scale.setScalar(1.1);
    ef.position.set(0.5, -1.45, 0.75);
    ef.rotation.set(0, 0, Math.PI * 0.75);
    g.add(ef);
    for (let c = 0; c < 4; c++) {
      const cl = mesh(clawGeo, opts.gold);
      cl.position.set(1.35 + Math.cos(c * 0.6 - 0.9) * 0.2, -2.6, 0.95 + Math.sin(c * 0.6 - 0.9) * 0.3);
      cl.rotation.set(Math.PI / 2, c * 0.5 - 0.75, 0.2);
      g.add(cl);
    }
    g.scale.setScalar(K * 1.35);
    group.add(g);
    legs.push({ t, side, g });
  }

  const head = buildHead(opts.gold, opts.goldRough);
  head.scale.setScalar((opts.headScale ?? 1) * K);
  group.add(head);
  const faceV = new THREE.Vector3();

  // scratch
  const ctrl: THREE.Vector3[] = Array.from({ length: 48 }, () => new THREE.Vector3());
  const curve = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const up = new THREE.Vector3();

  function update(time: number) {
    for (let i = 0; i < ctrl.length; i++) opts.path(i / (ctrl.length - 1), time, ctrl[i]!);
    curve.updateArcLengths();
    const frames = curve.computeFrenetFrames(S, false);
    // skin the body
    for (let i = 0; i <= S; i++) {
      const t = i / S;
      curve.getPointAt(t, P);
      const r = radiusAt(t);
      const n = frames.normals[i]!;
      const b = frames.binormals[i]!;
      for (let j = 0; j <= R; j++) {
        const a = (j / R) * Math.PI * 2;
        const cx = Math.cos(a) * r;
        const cy = Math.sin(a) * r * 0.92;
        const k = (i * (R + 1) + j) * 3;
        pos[k] = P.x + n.x * cx + b.x * cy;
        pos[k + 1] = P.y + n.y * cx + b.y * cy;
        pos[k + 2] = P.z + n.z * cx + b.z * cy;
      }
    }
    bodyGeo.attributes["position"]!.needsUpdate = true;
    bodyGeo.computeVertexNormals();
    bodyGeo.computeBoundingSphere();
    // belly band, just proud of the skin on the side away from the fins
    for (let i = 0; i <= S; i++) {
      const t = i / S;
      curve.getPointAt(t, P);
      const r = radiusAt(t) * 1.02;
      const n = frames.normals[i]!;
      const b = frames.binormals[i]!;
      for (let j = 0; j <= BR; j++) {
        const a = -Math.PI / 2 + (j / BR - 0.5) * 2 * BELLY_A;
        const cx = Math.cos(a) * r;
        const cy = Math.sin(a) * r * 0.92;
        const k = (i * (BR + 1) + j) * 3;
        bpos[k] = P.x + n.x * cx + b.x * cy;
        bpos[k + 1] = P.y + n.y * cx + b.y * cy;
        bpos[k + 2] = P.z + n.z * cx + b.z * cy;
      }
    }
    bellyGeo.attributes["position"]!.needsUpdate = true;
    bellyGeo.computeVertexNormals();

    // fins ride the ridge (binormal side)
    for (let f = 0; f < FINS; f++) {
      const t = 0.04 + (f / (FINS - 1)) * 0.9;
      const fi = Math.round(t * S);
      curve.getPointAt(t, P);
      T.copy(frames.tangents[fi]!);
      B.copy(frames.binormals[fi]!);
      const r = radiusAt(t);
      P.addScaledVector(B, r * 0.82);
      // fin plane: x along -tangent (leaning back), y along the ridge normal
      N.crossVectors(B, T).normalize();
      m4.makeBasis(T.clone().negate(), B, N.clone().negate());
      q.setFromRotationMatrix(m4);
      const s = r * (1.25 + 0.25 * Math.sin(f * 1.3));
      m4.compose(P, q, sc.set(s, s * 1.15, s));
      fins.setMatrixAt(f, m4);
    }
    fins.instanceMatrix.needsUpdate = true;

    // legs hang from the belly side
    for (const L of legs) {
      const fi = Math.round(L.t * S);
      curve.getPointAt(L.t, P);
      T.copy(frames.tangents[fi]!);
      N.copy(frames.normals[fi]!).multiplyScalar(L.side);
      B.copy(frames.binormals[fi]!).negate();
      const r = radiusAt(L.t);
      P.addScaledVector(N, r * 0.55).addScaledVector(B, r * 0.3);
      // leg space: x forward (−tangent), y down the belly, z out to the side
      m4.makeBasis(T.clone().negate(), B.clone().negate(), N);
      L.g.position.copy(P);
      L.g.quaternion.setFromRotationMatrix(m4);
      L.g.rotation.x += Math.sin(time * 1.6 + L.t * 9) * 0.12;
    }

    // tail flame at the end
    curve.getPointAt(1, P);
    T.copy(frames.tangents[S]!);
    tailTuft.position.copy(P);
    tailTuft.scale.setScalar(K);
    m4.makeBasis(T, frames.binormals[S]!, frames.normals[S]!);
    tailTuft.quaternion.setFromRotationMatrix(m4);

    // head sits on the neck and looks away from the body
    curve.getPointAt(0, P);
    T.copy(frames.tangents[0]!).negate(); // forward, out of the neck
    const want = opts.face?.(time, faceV);
    if (want) T.multiplyScalar(0.35).add(want.clone().normalize()).normalize();
    up.set(0, 1, 0).addScaledVector(T, -T.y).normalize();
    if (up.lengthSq() < 0.01) up.copy(frames.binormals[0]!);
    N.crossVectors(T, up).normalize();
    up.crossVectors(N, T).normalize();
    m4.makeBasis(T, up, N);
    head.position.copy(P).addScaledVector(T, 0.4 * K);
    head.quaternion.setFromRotationMatrix(m4);
    const w = head.userData["whiskers"] as THREE.Group;
    w.rotation.x = Math.sin(time * 1.3) * 0.12;
    w.rotation.y = Math.sin(time * 0.9) * 0.08;
    const jaw = head.userData["jaw"] as THREE.Group;
    jaw.rotation.z = -0.42 + Math.sin(time * 0.8) * 0.06;
  }

  update(0);
  return {
    group,
    update,
    dispose() {
      group.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    },
  };
}
