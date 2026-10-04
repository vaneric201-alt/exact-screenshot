import * as THREE from "three";
import { InstanceBin, boxM, type Mats } from "./builders";

/*
 * Palace guardians and gate doors:
 *  - bronze guardian lions (a male with his paw on an embroidered ball, a
 *    female with a cub) on marble Xumizuo plinths,
 *  - bronze cranes and tortoises, symbols of long life, as on the terrace of
 *    the Hall of Supreme Harmony,
 *  - vermilion gate leaves studded with 9 × 9 gilt nails.
 */

export function bronzeMaterial() {
  return new THREE.MeshPhysicalMaterial({ color: "#8a6433", metalness: 0.92, roughness: 0.4, clearcoat: 0.25, clearcoatRoughness: 0.4 });
}

const sph = (r: number, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, seg = 20) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7)), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
};
const cyl = (r0: number, r1: number, h: number, mat: THREE.Material, x: number, y: number, z: number) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 14), mat);
  m.position.set(x, y + h / 2, z);
  return m;
};

/** A seated guardian lion, ≈ 2.4 m tall on a 1.5 m plinth, facing +z. */
export function guardianLion(M: Mats, bronze: THREE.Material, female: boolean) {
  const g = new THREE.Group();
  // Xumizuo plinth: waisted marble base
  g.add(boxM(2.8, 0.35, 2.2, M.marble, 2, 0, 0, 0));
  g.add(boxM(2.4, 0.6, 1.9, M.marble, 2, 0, 0.35, 0));
  g.add(boxM(2.9, 0.4, 2.3, M.marble, 2, 0, 0.95, 0));
  g.add(boxM(2.3, 0.18, 1.8, bronze, 2, 0, 1.35, 0)); // bronze base plate
  const y0 = 1.53;
  const lion = new THREE.Group();
  lion.position.y = y0;
  g.add(lion);
  // haunches and upright chest
  lion.add(sph(0.62, bronze, 0, 0.55, -0.35, 1.25, 0.9, 1.2));
  lion.add(sph(0.52, bronze, 0, 1.15, 0.15, 1.0, 1.35, 0.9));
  // forelegs, straight and strong
  for (const s of [-1, 1]) {
    lion.add(cyl(0.2, 0.17, 1.05, bronze, s * 0.32, 0, 0.42));
    lion.add(sph(0.2, bronze, s * 0.32, 0.08, 0.55, 1.1, 0.6, 1.3)); // paw
    lion.add(sph(0.28, bronze, s * 0.55, 0.3, -0.25, 1, 0.8, 1.3)); // hind paw
  }
  // under one paw: the embroidered ball (male) or a cub (female)
  if (female) {
    lion.add(sph(0.26, bronze, -0.55, 0.32, 0.55, 1.1, 1, 1));
    lion.add(sph(0.16, bronze, -0.55, 0.6, 0.62));
  } else {
    lion.add(sph(0.3, bronze, 0.62, 0.3, 0.62));
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 24), bronze);
    band.position.set(0.62, 0.3, 0.62);
    band.rotation.set(0.6, 0.4, 0);
    lion.add(band);
  }
  // head, big and square-jawed, turned slightly outward
  const head = new THREE.Group();
  head.position.set(0, 1.95, 0.3);
  lion.add(head);
  head.add(sph(0.5, bronze, 0, 0, 0, 1.15, 1, 1));
  head.add(sph(0.3, bronze, 0, -0.12, 0.42, 1.2, 0.75, 0.9)); // muzzle
  head.add(sph(0.22, new THREE.MeshStandardMaterial({ color: "#2b1d10", roughness: 0.8 }), 0, -0.22, 0.52, 1.3, 0.6, 0.6)); // open mouth
  for (const s of [-1, 1]) {
    head.add(sph(0.12, bronze, s * 0.2, 0.12, 0.46)); // bulging eyes
    head.add(sph(0.16, bronze, s * 0.22, 0.28, 0.36, 1.3, 0.6, 1)); // brows
    head.add(sph(0.14, bronze, s * 0.42, 0.3, 0.05, 0.6, 1.1, 0.8)); // ears
  }
  // curled mane: rows of snail-shell curls over the head and neck
  const curl = new THREE.SphereGeometry(0.12, 10, 8);
  for (let row = 0; row < 4; row++) {
    const n = 7 + row * 2;
    for (let k = 0; k < n; k++) {
      const a = -Math.PI * 0.85 + (k / (n - 1)) * Math.PI * 1.7;
      const r = 0.52 + row * 0.07;
      const m = new THREE.Mesh(curl, bronze);
      m.position.set(Math.sin(a) * r, 0.38 - row * 0.28 + Math.cos(a) * 0.12, -Math.cos(a) * r * 0.55 - row * 0.05);
      head.add(m);
    }
  }
  // flame-like tail curling up the back
  for (let k = 0; k < 4; k++) lion.add(sph(0.16 - k * 0.02, bronze, 0, 0.7 + k * 0.18, -0.95 + k * 0.05, 1.3, 0.8, 1));
  if (female) head.rotation.y = -0.25;
  else head.rotation.y = 0.25;
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}

