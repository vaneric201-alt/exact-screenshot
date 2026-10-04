import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { InstanceBin, balustrade, box, boxM, hall, wall, type Mats } from "./builders";
import { bronzeCrane, bronzeDing, bronzeMaterial, bronzeTortoise, gateDoors, guardianLion, openingGateDoors } from "./guardians";

/*
 * Layout of the Forbidden City and its surroundings, in metres.
 * x = east, z = south, y = up; the origin is the centre of the walled palace.
 *
 * Sources for the numbers (see docs/flyover-sources.md):
 *  - walled palace 961 m N–S × 753 m E–W, wall 7.9 m high, moat 52 m wide
 *  - Meridian Gate 37.95 m high, central hall 60.05 × 25 m, U-shaped with two wings
 *  - first courtyard ≈ 140 × 200 m with the Inner Golden Water River and 5 bridges
 *  - Hall of Supreme Harmony ≈ 64 × 37 m, 35 m above the square, on an ≈ 8 m
 *    three-tier marble terrace, square in front ≈ 30,000 m²
 *  - Imperial Garden ≈ 140 × 90 m; Jingshan hill to the north
 */

const HALF_X = 376;
const HALF_Z = 480;
const WALL_H = 9.9;
const WALL_T = 8.6;
const MOAT_IN = 20; // gap between wall face and moat
const MOAT_W = 52;

export interface CityParts {
  staticRoot: THREE.Group;
  instanced: THREE.InstancedMesh[];
  water: THREE.Mesh[];
  /** The Meridian Gate's central doors, which swing open as the camera flies in. */
  gate: { group: THREE.Group; hinges: THREE.Group[] };
  /** The hand-built Hall of Supreme Harmony, kept apart so the detailed model can replace it. */
  supreme: THREE.Group;
}

