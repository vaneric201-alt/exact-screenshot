import * as THREE from "three";
import { buildRoof, type RoofType } from "./roof";

export interface Mats {
  roof: THREE.Material;
  ridge: THREE.Material;
  soffit: THREE.Material;
  plaster: THREE.Material;
  gableWall: THREE.Material;
  lacquer: THREE.Material;
  marble: THREE.Material;
  paving: THREE.Material;
  imperialWay: THREE.Material;
  beam: THREE.Material;
  door: THREE.Material;
  gold: THREE.Material;
  arch: THREE.Material;
  water: THREE.Material;
  greyRoof: THREE.Material;
  greyWall: THREE.Material;
  ground: THREE.Material;
  greenRoof: THREE.Material;
}

/** Collects instanced parts (columns, balusters, figures) across all buildings. */
export class InstanceBin {
  private items = new Map<
    string,
    { geo: THREE.BufferGeometry; mat: THREE.Material; m: { local: THREE.Matrix4; parent: THREE.Object3D | null }[] }
  >();
  /** `matrix` is local to `parent`; world transforms are resolved in build(). */
  add(key: string, geo: () => THREE.BufferGeometry, mat: THREE.Material, matrix: THREE.Matrix4, parent: THREE.Object3D | null = null) {
    let it = this.items.get(key);
    if (!it) {
      it = { geo: geo(), mat, m: [] };
      this.items.set(key, it);
    }
    it.m.push({ local: matrix, parent });
  }
  /** Call after every building has been placed; `root` is updated first. */
  build(root?: THREE.Object3D, castShadow = true) {
    root?.updateMatrixWorld(true);
    const out: THREE.InstancedMesh[] = [];
    const w = new THREE.Matrix4();
    for (const [key, it] of this.items) {
      const im = new THREE.InstancedMesh(it.geo, it.mat, it.m.length);
      it.m.forEach(({ local, parent }, i) => {
        if (parent) {
          parent.updateWorldMatrix(true, false);
          w.multiplyMatrices(parent.matrixWorld, local);
        } else w.copy(local);
        im.setMatrixAt(i, w);
      });
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = castShadow;
      im.receiveShadow = true;
      im.name = key;
      im.computeBoundingSphere();
      out.push(im);
    }
    return out;
  }
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const tmpP = new THREE.Vector3();

export function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  return m;
}

/** Box whose UVs are in metres (so textures keep a real-world scale). */
export function boxM(w: number, h: number, d: number, mat: THREE.Material, scale = 1, x = 0, y = 0, z = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const px = pos.getX(i) + x;
    const py = pos.getY(i) + y + h / 2;
    const pz = pos.getZ(i) + z;
    if (ny > 0.5) uv.setXY(i, px / scale, pz / scale);
    else if (nx > 0.5) uv.setXY(i, pz / scale, py / scale);
    else uv.setXY(i, px / scale, py / scale);
  }
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y + h / 2, z);
  return m;
}

