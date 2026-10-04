import * as THREE from "three";
import { loadModel } from "../models/loaded";

/*
 * The Hall of Supreme Harmony from a detailed downloaded model (CC BY,
 * David_Pang on Sketchfab), which comes uncoloured. It is painted here by
 * height and facing, the way the real hall is coloured: white marble terrace
 * and balustrades, vermilion columns and walls, blue-green bracket sets
 * (dougong) under the eaves, yellow glazed tiles on both roofs and their
 * ridges, and painted rafters under the eaves.
 *
 * Heights are fractions of the model's full height, read from a histogram of
 * its vertices (terrace top ≈ 0.25, columns to ≈ 0.50, lower brackets to
 * ≈ 0.55, lower roof to ≈ 0.62, upper brackets to ≈ 0.68, upper roof above).
 */

const C = {
  marble: new THREE.Color("#e6e1d4"),
  red: new THREE.Color("#8c2618"),
  teal: new THREE.Color("#2e6a62"),
  blue: new THREE.Color("#2c4d84"),
  gold: new THREE.Color("#c9a24a"),
  tile: new THREE.Color("#d9a032"),
  rafter: new THREE.Color("#24524c"),
};

function paint(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  // full height, and the footprint of the walls (vertices between 35 % and 45 % of the height)
  let H = 0;
  for (const m of meshes) {
    const p = m.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i += 7) H = Math.max(H, v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).y);
  }
  const core = new THREE.Box3();
  for (const m of meshes) {
    const p = m.geometry.getAttribute("position");
    for (let i = 0; i < p.count; i += 3) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      const h = v.y / H;
      if (h > 0.35 && h < 0.45) core.expandByPoint(v);
    }
  }
  core.expandByScalar(H * 0.01);
  // a plan grid of how far the upright faces at each spot span, from the terrace to the brackets:
  // a column's foot and head are its only vertices, so it is found by place, not by piece —
  // columns and walls span the full height, balustrades and steps only a little of it
  const all = new THREE.Box3().setFromObject(root);
  const G = 320;
  const lowV = new Float32Array(G * G).fill(9);
  const highV = new Float32Array(G * G).fill(-9);
  const cell = (x: number, z: number) => {
    const gx = Math.min(G - 1, Math.max(0, Math.floor(((x - all.min.x) / (all.max.x - all.min.x)) * G)));
    const gz = Math.min(G - 1, Math.max(0, Math.floor(((z - all.min.z) / (all.max.z - all.min.z)) * G)));
    return gz * G + gx;
  };
  for (const m of meshes) {
    const p = m.geometry.getAttribute("position");
    const nn = m.geometry.getAttribute("normal");
    nm.getNormalMatrix(m.matrixWorld);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      const h = v.y / H;
      if (h < 0.05 || h > 0.6) continue;
      if (nn && Math.abs(n.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize().y) > 0.5) continue;
      const k = cell(v.x, v.z);
      if (h < lowV[k]!) lowV[k] = h;
      if (h > highV[k]!) highV[k] = h;
    }
  }
  const upright = (x: number, z: number) => {
    const k = cell(x, z);
    // a column or wall: upright faces from near the terrace to the brackets
    return lowV[k]! < 0.3 && highV[k]! > 0.45;
  };
  const c = new THREE.Color();
  for (const m of meshes) {
    const p = m.geometry.getAttribute("position");
    const nn = m.geometry.getAttribute("normal");
    nm.getNormalMatrix(m.matrixWorld);
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      if (nn) n.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize();
      else n.set(0, 1, 0);
      const h = v.y / H;
      const inside = v.x > core.min.x && v.x < core.max.x && v.z > core.min.z && v.z < core.max.z;
      const grain = 0.92 + 0.08 * Math.sin(v.x * 3.1 + v.z * 2.3) * Math.sin(v.y * 4.7);
      // a column's foot and head (its only vertices) take the column's red, or the shaft would fade to white or blue
      const columnSpot = Math.abs(n.y) < 0.5 && upright(v.x, v.z);
      if (columnSpot && h > 0.15 && h < 0.535) c.copy(C.red);
      else if (h < 0.25) c.copy(C.marble);
      // columns and walls (anything reaching above the balustrades) are red; balustrades and steps stay marble
      else if (h < 0.5) {
        // the beams over the columns are painted blue-green; below them columns and walls red, balustrades marble
        if (h > 0.44 && !inside && !upright(v.x, v.z)) c.copy(Math.sin(v.x * 0.9 + v.z * 0.9) > 0 ? C.teal : C.blue);
        else c.copy(upright(v.x, v.z) || inside ? C.red : C.marble);
      }
      else if (h < 0.55) {
        // bracket sets: alternating blue and green, picked out in gold
        const s = Math.sin(v.x * 1.3) * Math.sin(v.z * 1.3);
        c.copy(n.y < -0.4 ? C.rafter : s > 0.55 ? C.gold : s > 0 ? C.teal : C.blue);
      } else if (h < 0.68) {
        if (n.y > 0.25) c.copy(C.tile);
        else if (n.y < -0.25) c.copy(C.rafter);
        else if (h < 0.62) c.copy(inside ? C.red : C.tile);
        else c.copy(Math.sin(v.x * 1.3) > 0 ? C.teal : C.blue);
      } else if (h < 0.75) c.copy(n.y < -0.25 ? C.rafter : C.tile);
      else c.copy(C.tile);
      c.multiplyScalar(grain);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    m.geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));
  }
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.04, envMapIntensity: 0.7, side: THREE.DoubleSide });
  for (const m of meshes) {
    m.material = mat;
    m.castShadow = true;
    m.receiveShadow = true;
  }
}

/** The painted hall, front to +x, standing on y = 0 (turn and place it in the layout). */
export async function realSupremeHall() {
  const m = (await loadModel("taihedian")).clone(true);
  paint(m);
  return m;
}