export function buildCity(M: Mats, foliageMat: THREE.MeshStandardMaterial, trunkMat: THREE.Material): CityParts {
  const root = new THREE.Group();
  const bin = new InstanceBin();
  const water: THREE.Mesh[] = [];
  const trees: TreeSpec[] = [];
  const rnd = mulberry(20260927);
  // the Hall of Supreme Harmony is built on its own, so the detailed model can take its place
  const supremeRoot = new THREE.Group();
  const supremeBin = new InstanceBin();

  // ---------------- ground, moat & lake beds ----------------
  // The city ground is one shape with holes cut for the moat and the lakes, so
  // water planes below it show only where the real water is.
  const mo = HALF_X + WALL_T / 2 + MOAT_IN;
  const mzo = HALF_Z + WALL_T / 2 + MOAT_IN;
  const tab = 105; // the Meridian Gate forecourt crosses the moat line
  const moatOuter: [number, number][] = [
    [-mo - MOAT_W, -mzo - MOAT_W],
    [mo + MOAT_W, -mzo - MOAT_W],
    [mo + MOAT_W, mzo + MOAT_W],
    [tab, mzo + MOAT_W],
    [tab, mzo],
    [-tab, mzo],
    [-tab, mzo + MOAT_W],
    [-mo - MOAT_W, mzo + MOAT_W],
  ];
  const island: [number, number][] = [
    [-mo, -mzo],
    [mo, -mzo],
    [mo, mzo],
    [-mo, mzo],
  ];
  const lakePolys = lakeOutlines();
  const groundShape = new THREE.Shape(
    [
      [-3500, -3500],
      [3500, -3500],
      [3500, 3500],
      [-3500, 3500],
    ].map(([x, z]) => new THREE.Vector2(x!, -z!)),
  );
  groundShape.holes.push(toPath(moatOuter));
  for (const lp of lakePolys) groundShape.holes.push(toPath(lp));
  root.add(shapeMesh(groundShape, M.ground, -0.05, 40));
  root.add(shapeMesh(new THREE.Shape(island.map(([x, z]) => new THREE.Vector2(x, -z))), M.ground, -0.05, 40));
  const inner = new THREE.Mesh(planeXZ(HALF_X * 2 - WALL_T, HALF_Z * 2 - WALL_T, 4.8), M.paving);
  inner.position.y = 0.04;
  root.add(inner);
  // water under the moat hole, and stone embankments around both edges
  const moatWater = new THREE.Mesh(planeXZ((mo + MOAT_W) * 2, (mzo + MOAT_W) * 2, 40), M.water);
  moatWater.position.y = -1.1;
  moatWater.receiveShadow = true;
  water.push(moatWater);
  const moatBed = moatWater.clone();
  moatBed.material = M.arch;
  moatBed.position.y = -1.7;
  root.add(moatBed);
  root.add(new THREE.Mesh(polyWall(moatOuter, -1.7, 0), M.marble));
  root.add(new THREE.Mesh(polyWall(island, -1.7, 0), M.marble));
  // willows along the outer bank
  for (let i = 0; i < moatOuter.length; i++) {
    const [ax, az] = moatOuter[i]!;
    const [bx, bz] = moatOuter[(i + 1) % moatOuter.length]!;
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 60) continue;
    const n = Math.floor(len / 15);
    const nx = Math.sign(ax + bx) * (Math.abs(bx - ax) < 1 ? 1 : 0);
    const nz = Math.sign(az + bz) * (Math.abs(bz - az) < 1 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const tx = ax + (bx - ax) * t + nx * 9;
      const tz = az + (bz - az) * t + nz * 9;
      if (tz > 0 && Math.abs(tx) < 130) continue; // keep the Meridian Gate forecourt clear
      if (tz < 0 && Math.abs(tx) < 260) continue; // and the foreground of the view from Jingshan
      trees.push({ x: tx, z: tz, s: 0.9 + rnd() * 0.3, kind: 2 });
    }
  }

  // ---------------- outer walls, corner towers, side gates ----------------
  wall(-HALF_X, -HALF_Z, HALF_X, -HALF_Z, WALL_H, WALL_T, M, bin, root);
  wall(-HALF_X, HALF_Z, -64, HALF_Z, WALL_H, WALL_T, M, bin, root);
  wall(64, HALF_Z, HALF_X, HALF_Z, WALL_H, WALL_T, M, bin, root);
  wall(-HALF_X, -HALF_Z, -HALF_X, HALF_Z, WALL_H, WALL_T, M, bin, root);
  wall(HALF_X, -HALF_Z, HALF_X, HALF_Z, WALL_H, WALL_T, M, bin, root);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cornerTower(sx * HALF_X, sz * HALF_Z, M, bin, root);
  // East & West Glorious Gates
  for (const sx of [-1, 1]) gateOnWall(sx * HALF_X, 380, 90, M, bin, root, 40, 18);
  // Gate of Divine Might (north)
  gateOnWall(0, -HALF_Z, 0, M, bin, root, 70, 28, true);

  // ---------------- Meridian Gate (Wumen) ----------------
  const gate = meridianGate(M, bin, root);

  // ---------------- forecourt south of the Meridian Gate ----------------
  const fore = new THREE.Mesh(planeXZ(124, 330, 4.8), M.paving);
  fore.position.set(0, 0.03, 500 + 165);
  root.add(fore);
  const way = new THREE.Mesh(planeXZ(9, 1700, 3), M.imperialWay);
  way.position.set(0, 0.06, 150);
  root.add(way);
  for (const sx of [-1, 1]) {
    // long side offices (chaofang) lining the forecourt
    const g = hall({ w: 180, d: 8, bays: 30, baysD: 1, colH: 4.2, roof: "gable", roofH: 3, base: 0.6 }, M, bin);
    g.group.rotation.y = Math.PI / 2;
    g.group.position.set(sx * 58, 0, 720);
    root.add(g.group);
  }
  // Duanmen and Tiananmen further south (seen in the final panorama)
  cityGateTower(0, 830, M, bin, root);
  cityGateTower(0, 1090, M, bin, root);
  wall(-62, 600, -62, 1090, 8, 6, M, bin, root);
  wall(62, 600, 62, 1090, 8, 6, M, bin, root);
  // Chang'an Avenue and the square
  const avenue = new THREE.Mesh(planeXZ(6000, 90, 20), M.greyWall);
  avenue.position.set(0, 0.02, 1170);
  root.add(avenue);
  const square = new THREE.Mesh(planeXZ(500, 800, 6), M.imperialWay);
  square.position.set(0, 0.03, 1620);
  root.add(square);
  const obelisk = box(8, 38, 8, M.marble, 0, 0, 1520);
  root.add(obelisk);

  // ---------------- first courtyard & Golden Water River ----------------
  goldenWater(M, bin, root, water);
  for (const sx of [-1, 1]) {
    const g = hall({ w: 118, d: 9, bays: 22, baysD: 1, colH: 4.6, roof: "gable", roofH: 3.2, base: 0.8 }, M, bin);
    g.group.rotation.y = Math.PI / 2;
    g.group.position.set(sx * 104, 0, 388);
    root.add(g.group);
  }

  // ---------------- Gate of Supreme Harmony ----------------
  {
    const base = new THREE.Group();
    base.add(boxM(62, 3.4, 34, M.marble, 3));
    balustrade(0, 0, 62, 34, 3.4, M, bin, base, 14);
    const g = hall({ w: 44, d: 18, bays: 9, baysD: 4, colH: 7.8, roof: "xieshan", roofH: 6.2, double: true, base: 0.6, figures: 7 }, M, bin);
    g.group.position.y = 3.4;
    base.add(g.group);
    base.position.set(0, 0, 312);
    root.add(base);
    for (const sx of [-1, 1]) {
      const side = hall({ w: 22, d: 10, bays: 5, colH: 5.5, roof: "xieshan", roofH: 4, base: 1.4, figures: 5 }, M, bin);
      side.group.position.set(sx * 82, 0, 312);
      root.add(side.group);
    }
  }

  // ---------------- courtyard of the Hall of Supreme Harmony ----------------
  // galleries enclosing a ≈ 200 m square
  for (const sx of [-1, 1]) {
    const g = hall({ w: 170, d: 10, bays: 30, baysD: 1, colH: 5, roof: "gable", roofH: 3.4, base: 0.8 }, M, bin);
    g.group.rotation.y = Math.PI / 2;
    g.group.position.set(sx * 118, 0, 190);
    root.add(g.group);
    // Pavilions of Embodying Benevolence / Spreading Righteousness
    const p = hall({ w: 32, d: 13, bays: 9, baysD: 3, colH: 7, roof: "xieshan", roofH: 5.2, double: true, base: 1.6, figures: 5 }, M, bin);
    p.group.rotation.y = -sx * Math.PI / 2;
    p.group.position.set(sx * 104, 0, 190);
    root.add(p.group);
    const s = hall({ w: 58, d: 9, bays: 11, baysD: 1, colH: 4.8, roof: "gable", roofH: 3.2, base: 0.8 }, M, bin);
    s.group.position.set(sx * 80, 0, 305);
    root.add(s.group);
  }

  // ---------------- the three-tier terrace and the three great halls ----------------
  terrace(M, bin, root);
  {
    const t = hall(
      { w: 60, d: 33, bays: 11, baysD: 5, colH: 8.5, roof: "hip", roofH: 8.2, double: true, base: 1.2, figures: 10, curve: 1.7 },
      M,
      supremeBin,
    );
    t.group.position.set(0, 8.1, 48);
    supremeRoot.add(t.group);
    const c = hall({ w: 22, d: 22, bays: 5, colH: 6.8, roof: "pyramid", roofH: 7.2, base: 1.2, figures: 7, finial: true }, M, bin);
    c.group.position.set(0, 8.1, -18);
    root.add(c.group);
    const b = hall({ w: 44, d: 22, bays: 9, baysD: 5, colH: 7.2, roof: "xieshan", roofH: 6.4, double: true, base: 1.2, figures: 9 }, M, bin);
    b.group.position.set(0, 8.1, -82);
    root.add(b.group);
  }
  // bronze tripod burners (ding) on the terrace
  const dingBronze = bronzeMaterial();
  for (let i = 0; i < 18; i++) {
    const sx = i % 2 ? 1 : -1;
    const k = Math.floor(i / 2);
    const x = sx * (40 - (k % 3) * 6);
    const z = 78 - Math.floor(k / 3) * 40;
    const ding = bronzeDing(dingBronze);
    ding.position.set(x, 8.1, z);
    root.add(ding);
  }

  // ---------------- bronze guardians ----------------
  {
    const bronze = bronzeMaterial();
    const pair = (x: number, y: number, z: number, s: number, rotY = 0) => {
      for (const sx of [-1, 1]) {
        // the male (ball) stands on the east side, the female (cub) on the west
        const l = guardianLion(M, bronze, sx < 0);
        l.scale.setScalar(s);
        l.position.set(sx * x, y, z);
        l.rotation.y = rotY;
        root.add(l);
      }
    };
    pair(16, 3.4, 325, 1.15); // Gate of Supreme Harmony (historical)
    pair(22, 0, 1124, 1.5); // Tiananmen (historical)
    pair(18, 0, 515, 1.7); // Meridian Gate approach (artistic licence, for the opening shot)
    // cranes and tortoises on the top tier in front of the Hall of Supreme Harmony
    for (const sx of [-1, 1]) {
      const c = bronzeCrane(bronze);
      c.scale.setScalar(1.8);
      c.position.set(sx * 24, 8.1, 74);
      root.add(c);
      const t = bronzeTortoise(M, bronze);
      t.scale.setScalar(1.7);
      t.position.set(sx * 17, 8.1, 76);
      root.add(t);
    }
  }

  // ---------------- Inner Court ----------------
  {
    const qqm = new THREE.Group();
    qqm.add(boxM(52, 1.6, 26, M.marble, 3));
    const g = hall({ w: 36, d: 15, bays: 5, colH: 7, roof: "xieshan", roofH: 5.4, base: 0.4, figures: 7 }, M, bin);
    g.group.position.y = 1.6;
    qqm.add(g.group);
    qqm.position.set(0, 0, -178);
    root.add(qqm);
    // the wall of the Inner Court runs across the palace through the gate
    wall(-HALF_X, -178, -26, -178, 7, 2.4, M, bin, root);
    wall(26, -178, HALF_X, -178, 7, 2.4, M, bin, root);

    const ter = new THREE.Group();
    ter.add(boxM(96, 1.8, 150, M.marble, 3));
    balustrade(0, 0, 96, 150, 1.8, M, bin, ter, 12);
    ter.position.set(0, 0, -270);
    root.add(ter);
    const q = hall({ w: 46, d: 22, bays: 9, baysD: 5, colH: 7.4, roof: "hip", roofH: 7, double: true, base: 1.1, figures: 9 }, M, bin);
    q.group.position.set(0, 1.8, -226);
    root.add(q.group);
    const j = hall({ w: 14, d: 14, bays: 3, colH: 5.2, roof: "pyramid", roofH: 5.4, base: 0.8, finial: true, figures: 5 }, M, bin);
    j.group.position.set(0, 1.8, -268);
    root.add(j.group);
    const kq = hall({ w: 42, d: 18, bays: 9, baysD: 3, colH: 7, roof: "hip", roofH: 6.4, double: true, base: 1, figures: 9 }, M, bin);
    kq.group.position.set(0, 1.8, -310);
    root.add(kq.group);
    for (const sx of [-1, 1]) {
      const gal = hall({ w: 180, d: 9, bays: 32, baysD: 1, colH: 4.4, roof: "gable", roofH: 3, base: 0.6 }, M, bin);
      gal.group.rotation.y = Math.PI / 2;
      gal.group.position.set(sx * 72, 0, -270);
      root.add(gal.group);
    }
    wall(-72, -362, 72, -362, 6.5, 2.2, M, bin, root);
    const kn = hall({ w: 20, d: 9, bays: 5, colH: 5, roof: "xieshan", roofH: 4, base: 0.8 }, M, bin);
    kn.group.position.set(0, 0, -362);
    root.add(kn.group);
  }

  // ---------------- Imperial Garden ----------------
  {
    const garden = new THREE.Mesh(planeXZ(140, 92, 6), M.ground);
    garden.position.set(0, 0.07, -418);
    root.add(garden);
    const qa = hall({ w: 30, d: 16, bays: 5, colH: 6, roof: "hip", roofH: 5, base: 1.4, figures: 5 }, M, bin);
    qa.group.position.set(0, 0, -425);
    root.add(qa.group);
    // rockery with the Pavilion of Imperial View on top
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(9, 1), M.greyWall);
    rock.scale.set(1.4, 0.9, 1);
    rock.position.set(48, 4, -452);
    root.add(rock);
    const pv = hall({ w: 5, d: 5, bays: 1, colH: 3, roof: "pyramid", roofH: 3, base: 0.3, finial: true }, M, bin);
    pv.group.position.set(48, 11.5, -452);
    root.add(pv.group);
    for (const sx of [-1, 1]) {
      const p = hall({ w: 10, d: 10, bays: 3, colH: 4, roof: "pyramid", roofH: 4.6, base: 0.8, finial: true, figures: 3 }, M, bin);
      p.group.position.set(sx * 45, 0, -405);
      root.add(p.group);
    }
    for (let i = 0; i < 70; i++) {
      trees.push({ x: (rnd() - 0.5) * 128, z: -418 + (rnd() - 0.5) * 80, s: 0.7 + rnd() * 0.4, kind: rnd() < 0.7 ? 1 : 0 });
    }
  }

  // ---------------- east & west palace quarters ----------------
  sideQuarters(M, bin, root, rnd, trees);

  // ---------------- Jingshan, Beihai, Zhongnanhai ----------------
  jingshan(M, bin, root, rnd, trees);
  lakes(M, bin, root, water, rnd, trees);

  // ---------------- city fabric (hutong courtyard houses) ----------------
  const cityInstanced = hutongs(M, rnd, trees);

  // ---------------- trees ----------------
  const treeMeshes = buildTrees(trees, foliageMat, trunkMat, rnd);

  // Bake every static mesh into one geometry per material.
  const binMeshes = bin.build(root);
  const merged = mergeByMaterial(root);
  const supremeInst = supremeBin.build(supremeRoot);
  const supreme = mergeByMaterial(supremeRoot);
  supremeInst.forEach((m) => supreme.add(m));
  return { staticRoot: merged, instanced: [...binMeshes, ...cityInstanced, ...treeMeshes], water, gate, supreme };
}