function tube(points: THREE.Vector3[], r: number, mat: THREE.Material) {
  if (points.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const geo = new THREE.TubeGeometry(curve, Math.max(4, points.length * 3), r, 6, false);
  return new THREE.Mesh(geo, mat);
}

export interface RoofOpts {
  type: RoofType;
  w: number;
  d: number;
  h: number;
  vMax?: number;
  gableAt?: number;
  curve?: number;
  sweep?: number;
  tip?: number;
  figures?: number;
  chiwen?: boolean;
  finial?: boolean;
  ridgeR?: number;
  roofMat?: THREE.Material;
}

/** A roof with tiles, soffit, ridges, ridge-end beasts and hip figures. */
export function roof(o: RoofOpts, M: Mats, bin: InstanceBin, parent: THREE.Object3D, at: THREE.Vector3) {
  const parts = buildRoof({
    w: o.w,
    d: o.d,
    h: o.h,
    type: o.type,
    ...(o.vMax !== undefined && { vMax: o.vMax }),
    ...(o.gableAt !== undefined && { gableAt: o.gableAt }),
    ...(o.curve !== undefined && { curve: o.curve }),
    ...(o.sweep !== undefined && { sweep: o.sweep }),
    ...(o.tip !== undefined && { tip: o.tip }),
  });
  const g = new THREE.Group();
  g.position.copy(at);
  const tiles = new THREE.Mesh(parts.top, o.roofMat ?? M.roof);
  const soffit = new THREE.Mesh(parts.under, M.soffit);
  g.add(tiles, soffit);
  if (parts.gable) g.add(new THREE.Mesh(parts.gable, M.gableWall));
  const r = o.ridgeR ?? Math.max(0.18, Math.min(o.w, o.d) * 0.012);
  const ridgeMat = o.roofMat === M.greyRoof ? M.greyRoof : o.roofMat === M.greenRoof ? M.greenRoof : M.ridge;
  parts.ridges.forEach((pts, i) => {
    const isMain = i === 0 && (o.vMax ?? 1) >= 1 && o.type !== "pyramid";
    const t = tube(pts, isMain ? r * 1.6 : r, ridgeMat);
    if (t) g.add(t);
  });
  // Chiwen: the dragon-mouth ornaments that swallow the ends of the main ridge.
  if (o.chiwen !== false && (o.vMax ?? 1) >= 1 && parts.ridgeEnds.length === 2) {
    const s = Math.max(0.6, o.h * 0.22);
    for (const e of parts.ridgeEnds) {
      const sign = Math.sign(e.x) || 1;
      const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.45, s * 1.1, s * 0.35), ridgeMat);
      body.position.set(e.x, e.y + s * 0.5, e.z);
      const curl = new THREE.Mesh(new THREE.TorusGeometry(s * 0.28, s * 0.09, 6, 12, Math.PI * 1.2), ridgeMat);
      curl.position.set(e.x - sign * s * 0.12, e.y + s * 1.05, e.z);
      curl.rotation.set(0, 0, sign > 0 ? Math.PI * 0.1 : Math.PI * 0.7);
      g.add(body, curl);
    }
  }
  // Guardian figures (xiaoshou) walking up the lower hips.
  const n = o.figures ?? 0;
  if (n > 0) {
    const fs = Math.max(0.35, Math.min(o.w, o.d) * 0.012);
    for (const foot of parts.hipFoots) {
      const pts = new THREE.CatmullRomCurve3(foot).getSpacedPoints(n);
      pts.slice(0, n).forEach((p) => {
        tmpP.set(p.x, p.y + fs * 0.6, p.z);
        tmpM.compose(tmpP, tmpQ.identity(), tmpS.set(fs, fs * 1.4, fs));
        bin.add("figure", () => new THREE.BoxGeometry(1, 1, 1), M.ridge, tmpM.clone(), g);
      });
    }
  }
  if (o.finial) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.6, o.w * 0.035), 16, 12), M.gold);
    f.position.set(parts.apex.x, parts.apex.y + Math.max(0.6, o.w * 0.035), parts.apex.z);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(o.w * 0.012, o.w * 0.03, o.w * 0.05, 12), M.gold);
    neck.position.set(parts.apex.x, parts.apex.y, parts.apex.z);
    g.add(f, neck);
  }
  parent.add(g);
  return parts;
}

export interface HallOpts {
  /** Column-grid footprint (x along the facade). */
  w: number;
  d: number;
  bays: number;
  baysD?: number;
  colH: number;
  base?: number;
  roof: RoofType;
  roofH: number;
  double?: boolean;
  overhang?: number;
  figures?: number;
  finial?: boolean;
  roofMat?: THREE.Material;
  /** Solid walls on all sides (gate houses on city walls). */
  closed?: boolean;
  curve?: number;
}