/** A bronze crane with raised head, ≈ 2 m tall, facing +z. */
export function bronzeCrane(bronze: THREE.Material) {
  const g = new THREE.Group();
  g.add(cyl(0.45, 0.4, 0.3, bronze, 0, 0, 0));
  for (const s of [-1, 1]) g.add(cyl(0.035, 0.035, 0.9, bronze, s * 0.12, 0.3, 0));
  g.add(sph(0.35, bronze, 0, 1.35, 0, 0.9, 0.8, 1.5));
  const neck = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.5, 0.35), new THREE.Vector3(0, 1.95, 0.5), new THREE.Vector3(0, 2.3, 0.45)]), 12, 0.06, 8),
    bronze,
  );
  g.add(neck);
  g.add(sph(0.1, bronze, 0, 2.33, 0.48, 1, 0.9, 1.3));
  g.add(cyl(0.035, 0.005, 0.4, bronze, 0, 2.3, 0.55).rotateX(Math.PI / 2.2));
  return g;
}

/** A bronze tortoise-dragon on its plinth, ≈ 1.2 m tall, facing +z. */
export function bronzeTortoise(M: Mats, bronze: THREE.Material) {
  const g = new THREE.Group();
  g.add(boxM(1.8, 0.5, 2.2, M.marble, 2, 0, 0, 0));
  g.add(sph(0.75, bronze, 0, 0.55, 0, 1, 0.55, 1.2));
  g.add(sph(0.2, bronze, 0, 0.95, 0.95, 1, 1, 1.3)); // head raised
  g.add(cyl(0.1, 0.12, 0.35, bronze, 0, 0.6, 0.85));
  for (const [x, z] of [
    [-0.55, 0.55],
    [0.55, 0.55],
    [-0.55, -0.55],
    [0.55, -0.55],
  ] as const)
    g.add(sph(0.18, bronze, x, 0.6, z, 1, 0.6, 1.2));
  return g;
}

/**
 * A pair of vermilion gate leaves with 9 × 9 gilt nails and lion-head knockers,
 * sized to fill an arch opening of width w and height h (flat bottom part).
 */