// =====================================================================

function meridianGate(M: Mats, bin: InstanceBin, root: THREE.Group) {
  const g = new THREE.Group();
  const H = 12.4;
  // central block, with the middle passage cut right through it so the
  // camera can fly in; the two protruding wings (que)
  const cw = 2.86; // half width of the central passage (the 5.2 m arch × 1.1)
  const cSide = 6.8; // top of its straight sides
  const block = new THREE.Shape();
  block.moveTo(-63, 0);
  block.lineTo(-cw, 0);
  block.lineTo(-cw, cSide);
  block.absarc(0, cSide, cw, Math.PI, 0, true);
  block.lineTo(cw, 0);
  block.lineTo(63, 0);
  block.lineTo(63, H);
  block.lineTo(-63, H);
  block.closePath();
  const blockGeo = new THREE.ExtrudeGeometry(block, { depth: 38, bevelEnabled: false, curveSegments: 16 });
  blockGeo.translate(0, 0, 461);
  metreUVs(blockGeo, 4);
  g.add(new THREE.Mesh(blockGeo, M.plaster));
  for (const sx of [-1, 1]) g.add(boxM(25, H, 92, M.plaster, 4, sx * 50.5, 0, 545));
  // marble base course and top parapet
  // (the base course stops at the central passage, whose floor is the imperial way)
  for (const sx of [-1, 1]) g.add(boxM(64 - cw, 1, 40, M.marble, 3, sx * (cw + (64 - cw) / 2), 0, 480));
  for (const sx of [-1, 1]) {
    g.add(boxM(27, 1, 94, M.marble, 3, sx * 50.5, 0, 545));
    g.add(boxM(25.4, 1.1, 92.4, M.plaster, 4, sx * 50.5, H, 545));
  }
  g.add(boxM(126.4, 1.1, 38.4, M.plaster, 4, 0, H, 480));
  // five arched openings: three in the centre, one on each inner wing face
  const archShape = new THREE.Shape();
  const aw = 5.2;
  const ah = 8.6;
  archShape.moveTo(-aw / 2, 0);
  archShape.lineTo(-aw / 2, ah - aw / 2);
  archShape.absarc(0, ah - aw / 2, aw / 2, Math.PI, 0, true);
  archShape.lineTo(aw / 2, 0);
  const archGeo = new THREE.ShapeGeometry(archShape, 12);
  // marble arch trims round each opening
  const trimShape = new THREE.Shape();
  const tw = aw + 1.4;
  trimShape.moveTo(-tw / 2, 0);
  trimShape.lineTo(-tw / 2, ah - aw / 2);
  trimShape.absarc(0, ah - aw / 2, tw / 2, Math.PI, 0, true);
  trimShape.lineTo(tw / 2, 0);
  trimShape.holes.push(archShape);
  const trimGeo = new THREE.ExtrudeGeometry(trimShape, { depth: 0.35, bevelEnabled: false, curveSegments: 14 });
  const bronze = bronzeMaterial();
  let doors: ReturnType<typeof openingGateDoors> | null = null;
  for (const x of [-11, 0, 11]) {
    const s = x === 0 ? 1.1 : 0.95;
    const t = new THREE.Mesh(trimGeo, M.marble);
    t.position.set(x, 0.2, 499.0);
    t.scale.setScalar(s);
    g.add(t);
    if (x === 0) {
      // the central doors open onto the real passage behind them
      doors = openingGateDoors(aw * s * 0.96, (ah - aw / 2) * s, M.gold, bronze, new THREE.Vector3(x, 0.06, 499.25));
      continue;
    }
    const a = new THREE.Mesh(archGeo, M.arch);
    a.position.set(x, 0.2, 499.1);
    a.scale.setScalar(s);
    g.add(a);
    // vermilion leaves with 9 × 9 gilt nails, closed under the dark vault
    gateDoors(aw * s * 0.96, (ah - aw / 2) * s, M, bin, g, new THREE.Vector3(x, 0.2, 499.25), bronze);
  }
  for (const sx of [-1, 1]) {
    const a = new THREE.Mesh(archGeo, M.arch);
    a.position.set(sx * 37.9, 0.2, 505);
    a.rotation.y = sx * -Math.PI / 2;
    a.scale.setScalar(0.85);
    g.add(a);
  }
  // central hall: 9 bays, double eaves, hip roof — the gate reaches ≈ 38 m
  const hallTop = hall({ w: 58, d: 22, bays: 9, baysD: 5, colH: 7.4, roof: "hip", roofH: 7, double: true, base: 0.8, figures: 9 }, M, bin);
  hallTop.group.position.set(0, H + 1.1, 480);
  g.add(hallTop.group);
  // the "five phoenix towers": 13-bay galleries and square pavilions on the wings
  for (const sx of [-1, 1]) {
    const gal = hall({ w: 62, d: 10, bays: 13, baysD: 2, colH: 5, roof: "xieshan", roofH: 4, base: 0.4, figures: 3 }, M, bin);
    gal.group.rotation.y = Math.PI / 2;
    gal.group.position.set(sx * 50.5, H + 1.1, 543);
    g.add(gal.group);
    for (const z of [503, 584]) {
      const p = hall({ w: 13, d: 13, bays: 3, colH: 5.4, roof: "pyramid", roofH: 5.2, double: true, base: 0.4, finial: true, figures: 5 }, M, bin);
      p.group.position.set(sx * 50.5, H + 1.1, z);
      g.add(p.group);
    }
  }
  root.add(g);
  return doors!;
}