/**
 * A timber hall on a stone plinth: columns, lattice doors, painted brackets,
 * then one roof or a double-eaved pair (lower skirt + upper storey + roof).
 */
export function hall(o: HallOpts, M: Mats, bin: InstanceBin) {
  const g = new THREE.Group();
  const base = o.base ?? 1.2;
  const ov = o.overhang ?? Math.min(o.w, o.d) * 0.16 + 1;
  const pad = ov * 0.55;
  const colR = Math.max(0.28, Math.min(o.w, o.d) * 0.018);
  const baysD = o.baysD ?? Math.max(2, Math.round((o.bays * o.d) / o.w));

  // plinth
  g.add(boxM(o.w + pad * 2, base, o.d + pad * 2, M.marble, 3));
  // front and back steps
  g.add(boxM(Math.min(o.w * 0.35, 14), base * 0.6, pad * 1.2, M.marble, 3, 0, 0, o.d / 2 + pad + pad * 0.5));

  // walls, set just inside the column line
  const inset = colR * 2.2;
  const wallH = o.colH;
  g.add(boxM(o.w - inset * 2, wallH, o.d - inset * 2, M.plaster, 4, 0, base));
  // lattice door band on front & back
  const doorGeo = new THREE.PlaneGeometry(o.w - inset * 2 - 0.2, wallH * 0.86);
  const uv = doorGeo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (o.bays * (o.closed ? 0.0001 : 1)));
  if (!o.closed) {
    for (const s of [1, -1]) {
      const door = new THREE.Mesh(doorGeo, M.door);
      door.position.set(0, base + wallH * 0.43, s * (o.d / 2 - inset + 0.03));
      if (s < 0) door.rotation.y = Math.PI;
      g.add(door);
    }
  }

  // columns around the perimeter
  const colGeo = () => new THREE.CylinderGeometry(1, 1.06, 1, 14);
  const place = (x: number, z: number) => {
    tmpM.compose(tmpP.set(x, base + wallH / 2, z), tmpQ.identity(), tmpS.set(colR, wallH, colR));
    bin.add("column", colGeo, M.lacquer, tmpM.clone(), g);
  };
  for (let i = 0; i <= o.bays; i++) {
    const x = -o.w / 2 + (i * o.w) / o.bays;
    place(x, o.d / 2);
    place(x, -o.d / 2);
  }
  for (let j = 1; j < baysD; j++) {
    const z = -o.d / 2 + (j * o.d) / baysD;
    place(-o.w / 2, z);
    place(o.w / 2, z);
  }

  // painted bracket band (dougong) carrying the eaves
  const bh = Math.max(0.8, wallH * 0.16);
  const bracket = boxM(o.w + colR * 4, bh, o.d + colR * 4, M.beam, 1, 0, base + wallH);
  g.add(bracket);
  // on the great halls, real bracket sets (dougong) stand out from the band on every side
  if (wallH >= 6.5) dougongRow(o.w + colR * 4, o.d + colR * 4, base + wallH, bh, M, bin, g);
  const eaveY = base + wallH + bh;

  if (!o.double) {
    roof(
      {
        type: o.roof,
        w: o.w + ov * 2,
        d: o.d + ov * 2,
        h: o.roofH,
        figures: o.figures ?? 0,
        finial: o.finial ?? false,
        ...(o.roofMat && { roofMat: o.roofMat }),
        ...(o.curve !== undefined && { curve: o.curve }),
      },
      M,
      bin,
      g,
      new THREE.Vector3(0, eaveY, 0),
    );
    return { group: g, top: eaveY + o.roofH };
  }

  // Double eaves: lower skirt roof, then a recessed upper storey with its own roof.
  const skirtW = o.w + ov * 2;
  const skirtD = o.d + ov * 2;
  const vMax = 0.42;
  const skirtH = (o.d / 2 + ov) * 0.62;
  roof(
    {
      type: "hip",
      w: skirtW,
      d: skirtD,
      h: skirtH,
      vMax,
      figures: o.figures ?? 0,
      chiwen: false,
      ...(o.roofMat && { roofMat: o.roofMat }),
    },
    M,
    bin,
    g,
    new THREE.Vector3(0, eaveY, 0),
  );
  const bb = skirtD / 2;
  const upW = Math.max(2, skirtW - 2 * vMax * bb - 1.2);
  const upD = Math.max(2, skirtD - 2 * vMax * bb - 1.2);
  const skirtTop = eaveY + skirtH * Math.pow(vMax, 1.55);
  const upH = wallH * 0.42;
  g.add(boxM(upW, upH, upD, M.plaster, 4, 0, skirtTop - 0.4));
  const band = boxM(upW + 0.6, bh * 0.9, upD + 0.6, M.beam, 1, 0, skirtTop - 0.4 + upH);
  g.add(band);
  const upEave = skirtTop - 0.4 + upH + bh * 0.9;
  const ov2 = ov * 0.95;
  roof(
    {
      type: o.roof,
      w: upW + ov2 * 2,
      d: upD + ov2 * 2,
      h: o.roofH,
      figures: o.figures ?? 0,
      finial: o.finial ?? false,
      ...(o.roofMat && { roofMat: o.roofMat }),
      ...(o.curve !== undefined && { curve: o.curve }),
    },
    M,
    bin,
    g,
    new THREE.Vector3(0, upEave, 0),
  );
  return { group: g, top: upEave + o.roofH };
}

