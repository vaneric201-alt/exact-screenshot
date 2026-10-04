import * as THREE from "three";

/*
 * Parametric Chinese roofs. The four roof types of the palace are all built
 * from the same idea: slopes rise from the eave line along a concave profile
 * (gentle at the eave, steep near the ridge, the "juzhe" curve) and the eave
 * sweeps up towards the corners ("qiao jiao").
 *
 *   hip      – wudian 廡殿, the highest rank (Hall of Supreme Harmony, Meridian Gate)
 *   xieshan  – hip-and-gable 歇山 (Gate of Supreme Harmony, Hall of Preserving Harmony)
 *   pyramid  – cuanjian 攢尖, square roof meeting at a point (Hall of Central Harmony)
 *   gable    – two slopes with gable ends (galleries, wall caps)
 *
 * Coordinates: eave rectangle centred on the origin, x along the long side,
 * z across it (+z = front), y up from the eave line.
 */

export type RoofType = "hip" | "xieshan" | "pyramid" | "gable";

export interface RoofSpec {
  /** Eave rectangle, overhang included. */
  w: number;
  d: number;
  /** Rise from eave to ridge for the full profile. */
  h: number;
  type: RoofType;
  curve?: number;
  /** Eave rises this much toward the corners, over ~40% of each side. */
  sweep?: number;
  /** Extra flick right at the corner tips. */
  tip?: number;
  /** Build only part of the roof (lower skirt of a double-eaved roof). */
  vMax?: number;
  /** xieshan: height parameter where the hips end and the gable begins. */
  gableAt?: number;
  thickness?: number;
  /** Metres covered by one repeat of the tile texture (8 tiles). */
  tile?: number;
}

export interface RoofParts {
  top: THREE.BufferGeometry;
  under: THREE.BufferGeometry;
  gable: THREE.BufferGeometry | null;
  /** Polylines for ridge tubes (main ridge, hips, gable ridges). */
  ridges: THREE.Vector3[][];
  /** Main ridge end points (for chiwen ornaments), empty for pyramids. */
  ridgeEnds: THREE.Vector3[];
  /** Apex (pyramid) or ridge centre. */
  apex: THREE.Vector3;
  /** Points along the lower hips (for guardian figures), one list per corner. */
  hipFoots: THREE.Vector3[][];
}

type Side = "front" | "back" | "left" | "right";