/** Give a geometry UVs in metres, projected from the side each face points to (as boxM does). */
function metreUVs(geo: THREE.BufferGeometry, scale: number) {
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    if (ny > 0.5) uv.setXY(i, px / scale, pz / scale);
    else if (nx > 0.5) uv.setXY(i, pz / scale, py / scale);
    else uv.setXY(i, px / scale, py / scale);
  }
}

function goldenWater(M: Mats, bin: InstanceBin, root: THREE.Group, water: THREE.Mesh[]) {
  // A bow-shaped channel across the first courtyard.
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = -96 + (192 * i) / 40;
    const z = 395 + 22 * (1 - (x / 96) ** 2);
    pts.push(new THREE.Vector3(x, 0, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const width = 11;
  const shape = ribbon(curve, width, 80);
  const w = new THREE.Mesh(shape, M.water);
  w.position.y = 0.1;
  water.push(w);
  // channel walls: marble ribbons at both edges, with balustrades
  for (const s of [-1, 1]) {
    const edge = offsetCurve(curve, (s * width) / 2, 80);
    const wallGeo = ribbonWall(edge, 0.55);
    const wm = new THREE.Mesh(wallGeo, M.marble);
    wm.position.y = 0;
    root.add(wm);
    edge.getSpacedPoints(120).forEach((p) => {
      if (Math.abs(p.x) < 34) return; // bridges
      const m = new THREE.Matrix4().makeTranslation(p.x, 0.05, p.z);
      bin.add("baluster-low", () => {
        const g = new THREE.BoxGeometry(0.24, 1, 0.24);
        g.translate(0, 0.5, 0);
        return g;
      }, M.marble, m, root);
    });
  }
  // five marble bridges
  for (const x of [-26, -13, 0, 13, 26]) {
    const zc = 395 + 22 * (1 - (x / 96) ** 2);
    const bw = x === 0 ? 7 : 5.5;
    const prof = new THREE.Shape();
    const L = 9;
    prof.moveTo(-L, -0.6);
    for (let k = 0; k <= 16; k++) {
      const zz = -L + (2 * L * k) / 16;
      prof.lineTo(zz, 1.6 * (1 - (zz / L) ** 2) + 0.2);
    }
    prof.lineTo(L, -0.6);
    for (let k = 16; k >= 0; k--) {
      const zz = -L * 0.7 + (1.4 * L * k) / 16;
      prof.lineTo(zz, 1.1 * (1 - (zz / (L * 0.7)) ** 2) - 0.6);
    }
    const deckGeo = new THREE.ExtrudeGeometry(prof, { depth: bw, bevelEnabled: false, curveSegments: 1 });
    deckGeo.translate(0, 0, -bw / 2);
    deckGeo.rotateY(Math.PI / 2);
    const deck = new THREE.Mesh(deckGeo, M.marble);
    deck.position.set(x, 0, zc);
    root.add(deck);
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 16), M.marble);
      rail.position.set(x + (s * bw) / 2, 2.2, zc);
      rail.scale.set(1, 0.8, 0.95);
      root.add(rail);
    }
  }
}

function terrace(M: Mats, bin: InstanceBin, root: THREE.Group) {
  const g = new THREE.Group();
  const w0 = 130;
  const z0 = 88;
  const z1 = -128;
  const d0 = z0 - z1;
  const cz = (z0 + z1) / 2;
  for (let t = 0; t < 3; t++) {
    const inset = t * 5.5;
    const y = t * 2.7;
    g.add(boxM(w0 - inset * 2, 2.7, d0 - inset * 2, M.marble, 3, 0, y, cz));
    const top = new THREE.Mesh(planeXZ(w0 - inset * 2 - 1, d0 - inset * 2 - 1, 4.8), M.paving);
    top.position.set(0, y + 2.72, cz);
    g.add(top);
    balustrade(0, cz, w0 - inset * 2 - 0.6, d0 - inset * 2 - 0.6, y + 2.7, M, bin, g, 16);
  }
  // front and back stairways: a carved imperial ramp between two flights of steps
  for (const [zEdge, dir] of [
    [z0, 1],
    [z1, -1],
  ] as const) {
    for (let t = 0; t < 3; t++) {
      const inset = t * 5.5;
      const yTop = (t + 1) * 2.7;
      const zStart = zEdge - dir * inset;
      const run = 5.5;
      const steps = 12;
      for (let k = 0; k < steps; k++) {
        const h = yTop - (k * 2.7) / steps;
        const zz = zStart + dir * (run * (k + 0.5)) / steps;
        for (const sx of [-1, 1]) g.add(boxM(4.2, h - t * 2.7, run / steps + 0.02, M.marble, 3, sx * 5.2, t * 2.7, zz));
      }
      // central ramp: a sloped carved slab
      const len = Math.hypot(run, 2.7);
      const slab = boxM(5, 0.5, len, M.imperialWay, 3, 0, 0, 0);
      slab.position.set(0, t * 2.7 + 1.35, zStart + (dir * run) / 2);
      slab.rotation.x = dir * Math.atan2(2.7, run);
      g.add(slab);
    }
  }
  root.add(g);
}