/** Marble balustrade along a closed rectangle (posts + rails). */
export function balustrade(
  cx: number,
  cz: number,
  w: number,
  d: number,
  y: number,
  M: Mats,
  bin: InstanceBin,
  parent: THREE.Object3D,
  gapFront = 0,
) {
  const postGeo = () => {
    const post = new THREE.BoxGeometry(0.26, 1.15, 0.26);
    post.translate(0, 0.575, 0);
    const cap = new THREE.SphereGeometry(0.17, 8, 6);
    cap.translate(0, 1.27, 0);
    return mergeSimple([post, cap]);
  };
  const edges: [number, number, number, number][] = [
    [cx - w / 2, cz + d / 2, cx + w / 2, cz + d / 2],
    [cx + w / 2, cz + d / 2, cx + w / 2, cz - d / 2],
    [cx + w / 2, cz - d / 2, cx - w / 2, cz - d / 2],
    [cx - w / 2, cz - d / 2, cx - w / 2, cz + d / 2],
  ];
  edges.forEach(([x0, z0, x1, z1], ei) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.round(len / 1.45));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = x0 + (x1 - x0) * t;
      const z = z0 + (z1 - z0) * t;
      if (ei === 0 && gapFront > 0 && Math.abs(x - cx) < gapFront / 2) continue;
      tmpM.compose(tmpP.set(x, y, z), tmpQ.identity(), tmpS.set(1, 1, 1));
      bin.add("baluster", postGeo, M.marble, tmpM.clone(), parent);
    }
    // rail (split around the front gap)
    const segs: [number, number][] =
      ei === 0 && gapFront > 0
        ? [
            [0, (w / 2 - gapFront / 2) / w],
            [(w / 2 + gapFront / 2) / w, 1],
          ]
        : [[0, 1]];
    for (const [s0, s1] of segs) {
      const sx = x0 + (x1 - x0) * s0;
      const sz = z0 + (z1 - z0) * s0;
      const ex = x0 + (x1 - x0) * s1;
      const ez = z0 + (z1 - z0) * s1;
      const l = Math.hypot(ex - sx, ez - sz);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(l, 0.16, 0.2), M.marble);
      rail.position.set((sx + ex) / 2, y + 0.95, (sz + ez) / 2);
      rail.rotation.y = -Math.atan2(ez - sz, ex - sx);
      const low = rail.clone();
      low.scale.y = 1.4;
      low.position.y = y + 0.12;
      parent.add(rail, low);
    }
  });
}