export function gateDoors(w: number, h: number, M: Mats, bin: InstanceBin, parent: THREE.Object3D, at: THREE.Vector3, bronze: THREE.Material) {
  const g = new THREE.Group();
  g.position.copy(at);
  parent.add(g);
  const leafW = w / 2 - 0.05;
  const leafMat = new THREE.MeshStandardMaterial({ color: "#8f1f18", roughness: 0.45, metalness: 0.05 });
  const nail = () => new THREE.SphereGeometry(0.075, 10, 8);
  const m = new THREE.Matrix4();
  for (const s of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, h, 0.25), leafMat);
    leaf.position.set(s * (leafW / 2 + 0.03), h / 2, 0);
    leaf.castShadow = leaf.receiveShadow = true;
    g.add(leaf);
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const x = s * (0.25 + ((c + 0.5) / 9) * (leafW - 0.4));
        const y = 0.5 + ((r + 0.5) / 9) * (h - 1.0);
        m.makeTranslation(x, y, 0.16);
        bin.add("gate-nail", nail, M.gold, m.clone(), g);
      }
    // knocker (pushou): a bronze mask with a ring
    const mask = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), bronze);
    mask.rotation.x = Math.PI / 2;
    mask.position.set(s * 0.45, h * 0.45, 0.2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 20), bronze);
    ring.position.set(s * 0.45, h * 0.45 - 0.2, 0.24);
    g.add(mask, ring);
  }
  return g;
}

/**
 * The same pair of leaves, but each hung on its own hinge so it can swing
 * open (inwards, away from the viewer). Kept out of the merged static city:
 * turn `hinge.rotation.y` to `hinge.userData.open * angle`.
 */
export function openingGateDoors(w: number, h: number, gold: THREE.Material, bronze: THREE.Material, at: THREE.Vector3) {
  const g = new THREE.Group();
  g.position.copy(at);
  const leafW = w / 2 - 0.05;
  const leafMat = new THREE.MeshStandardMaterial({ color: "#8f1f18", roughness: 0.45, metalness: 0.05 });
  const nailGeo = new THREE.SphereGeometry(0.075, 8, 6);
  const hinges: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(s * (w / 2), 0, 0);
    // swinging inwards: the two leaves turn opposite ways
    hinge.userData["open"] = s < 0 ? 1 : -1;
    g.add(hinge);
    const cx = -s * (leafW / 2 + 0.03);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, h, 0.25), leafMat);
    leaf.position.set(cx, h / 2, 0);
    leaf.castShadow = leaf.receiveShadow = true;
    hinge.add(leaf);
    const nails = new THREE.InstancedMesh(nailGeo, gold, 81);
    const m = new THREE.Matrix4();
    let i = 0;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const x = cx + ((c + 0.5) / 9 - 0.5) * (leafW - 0.4);
        const y = 0.5 + ((r + 0.5) / 9) * (h - 1.0);
        m.makeTranslation(x, y, 0.16);
        nails.setMatrixAt(i++, m);
      }
    nails.castShadow = true;
    hinge.add(nails);
    // knockers sit near the meeting edge of the two leaves
    const kx = cx - s * (leafW / 2 - 0.45);
    const mask = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), bronze);
    mask.rotation.x = Math.PI / 2;
    mask.position.set(kx, h * 0.45, 0.2);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 20), bronze);
    ring.position.set(kx, h * 0.45 - 0.2, 0.24);
    hinge.add(mask, ring);
    hinges.push(hinge);
  }
  return { group: g, hinges };
}

/** A bronze tripod incense burner (ding) with lid and handles, ≈ 1.9 m tall. */
export function bronzeDing(bronze: THREE.Material) {
  const g = new THREE.Group();
  const prof = [
    [0, 0.55],
    [0.5, 0.58],
    [0.66, 0.75],
    [0.7, 1.05],
    [0.62, 1.25],
    [0.66, 1.3],
    [0.55, 1.34],
    [0.3, 1.5],
    [0.12, 1.6],
    [0.14, 1.75],
    [0, 1.9],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 20), bronze));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const leg = cyl(0.09, 0.06, 0.62, bronze, Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    g.add(leg);
  }
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16, Math.PI), bronze);
    h.position.set(s * 0.52, 1.3, 0);
    h.rotation.y = Math.PI / 2;
    g.add(h);
  }
  return g;
}