function cornerTower(x: number, z: number, M: Mats, bin: InstanceBin, root: THREE.Group) {
  const g = new THREE.Group();
  g.position.set(x, WALL_H, z);
  // cross-shaped pavilion with crossing hip-and-gable roofs and a pyramid on top
  const core = hall({ w: 12, d: 12, bays: 3, colH: 4.2, roof: "pyramid", roofH: 5.8, base: 0.4, finial: true, double: true, figures: 5 }, M, bin);
  g.add(core.group);
  for (const r of [0, Math.PI / 2]) {
    const wing = hall({ w: 22, d: 7, bays: 5, colH: 3.6, roof: "xieshan", roofH: 3.4, base: 0.4, figures: 3 }, M, bin);
    wing.group.rotation.y = r;
    g.add(wing.group);
  }
  root.add(g);
}

function gateOnWall(x: number, z: number, _dir: number, M: Mats, bin: InstanceBin, root: THREE.Group, w: number, d: number, northFacing = false) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  if (Math.abs(x) > 1) g.rotation.y = Math.PI / 2;
  g.add(boxM(w, 11, d, M.plaster, 4));
  g.add(boxM(w + 1, 1, d + 1, M.marble, 3));
  const h = hall({ w: w * 0.62, d: d * 0.55, bays: 5, colH: 5.6, roof: "hip", roofH: 5, double: true, base: 0.6, figures: 7 }, M, bin);
  h.group.position.y = 11;
  if (northFacing) h.group.rotation.y = Math.PI;
  g.add(h.group);
  root.add(g);
}

function cityGateTower(x: number, z: number, M: Mats, bin: InstanceBin, root: THREE.Group) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(boxM(118, 13, 40, M.plaster, 4));
  g.add(boxM(119, 1, 41, M.marble, 3));
  const h = hall({ w: 58, d: 24, bays: 9, baysD: 5, colH: 7, roof: "xieshan", roofH: 6.6, double: true, base: 1, figures: 9 }, M, bin);
  h.group.position.y = 13;
  g.add(h.group);
  for (const sx of [-1, 1]) {
    const wm = boxM(700, 9, 8, M.plaster, 4, sx * 409, 0, 0);
    g.add(wm);
  }
  root.add(g);
}

// ---------------- side quarters: compounds of smaller palaces ----------------

function sideQuarters(M: Mats, _bin: InstanceBin, root: THREE.Group, rnd: () => number, trees: TreeSpec[]) {
  // Each compound: an enclosing wall and 2–3 halls. Built once per variant and
  // instanced, so hundreds of halls cost only a handful of draw calls.
  const variants = [0, 1, 2].map((v) => {
    const g = new THREE.Group();
    const local = new InstanceBin();
    const cw = 46 + v * 6;
    const cd = 58 + v * 4;
    wall(-cw / 2, -cd / 2, cw / 2, -cd / 2, 5.4, 1.6, M, local, g);
    wall(-cw / 2, cd / 2, -3, cd / 2, 5.4, 1.6, M, local, g);
    wall(3, cd / 2, cw / 2, cd / 2, 5.4, 1.6, M, local, g);
    wall(-cw / 2, -cd / 2, -cw / 2, cd / 2, 5.4, 1.6, M, local, g);
    wall(cw / 2, -cd / 2, cw / 2, cd / 2, 5.4, 1.6, M, local, g);
    const main = hall({ w: cw * 0.6, d: 12, bays: 5, colH: 4.8, roof: v === 1 ? "hip" : "xieshan", roofH: 4, base: 0.8 }, M, local);
    main.group.position.set(0, 0, -cd * 0.12);
    g.add(main.group);
    const back = hall({ w: cw * 0.55, d: 10, bays: 5, colH: 4.2, roof: "gable", roofH: 3.4, base: 0.6 }, M, local);
    back.group.position.set(0, 0, -cd * 0.38);
    g.add(back.group);
    for (const sx of [-1, 1]) {
      const side = hall({ w: 14, d: 7, bays: 3, colH: 3.6, roof: "gable", roofH: 2.6, base: 0.4 }, M, local);
      side.group.rotation.y = Math.PI / 2;
      side.group.position.set(sx * cw * 0.34, 0, cd * 0.15);
      g.add(side.group);
    }
    for (const im of local.build(g)) g.add(bakeInstances(im));
    return { group: mergeByMaterial(g), cw, cd };
  });

  const placements: THREE.Matrix4[][] = [[], [], []];
  const zones: [number, number, number, number][] = [
    // x0, x1, z0, z1 (keep clear of the central axis courts)
    [128, 362, -462, -196],
    [-362, -128, -462, -196],
    [128, 362, -150, 300],
    [-362, -128, -150, 300],
    [84, 362, -470, -372],
    [-362, -84, -470, -372],
  ];
  for (const [x0, x1, z0, z1] of zones) {
    for (let z = z0 + 34; z < z1 - 30; z += 68) {
      for (let x = x0 + 28; x < x1 - 24; x += 58) {
        if (rnd() < 0.08) {
          trees.push({ x, z, s: 1, kind: 1 });
          continue;
        }
        const v = Math.floor(rnd() * 3);
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(x + (rnd() - 0.5) * 4, 0, z + (rnd() - 0.5) * 4),
          new THREE.Quaternion(),
          new THREE.Vector3(1, 1, 1),
        );
        placements[v]!.push(m);
        if (rnd() < 0.5) trees.push({ x: x + (rnd() - 0.5) * 20, z: z + 12, s: 0.8, kind: rnd() < 0.5 ? 0 : 1 });
      }
    }
  }
  variants.forEach((v, i) => {
    const ms = placements[i]!;
    v.group.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const im = new THREE.InstancedMesh(mesh.geometry, mesh.material, ms.length);
      ms.forEach((m, k) => im.setMatrixAt(k, m));
      im.castShadow = true;
      im.receiveShadow = true;
      im.computeBoundingSphere();
      root.add(im);
    });
  });
}

// ---------------- Jingshan ----------------