/** Merge a few simple non-indexed/indexed geometries into one (position/normal/uv only). */
export function mergeSimple(geos: THREE.BufferGeometry[]) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const count = parts.reduce((s, g) => s + g.getAttribute("position").count, 0);
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  let o = 0;
  for (const g of parts) {
    const p = g.getAttribute("position");
    const n = g.getAttribute("normal");
    const u = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) {
      pos.set([p.getX(i), p.getY(i), p.getZ(i)], (o + i) * 3);
      nor.set([n.getX(i), n.getY(i), n.getZ(i)], (o + i) * 3);
      if (u) uv.set([u.getX(i), u.getY(i)], (o + i) * 2);
    }
    o += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return out;
}

/**
 * A red palace wall with a small yellow-tiled cap roof, running from (x0,z0) to (x1,z1).
 */
export function wall(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  h: number,
  t: number,
  M: Mats,
  bin: InstanceBin,
  parent: THREE.Object3D,
  capMat?: THREE.Material,
) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const g = new THREE.Group();
  g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  g.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
  g.add(boxM(len, h, t, M.plaster, 4));
  g.add(boxM(len + 0.2, 0.5, t + 0.3, M.marble, 3, 0, 0));
  roof(
    { type: "gable", w: len + 1, d: t + 1.6, h: t * 0.35 + 0.4, chiwen: false, ...(capMat && { roofMat: capMat }) },
    M,
    bin,
    g,
    new THREE.Vector3(0, h, 0),
  );
  parent.add(g);
}


/** One bracket set: stacked blocks and crossing arms, as a single merged geometry (unit = band height). */
function dougongGeo() {
  const parts: THREE.BufferGeometry[] = [];
  const add = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const b = new THREE.BoxGeometry(w, h, d);
    b.translate(x, y, z);
    parts.push(b);
  };
  add(0.42, 0.22, 0.42, 0, 0.11, 0); // bearing block (dou)
  add(1.1, 0.16, 0.2, 0, 0.3, 0); // first arm, along the wall
  add(0.2, 0.16, 0.7, 0, 0.3, 0.2); // first arm, outward
  add(0.26, 0.14, 0.26, -0.45, 0.45, 0);
  add(0.26, 0.14, 0.26, 0.45, 0.45, 0);
  add(0.26, 0.14, 0.26, 0, 0.45, 0.48);
  add(1.6, 0.16, 0.2, 0, 0.6, 0.12); // second arm
  add(0.2, 0.16, 1.05, 0, 0.6, 0.42); // cantilever (ang)
  add(0.3, 0.16, 0.3, 0, 0.78, 0.86);
  add(1.9, 0.14, 0.2, 0, 0.9, 0.86); // eave purlin rest
  return mergeSimple(parts);
}

/** A row of bracket sets on all four sides of a hall's bracket band. */
function dougongRow(w: number, d: number, y: number, bh: number, M: Mats, bin: InstanceBin, parent: THREE.Object3D) {
  const s = bh * 0.95;
  const step = s * 1.75;
  const sides: [number, number, number, number][] = [
    // [length along side, offset of side, rotation, axis: 0 = x-run, 1 = z-run]
    [w, d / 2, 0, 0],
    [w, -d / 2, Math.PI, 0],
    [d, w / 2, Math.PI / 2, 1],
    [d, -w / 2, -Math.PI / 2, 1],
  ];
  for (const [len, off, rot, axis] of sides) {
    const n = Math.max(2, Math.floor(len / step));
    for (let i = 0; i <= n; i++) {
      const t = -len / 2 + (i * len) / n;
      const x = axis === 0 ? t : off;
      const z = axis === 0 ? off : t;
      tmpM.compose(tmpP.set(x, y + bh * 0.02, z), tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), tmpS.set(s, s, s));
      bin.add("dougong", dougongGeo, M.beam, tmpM.clone(), parent);
    }
  }
}