export function buildRoof(spec: RoofSpec): RoofParts {
  const type = spec.type;
  const a = spec.w / 2;
  const b = type === "pyramid" ? spec.w / 2 : spec.d / 2;
  const H = spec.h;
  const curve = spec.curve ?? 1.55;
  const vMax = spec.vMax ?? 1;
  const vg = type === "xieshan" ? (spec.gableAt ?? 0.5) : type === "gable" ? 0 : 1;
  const thick = spec.thickness ?? Math.max(0.25, b * 0.03);
  const tile = spec.tile ?? 3.2;
  const sweep = spec.sweep ?? b * 0.1;
  const tip = spec.tip ?? b * 0.08;
  const sweepL = Math.min(a, b) * 1.1;
  const tipL = Math.min(a, b) * 0.35;

  const g = (v: number) => H * Math.pow(v, curve);
  const lift = (x: number, z: number) => {
    if (type === "gable") return 0;
    const e = a - Math.abs(x) + (b - Math.abs(z));
    const s = Math.max(0, 1 - e / sweepL);
    const t = Math.max(0, 1 - e / tipL);
    return sweep * s * s + tip * t * t * t;
  };
  const y = (x: number, z: number, v: number) => g(v) + lift(x, z);

  // Half-length of each slope's horizontal row at height v.
  const halfAlongFB = (v: number) => {
    if (type === "gable") return a;
    if (type === "xieshan") return a - Math.min(v, vg) * b;
    return a - v * b;
  };
  const halfAlongLR = (v: number) => b - v * b;

  const topPos: number[] = [];
  const topUv: number[] = [];
  const topIdx: number[] = [];
  const unPos: number[] = [];
  const unUv: number[] = [];
  const unIdx: number[] = [];

  const slopeLen = Math.sqrt(b * b + H * H);

  function addSlope(side: Side, vTop: number) {
    if (vTop <= 0) return;
    const along = side === "front" || side === "back" ? halfAlongFB : halfAlongLR;
    const maxAlong = along(0);
    const segU = Math.max(4, Math.min(64, Math.ceil((maxAlong * 2) / 1.6)));
    const segV = 14;
    const base = topPos.length / 3;
    const baseU = unPos.length / 3;
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * vTop;
      const half = along(v);
      for (let i = 0; i <= segU; i++) {
        const s = (i / segU) * 2 - 1;
        const t = s * half;
        let x = 0;
        let z = 0;
        if (side === "front") {
          x = t;
          z = b * (1 - v);
        } else if (side === "back") {
          x = -t;
          z = -b * (1 - v);
        } else if (side === "right") {
          x = a - v * b;
          z = -t;
        } else {
          x = -(a - v * b);
          z = t;
        }
        const yy = y(x, z, v);
        topPos.push(x, yy, z);
        topUv.push(t / tile, (v * slopeLen) / tile);
        unPos.push(x, yy - thick, z);
        unUv.push(t / 4, (v * slopeLen) / 4);
      }
    }
    const row = segU + 1;
    for (let j = 0; j < segV; j++) {
      for (let i = 0; i < segU; i++) {
        const p = j * row + i;
        const q = p + row;
        topIdx.push(base + p, base + p + 1, base + q, base + p + 1, base + q + 1, base + q);
        unIdx.push(baseU + p, baseU + q, baseU + p + 1, baseU + p + 1, baseU + q, baseU + q + 1);
      }
    }
    // Fascia: close the gap between tile surface and soffit along the eave.
    const fb = topPos.length / 3;
    for (let i = 0; i <= segU; i++) {
      const k = base + i;
      topPos.push(topPos[k * 3]!, topPos[k * 3 + 1]! - thick, topPos[k * 3 + 2]!);
      topUv.push(topUv[k * 2]!, -0.05);
    }
    for (let i = 0; i < segU; i++) {
      const t0 = base + i;
      const b0 = fb + i;
      topIdx.push(t0, b0, t0 + 1, t0 + 1, b0, b0 + 1);
    }
  }

  const vTopFB = Math.min(vMax, 1);
  const vTopLR = type === "gable" ? 0 : type === "xieshan" ? Math.min(vMax, vg) : Math.min(vMax, 1);
  addSlope("front", vTopFB);
  addSlope("back", vTopFB);
  if (type !== "pyramid") {
    addSlope("left", vTopLR);
    addSlope("right", vTopLR);
  } else {
    // pyramid: the "ends" are just the other two faces of a square
    addSlope("left", vTopFB);
    addSlope("right", vTopFB);
  }

  const top = new THREE.BufferGeometry();
  top.setAttribute("position", new THREE.Float32BufferAttribute(topPos, 3));
  top.setAttribute("uv", new THREE.Float32BufferAttribute(topUv, 2));
  top.setIndex(topIdx);
  top.computeVertexNormals();
  orientUp(top);

  const under = new THREE.BufferGeometry();
  under.setAttribute("position", new THREE.Float32BufferAttribute(unPos, 3));
  under.setAttribute("uv", new THREE.Float32BufferAttribute(unUv, 2));
  under.setIndex(unIdx);
  under.computeVertexNormals();
  orientDown(under);

  // Gable walls (xieshan upper part, plain gables).
  let gable: THREE.BufferGeometry | null = null;
  if ((type === "xieshan" || type === "gable") && vMax >= 1) {
    const gp: number[] = [];
    const gi: number[] = [];
    const gu: number[] = [];
    const xg = halfAlongFB(1) - (type === "xieshan" ? b * 0.06 : 0);
    const steps = 10;
    for (const sx of [-1, 1]) {
      const start = gp.length / 3;
      for (let j = 0; j <= steps; j++) {
        const v = vg + ((1 - vg) * j) / steps;
        const zz = b * (1 - v);
        const yy = g(v) - thick * 0.5;
        gp.push(sx * xg, yy, -zz, sx * xg, yy, zz);
        gu.push(-zz / 4, yy / 4, zz / 4, yy / 4);
      }
      // floor of the gable triangle at the gable start height
      for (let j = 0; j < steps; j++) {
        const p = start + j * 2;
        if (sx > 0) gi.push(p, p + 2, p + 1, p + 1, p + 2, p + 3);
        else gi.push(p, p + 1, p + 2, p + 1, p + 3, p + 2);
      }
    }
    gable = new THREE.BufferGeometry();
    gable.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
    gable.setAttribute("uv", new THREE.Float32BufferAttribute(gu, 2));
    gable.setIndex(gi);
    gable.computeVertexNormals();
  }

  // Ridges.
  const ridges: THREE.Vector3[][] = [];
  const ridgeEnds: THREE.Vector3[] = [];
  const hipFoots: THREE.Vector3[][] = [];
  const topY = g(vMax);
  const apex = new THREE.Vector3(0, g(1), 0);
  if (vMax >= 1) {
    const half = halfAlongFB(1);
    if (type !== "pyramid" && half > 0.01) {
      const ridge = [new THREE.Vector3(-half, g(1), 0), new THREE.Vector3(half, g(1), 0)];
      ridges.push(ridge);
      ridgeEnds.push(ridge[0]!.clone(), ridge[1]!.clone());
    }
  } else {
    // skirt: a thin ridge line where the skirt meets the upper wall
    const v = vMax;
    const ha = halfAlongFB(v);
    const hb = type === "gable" ? b * (1 - v) : halfAlongLR(v);
    const zz = b * (1 - v);
    const xx = type === "gable" ? a : a - v * b;
    const yy = topY + 0.05;
    ridges.push([
      new THREE.Vector3(-ha, yy, zz),
      new THREE.Vector3(ha, yy, zz),
      new THREE.Vector3(xx, yy, hb),
      new THREE.Vector3(xx, yy, -hb),
      new THREE.Vector3(ha, yy, -zz),
      new THREE.Vector3(-ha, yy, -zz),
      new THREE.Vector3(-xx, yy, -hb),
      new THREE.Vector3(-xx, yy, hb),
      new THREE.Vector3(-ha, yy, zz),
    ]);
  }
  if (type !== "gable") {
    const vHipTop = type === "xieshan" ? Math.min(vg, vMax) : vMax;
    for (const [sx, sz] of [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ] as const) {
      const pts: THREE.Vector3[] = [];
      const n = 12;
      for (let k = 0; k <= n; k++) {
        const v = (k / n) * vHipTop;
        const x = sx * (a - v * b);
        const z = sz * (b - v * b);
        pts.push(new THREE.Vector3(x, y(x, z, v) + 0.02, z));
      }
      ridges.push(pts);
      hipFoots.push(pts.slice(1, 6));
    }
  }
  if (type === "xieshan" && vMax >= 1) {
    // gable ridges running down the gable edges (chuiji)
    const xg = halfAlongFB(1);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 8; k++) {
          const v = vg + ((1 - vg) * k) / 8;
          const z = sz * b * (1 - v);
          pts.push(new THREE.Vector3(sx * xg, g(v) + lift(sx * xg, z) + 0.02, z));
        }
        ridges.push(pts);
      }
    }
  }

  return { top, under, gable, ridges, ridgeEnds, apex, hipFoots };
}

function avgNormalY(geo: THREE.BufferGeometry) {
  const n = geo.getAttribute("normal");
  let s = 0;
  for (let i = 0; i < n.count; i++) s += n.getY(i);
  return s / Math.max(1, n.count);
}

function flip(geo: THREE.BufferGeometry) {
  const idx = geo.getIndex()!;
  const arr = idx.array as unknown as number[];
  for (let i = 0; i < arr.length; i += 3) {
    const t = arr[i + 1]!;
    arr[i + 1] = arr[i + 2]!;
    arr[i + 2] = t;
  }
  idx.needsUpdate = true;
  geo.computeVertexNormals();
}

function orientUp(geo: THREE.BufferGeometry) {
  if (avgNormalY(geo) < 0) flip(geo);
}
function orientDown(geo: THREE.BufferGeometry) {
  if (avgNormalY(geo) > 0) flip(geo);
}