function jingshan(M: Mats, bin: InstanceBin, root: THREE.Group, rnd: () => number, trees: TreeSpec[]) {
  const cz = -792;
  const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.ground);
  hill.scale.set(230, 46, 120);
  hill.position.set(0, 0, cz);
  const pos = hill.geometry.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const n = Math.sin(pos.getX(i) * 9) * 0.03 + Math.cos(pos.getZ(i) * 7) * 0.03;
    pos.setY(i, Math.max(0, y + n * y));
  }
  hill.geometry.computeVertexNormals();
  root.add(hill);
  // Wanchun pavilion on the summit, four smaller pavilions along the ridge
  const top = hall({ w: 14, d: 14, bays: 3, colH: 4.6, roof: "pyramid", roofH: 6, double: true, base: 0.6, finial: true, figures: 5 }, M, bin);
  top.group.position.set(0, 45.4, cz);
  root.add(top.group);
  for (const [x, s] of [
    [-78, 0.75],
    [78, 0.75],
    [-150, 0.6],
    [150, 0.6],
  ] as const) {
    const y = 46 * Math.sqrt(Math.max(0, 1 - (x / 230) ** 2)) - 0.6;
    const p = hall({ w: 9 * s + 2, d: 9 * s + 2, bays: 3, colH: 3.6, roof: "pyramid", roofH: 4.2, base: 0.4, finial: true }, M, bin);
    p.group.position.set(x, y, cz);
    root.add(p.group);
  }
  for (let i = 0; i < 520; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    const x = Math.cos(a) * r * 225;
    const z = cz + Math.sin(a) * r * 115;
    if (Math.abs(x) < 12 && Math.abs(z - cz) < 12) continue;
    const hy = 46 * Math.sqrt(Math.max(0, 1 - (x / 230) ** 2 - ((z - cz) / 120) ** 2));
    trees.push({ x, z, y: hy - 0.8, s: 0.9 + rnd() * 0.5, kind: rnd() < 0.8 ? 1 : 0 });
  }
  // park wall
  wall(-260, cz - 170, 260, cz - 170, 5, 1.8, M, bin, root);
  wall(-260, cz + 170, -20, cz + 170, 5, 1.8, M, bin, root);
  wall(20, cz + 170, 260, cz + 170, 5, 1.8, M, bin, root);
}

// ---------------- lakes ----------------

function lakes(M: Mats, bin: InstanceBin, root: THREE.Group, water: THREE.Mesh[], rnd: () => number, trees: TreeSpec[]) {
  const shapes = lakeOutlines();
  for (const poly of shapes) {
    const s = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ShapeGeometry(s, 24);
    geo.rotateX(-Math.PI / 2);
    const w = new THREE.Mesh(geo, M.water);
    w.position.y = -0.6;
    water.push(w);
    const uvA = geo.getAttribute("uv");
    const pA = geo.getAttribute("position");
    for (let i = 0; i < pA.count; i++) uvA.setXY(i, pA.getX(i) / 40, pA.getZ(i) / 40);
    const bed = new THREE.Mesh(geo, M.arch);
    bed.position.y = -0.9;
    root.add(bed);
    root.add(new THREE.Mesh(polyWall(poly, -0.9, 0), M.marble));
    // willows along the shore
    for (let i = 0; i < poly.length; i++) {
      const [ax, az] = poly[i]!;
      const [bx, bz] = poly[(i + 1) % poly.length]!;
      const n = Math.floor(Math.hypot(bx - ax, bz - az) / 18);
      for (let k = 0; k < n; k++) {
        const t = k / n;
        trees.push({ x: ax + (bx - ax) * t + (rnd() - 0.5) * 8, z: az + (bz - az) * t + (rnd() - 0.5) * 8, s: 1, kind: 2 });
      }
    }
  }
  // the island of Qionghua with the White Dagoba
  const island = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.ground);
  island.scale.set(110, 32, 100);
  island.position.set(-680, -0.5, -880);
  root.add(island);
  for (let i = 0; i < 200; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * 100;
    const dx = Math.cos(a) * r;
    const dz = Math.sin(a) * r * 0.9;
    const hy = 32 * Math.sqrt(Math.max(0, 1 - (dx / 110) ** 2 - (dz / 100) ** 2)) - 0.5;
    if (Math.hypot(dx, dz) < 16) continue;
    trees.push({ x: -680 + dx, z: -880 + dz, y: hy - 0.8, s: 1, kind: 1 });
  }
  const white = new THREE.MeshStandardMaterial({ color: "#efeee8", roughness: 0.7 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 6, 20), white);
  base.position.set(-680, 34, -880);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), white);
  bell.position.set(-680, 38, -880);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.4, 16, 16), white);
  spire.position.set(-680, 52, -880);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8), M.gold);
  cap.position.set(-680, 61, -880);
  root.add(base, bell, spire, cap);
  void bin;
}

// ---------------- hutongs ----------------

function hutongs(M: Mats, rnd: () => number, trees: TreeSpec[]) {
  const houseBody = new THREE.BoxGeometry(1, 1, 1);
  houseBody.translate(0, 0.5, 0);
  const roofGeo = gableRoofGeo();
  const bodies: THREE.Matrix4[] = [];
  const roofs: THREE.Matrix4[] = [];
  const blocked = (x: number, z: number) => {
    if (Math.abs(x) < 500 && Math.abs(z) < 610) return true; // palace + moat
    if (Math.abs(x) < 70 && z > 480 && z < 1110) return true; // axis corridor
    if (Math.abs(x) < 290 && z < -560 && z > -1000) return true; // Jingshan
    if (x < -440 && x > -920 && z < 680 && z > -1260) return true; // lakes
    if (z > 1110 && z < 1225) return true; // Chang'an Avenue
    if (Math.abs(x) < 280 && z > 1210 && z < 2050) return true; // square
    if (Math.abs(x) < 14 || Math.abs(x % 420) < 14) return true; // avenues N–S
    if (Math.abs(z % 520) < 12) return true; // avenues E–W
    return false;
  };
  const q = new THREE.Quaternion();
  for (let z = -2600; z < 2600; z += 26) {
    for (let x = -2600; x < 2600; x += 24) {
      if (blocked(x, z)) continue;
      if (rnd() < 0.05) {
        trees.push({ x, z, s: 0.9, kind: 0, far: true });
        continue;
      }
      // a courtyard house: 3–4 small buildings round a yard
      const rot = rnd() < 0.5 ? 0 : Math.PI / 2;
      for (let k = 0; k < 3; k++) {
        const ox = k === 0 ? 0 : k === 1 ? -7 : 7;
        const oz = k === 0 ? -7 : 3;
        const w = k === 0 ? 14 : 5;
        const d = k === 0 ? 6 : 11;
        const h = 3.4 + rnd() * 0.8;
        const px = x + (rot ? oz : ox);
        const pz = z + (rot ? ox : oz);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot + (k === 0 ? 0 : Math.PI / 2));
        const bw = k === 0 ? w : d;
        const bd = k === 0 ? d : w;
        bodies.push(new THREE.Matrix4().compose(new THREE.Vector3(px, 0, pz), q, new THREE.Vector3(bw, h, bd)));
        roofs.push(new THREE.Matrix4().compose(new THREE.Vector3(px, h, pz), q, new THREE.Vector3(bw + 1, 1.8, bd + 1.4)));
      }
      if (rnd() < 0.25) trees.push({ x: x + (rnd() - 0.5) * 6, z: z + (rnd() - 0.5) * 6, s: 0.8, kind: 0, far: true });
    }
  }
  // One instanced mesh per city tile rather than one for the whole city, so
  // the tiles behind or beside the camera are culled instead of drawn.
  const out: THREE.InstancedMesh[] = [];
  for (const [geo, mat, list] of [
    [houseBody, M.greyWall, bodies],
    [roofGeo, M.greyRoof, roofs],
  ] as const) {
    for (const tile of byTile(list, (m) => [m.elements[12], m.elements[14]])) {
      const im = new THREE.InstancedMesh(geo, mat, tile.length);
      tile.forEach((m, i) => im.setMatrixAt(i, m));
      im.receiveShadow = true;
      im.castShadow = false;
      im.computeBoundingSphere();
      out.push(im);
    }
  }
  return out;
}

