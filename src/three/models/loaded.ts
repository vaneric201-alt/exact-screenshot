import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/*
 * Realistic models downloaded from Sketchfab (CC BY; authors credited in
 * content/content.ts), compressed with gltf-transform (meshopt + WebP) into
 * public/models. Each one is turned so that its front points along +x and its
 * top along +y, set on the ground (y = 0) and centred, and scaled so its
 * length along x matches the hand-built model it replaces.
 */

export type ModelName = "j20" | "ztz99a" | "df17" | "hq9" | "plz05" | "canyon" | "taihedian";

interface Fit {
  /** Length along +x after fitting (the hand-built models' units). */
  length: number;
  /** Turn applied first, so the front faces +x. */
  rot?: [number, number, number];
  /** Keep the model's own origin height instead of standing it on y = 0. */
  keepY?: boolean;
}

export const FIT: Record<ModelName, Fit> = {
  j20: { length: 2.1, rot: [0, -Math.PI / 2, 0] },
  ztz99a: { length: 2.9, rot: [0, 0, 0] },
  df17: { length: 2.9, rot: [0, Math.PI / 2, 0] },
  hq9: { length: 3.2, rot: [0, Math.PI / 2, 0] },
  plz05: { length: 3.4, rot: [0, Math.PI / 2, 0] },
  canyon: { length: 1, rot: [0, 0, 0] },
  // depth with its platform and steps; this makes the front 60 m wide, as the hand-built hall
  taihedian: { length: 73, rot: [0, 0, 0] },
};

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map<ModelName, Promise<THREE.Group>>();

function prepare(root: THREE.Object3D, name: ModelName) {
  // drop the edge-line overlays some exports carry, and let everything cast and take shadows
  const lines: THREE.Object3D[] = [];
  root.traverse((o) => {
    if ((o as THREE.Line).isLine) lines.push(o);
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const s = mat as THREE.MeshStandardMaterial;
        if (s.map) s.map.anisotropy = 4;
      }
    }
  });
  lines.forEach((l) => l.removeFromParent());
  const fit = FIT[name];
  const turn = new THREE.Group();
  turn.add(root);
  if (fit.rot) turn.rotation.set(...fit.rot);
  const out = new THREE.Group();
  out.name = name;
  out.add(turn);
  out.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(turn);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const s = fit.length / size.x;
  turn.position.set(-centre.x, fit.keepY ? 0 : -box.min.y, -centre.z);
  const scaled = new THREE.Group();
  scaled.add(turn);
  scaled.scale.setScalar(s);
  out.add(scaled);
  return out;
}

/** Load (once) a fitted model; resolves to the shared original — clone it for each use. */
export function loadModel(name: ModelName): Promise<THREE.Group> {
  let p = cache.get(name);
  if (!p) {
    p = loader.loadAsync(`/models/${name}.glb`).then((g) => prepare(g.scene, name));
    cache.set(name, p);
  }
  return p;
}

/** A copy of a fitted model (geometry and materials shared with the original). */
export async function modelCopy(name: ModelName) {
  return (await loadModel(name)).clone(true);
}

/**
 * Replace what a group holds (a hand-built stand-in) with the downloaded model
 * once it arrives, matched to the stand-in's length along x, its ground line
 * and its centre. The stand-in shows until then, and stays if loading fails.
 */
export function upgrade(holder: THREE.Object3D, name: ModelName, onDone?: (m: THREE.Object3D) => void) {
  modelCopy(name)
    .then((m) => {
      holder.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(holder.matrixWorld).invert();
      const rel = new THREE.Matrix4();
      const box = new THREE.Box3();
      holder.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || !mesh.geometry) return;
        mesh.geometry.computeBoundingBox();
        box.union(mesh.geometry.boundingBox!.clone().applyMatrix4(rel.multiplyMatrices(inv, mesh.matrixWorld)));
      });
      if (box.isEmpty()) return;
      const s = (box.max.x - box.min.x) / FIT[name].length;
      m.scale.setScalar(s);
      m.position.set((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2);
      holder.clear();
      holder.add(m);
      onDone?.(m);
    })
    .catch(() => {});
}