/** Split items into square tiles of the city, dropping empty tiles. */
function byTile<T>(items: T[], at: (it: T) => [number, number], size = CITY_TILE) {
  const tiles = new Map<string, T[]>();
  for (const it of items) {
    const [x, z] = at(it);
    const key = `${Math.floor(x / size)},${Math.floor(z / size)}`;
    let list = tiles.get(key);
    if (!list) tiles.set(key, (list = []));
    list.push(it);
  }
  return [...tiles.values()];
}
const CITY_TILE = 1300;

function gableRoofGeo() {
  // unit gable roof: 1 wide (x), 1 deep (z), 1 high
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0);
  s.quadraticCurveTo(-0.2, 0.55, 0, 1);
  s.quadraticCurveTo(0.2, 0.55, 0.5, 0);
  s.lineTo(-0.5, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 2 });
  g.translate(0, 0, -0.5);
  g.rotateY(Math.PI / 2);
  // map UVs in roof units so the grey tile texture runs down the slope
  const pos = g.getAttribute("position");
  const uv = g.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 2, pos.getY(i) * 2);
  g.computeVertexNormals();
  return g;
}

// ---------------- trees ----------------

interface TreeSpec {
  x: number;
  z: number;
  y?: number;
  s: number;
  kind: 0 | 1 | 2; // 0 broadleaf, 1 pine/cypress, 2 willow
  /** Out in the city: seen only from far off, so a simpler crown and no shadow. */
  far?: boolean;
}

function buildTrees(trees: TreeSpec[], foliageMat: THREE.MeshStandardMaterial, trunkMat: THREE.Material, rnd: () => number) {
  const crowns = [broadleafGeo(), pineGeo(), willowGeo()];
  const farCrown = farBroadleafGeo();
  // muted, slightly warm greens as seen in late-summer photographs of Beijing
  const colours = [
    ["#56603a", "#4c5634", "#5f6a40", "#48502f"],
    ["#34402c", "#2e3a27", "#3a4630", "#29331f"],
    ["#55603a", "#4c5733", "#5d6840", "#46512f"],
  ];
  const trunk = new THREE.CylinderGeometry(0.25, 0.4, 1, 6);
  trunk.translate(0, 0.5, 0);
  const out: THREE.InstancedMesh[] = [];
  const trunkM: THREE.Matrix4[] = [];
  const groups: { k: 0 | 1 | 2; far: boolean; list: TreeSpec[] }[] = [];
  for (const k of [0, 1, 2] as const) {
    const near = trees.filter((t) => t.kind === k && !t.far);
    if (near.length) groups.push({ k, far: false, list: near });
    for (const tile of byTile(
      trees.filter((t) => t.kind === k && t.far),
      (t) => [t.x, t.z],
    ))
      groups.push({ k, far: true, list: tile });
  }
  for (const { k, far, list } of groups) {
    const im = new THREE.InstancedMesh(far ? farCrown : crowns[k]!, foliageMat, list.length);
    const c = new THREE.Color();
    list.forEach((t, i) => {
      const s = t.s * (k === 1 ? 9 : 8);
      const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
      im.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y ?? 0, t.z), rot, new THREE.Vector3(s, s * (0.9 + rnd() * 0.3), s)));
      c.set(colours[k]![Math.floor(rnd() * 4)]!);
      im.setColorAt(i, c);
      trunkM.push(new THREE.Matrix4().compose(new THREE.Vector3(t.x, t.y ?? 0, t.z), rot, new THREE.Vector3(s * 0.15, s * 0.45, s * 0.15)));
    });
    im.castShadow = !far;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    out.push(im);
  }
  const ti = new THREE.InstancedMesh(trunk, trunkMat, trunkM.length);
  trunkM.forEach((m, i) => ti.setMatrixAt(i, m));
  ti.computeBoundingSphere();
  out.push(ti);
  return out;
}

function lumpy(radius: number, detail: number, amp: number, seed: number) {
  const g = new THREE.IcosahedronGeometry(radius, detail);
  const r = mulberry(seed);
  const pos = g.getAttribute("position");
  const cache = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let k = cache.get(key);
    if (k === undefined) {
      k = 1 + (r() - 0.5) * amp;
      cache.set(key, k);
    }
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g.toNonIndexed();
}

/**
 * Bake a soft ambient-occlusion gradient into vertex colours: foliage is darker
 * low and inside the crown, lighter at the sunlit top — the main cue that
 * makes a lumpy crown read as a tree rather than a blob.
 */
function shadeCrown(g: THREE.BufferGeometry, bottom: number, top: number) {
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  const box = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  const rMax = Math.max(box.max.x - cx, box.max.z - cz) || 1;
  const r = mulberry(99);
  const cy = (box.min.y + box.max.y) / 2;
  const nor = g.getAttribute("normal");
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const h = (pos.getY(i) - box.min.y) / (box.max.y - box.min.y || 1);
    const out = Math.hypot(pos.getX(i) - cx, pos.getZ(i) - cz) / rMax;
    const k = THREE.MathUtils.lerp(bottom, top, Math.pow(h, 0.8)) * (0.78 + out * 0.3) * (0.92 + r() * 0.16);
    col.set([k, k, k], i * 3);
    // Blend each normal toward the crown's radial direction: foliage then
    // shades as one soft volume instead of a cluster of faceted lumps.
    v.set(pos.getX(i) - cx, (pos.getY(i) - cy) * 1.3, pos.getZ(i) - cz).normalize();
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).lerp(v, 0.7).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function broadleafGeo() {
  const parts: THREE.BufferGeometry[] = [];
  const r = mulberry(4);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2;
    const rad = 0.18 + r() * 0.3;
    parts.push(lumpy(0.26 + r() * 0.16, 1, 0.45, 10 + i).translate(Math.cos(a) * rad, 0.7 + r() * 0.55, Math.sin(a) * rad));
  }
  return shadeCrown(mergeGeometries(parts)!, 0.45, 1.15);
}

/** The broadleaf crown in a few lumps instead of nine, for trees out in the city. */
function farBroadleafGeo() {
  const parts: THREE.BufferGeometry[] = [];
  const r = mulberry(4);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + r();
    parts.push(lumpy(0.36, 0, 0.35, 10 + i).translate(Math.cos(a) * 0.22, 0.85 + r() * 0.3, Math.sin(a) * 0.22));
  }
  parts.push(lumpy(0.4, 1, 0.4, 13).translate(0, 1.05, 0));
  return shadeCrown(mergeGeometries(parts)!, 0.45, 1.15);
}

function pineGeo() {
  const parts: THREE.BufferGeometry[] = [];
  const r = mulberry(8);
  for (let i = 0; i < 6; i++) {
    const w = 0.5 - i * 0.07;
    const c = new THREE.ConeGeometry(w, 0.42, 7, 1);
    c.translate((r() - 0.5) * 0.08, 0.5 + i * 0.22, (r() - 0.5) * 0.08);
    parts.push(c.toNonIndexed());
  }
  // umbrella-shaped old pines are common in the palace gardens
  parts.push(lumpy(0.34, 1, 0.5, 21).scale(1.3, 0.55, 1.3).translate(0.1, 1.55, 0));
  return shadeCrown(mergeGeometries(parts)!, 0.5, 1.1);
}

function willowGeo() {
  const parts: THREE.BufferGeometry[] = [];
  const r = mulberry(5);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const g = lumpy(0.28, 1, 0.35, 30 + i);
    const pos = g.getAttribute("position");
    for (let k = 0; k < pos.count; k++) {
      const y = pos.getY(k);
      if (y < 0) pos.setY(k, y * 2.4); // hanging branches
    }
    g.translate(Math.cos(a) * 0.38, 1.05 + r() * 0.2, Math.sin(a) * 0.38);
    parts.push(g);
  }
  parts.push(lumpy(0.36, 1, 0.3, 40).translate(0, 1.35, 0));
  return shadeCrown(mergeGeometries(parts)!, 0.55, 1.1);
}

// ---------------- helpers ----------------

export function planeXZ(w: number, d: number, uvScale: number) {
  const g = new THREE.PlaneGeometry(w, d, 1, 1);
  g.rotateX(-Math.PI / 2);
  const uv = g.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / uvScale, (uv.getY(i) * d) / uvScale);
  return g;
}

function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, seg: number) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const nx = -tan.z;
    const nz = tan.x;
    const l = Math.hypot(nx, nz) || 1;
    for (const s of [-1, 1]) {
      pos.push(p.x + (nx / l) * (width / 2) * s, 0, p.z + (nz / l) * (width / 2) * s);
      uv.push((p.x + (nx / l) * (width / 2) * s) / 20, (p.z + (nz / l) * (width / 2) * s) / 20);
    }
    if (i < seg) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.getAttribute("normal");
  if (n.getY(0) < 0) {
    const arr = g.getIndex()!.array as unknown as number[];
    for (let i = 0; i < arr.length; i += 3) [arr[i + 1], arr[i + 2]] = [arr[i + 2]!, arr[i + 1]!];
    g.computeVertexNormals();
  }
  return g;
}

function offsetCurve(curve: THREE.Curve<THREE.Vector3>, off: number, seg: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const l = Math.hypot(tan.x, tan.z) || 1;
    pts.push(new THREE.Vector3(p.x - (tan.z / l) * off, 0, p.z + (tan.x / l) * off));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function ribbonWall(curve: THREE.Curve<THREE.Vector3>, h: number) {
  const pts = curve.getSpacedPoints(80);
  const pos: number[] = [];
  const idx: number[] = [];
  const uv: number[] = [];
  pts.forEach((p, i) => {
    pos.push(p.x, 0, p.z, p.x, h, p.z);
    uv.push(i / 4, 0, i / 4, h / 3);
    if (i < pts.length - 1) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3, a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Bake all plain meshes under `root` into one merged mesh per material. */
export function mergeByMaterial(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const keep: THREE.Object3D[] = [];
  root.traverse((o) => {
    const inst = (o as THREE.InstancedMesh).isInstancedMesh;
    if (inst) {
      keep.push(o);
      return;
    }
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.Material;
    let g = m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    for (const name of Object.keys(g.attributes)) {
      if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
    }
    if (!g.getAttribute("uv")) {
      g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2));
    }
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    if (!g.index) {
      const n = g.getAttribute("position").count;
      g.setIndex(Array.from({ length: n }, (_, i) => i));
    }
    g = g.index ? g : g;
    let list = buckets.get(mat);
    if (!list) {
      list = [];
      buckets.set(mat, list);
    }
    list.push(g);
  });
  const out = new THREE.Group();
  for (const [mat, list] of buckets) {
    const merged = mergeGeometries(list, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    out.add(mesh);
  }
  keep.forEach((k) => {
    k.removeFromParent();
    out.add(k);
  });
  return out;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lakeOutlines(): [number, number][][] {
  return [
    // Beihai (north-west)
    [
      [-560, -620],
      [-480, -740],
      [-490, -980],
      [-560, -1180],
      [-760, -1220],
      [-880, -1060],
      [-860, -760],
      [-740, -640],
    ],
    // Zhongnanhai (south-west)
    [
      [-580, -380],
      [-540, 60],
      [-580, 520],
      [-700, 640],
      [-820, 420],
      [-800, -60],
      [-720, -360],
    ],
  ];
}

function toPath(poly: [number, number][]) {
  return new THREE.Path(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
}

function shapeMesh(shape: THREE.Shape, mat: THREE.Material, y: number, uvScale: number) {
  const geo = new THREE.ShapeGeometry(shape, 8);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / uvScale, pos.getZ(i) / uvScale);
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y;
  m.receiveShadow = true;
  return m;
}

/** Vertical stone faces along a closed polygon, from y0 to y1 (double sided via two windings). */
function polyWall(poly: [number, number][], y0: number, y1: number) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let acc = 0;
  for (let i = 0; i <= poly.length; i++) {
    const [x, z] = poly[i % poly.length]!;
    if (i > 0) {
      const [px, pz] = poly[i - 1]!;
      acc += Math.hypot(x - px, z - pz);
    }
    pos.push(x, y0, z, x, y1, z);
    uv.push(acc / 3, 0, acc / 3, (y1 - y0) / 3);
    if (i < poly.length) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3, a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Turn an InstancedMesh into a plain mesh with every instance baked in. */
function bakeInstances(im: THREE.InstancedMesh) {
  const parts: THREE.BufferGeometry[] = [];
  const m = new THREE.Matrix4();
  const base = im.geometry.index ? im.geometry.toNonIndexed() : im.geometry;
  for (let i = 0; i < im.count; i++) {
    im.getMatrixAt(i, m);
    const g = base.clone();
    g.applyMatrix4(m);
    for (const name of Object.keys(g.attributes)) {
      if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
    }
    parts.push(g);
  }
  return new THREE.Mesh(mergeGeometries(parts, false)!, im.material as THREE.Material);
}
