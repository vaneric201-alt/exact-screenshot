import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { canvasTex, mottle } from "../stage/textures";

/*
 * Parade hardware shown in Beijing on 1 October 2019 (the 70th-anniversary
 * parade), as visual likenesses built from primitives — outer shapes only,
 * nothing about their insides:
 *  · DF-41 (Đông Phong-41) road-mobile ICBM in its canister on an 8-axle TEL
 *  · DF-17 (Đông Phong-17) with its glide vehicle on a 4-axle TEL
 *  · J-20 stealth fighter (canards, delta wing, twin canted fins)
 *  · a free-flying missile for the globe sequence
 * One unit ≈ 5 m.
 */

const shadow = <T extends THREE.Object3D>(o: T) => {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return o;
};

/** PLA-style digital camouflage: greens and sand in square pixels, with dust and panel seams. */
function camoTex(seed: number) {
  return canvasTex(
    512,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#56603f";
      ctx.fillRect(0, 0, w, h);
      const cols = ["#3f4a2f", "#6b7350", "#2e3524", "#8a8462"];
      for (let k = 0; k < 900; k++) {
        ctx.fillStyle = cols[Math.floor(r() * cols.length)]!;
        const s = 8 * (1 + Math.floor(r() * 3));
        const x = Math.floor((r() * w) / 8) * 8;
        const y = Math.floor((r() * h) / 8) * 8;
        ctx.fillRect(x, y, s * (1 + Math.floor(r() * 3)), s);
      }
      mottle(ctx, w, h, r, "rgba(170,150,110,1)", 0.18, 3, 3);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      for (let x = 0; x < w; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    },
    seed,
    true,
    { normal: 0.8, rough: [0.55, 0.85] },
  );
}

/** Tyre with tread blocks and a hub with bolts; axis along z. */
function wheel(radius: number, width: number) {
  const g = new THREE.Group();
  const treadTex = canvasTex(256, 64, (ctx, w, h) => {
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#2c2c2c";
    for (let x = 0; x < w; x += 16) {
      ctx.fillRect(x, 0, 9, h * 0.42);
      ctx.fillRect(x + 8, h * 0.58, 9, h * 0.42);
    }
  }, 905, true, { normal: 4, rough: [0.85, 1] });
  treadTex.repeat.set(3, 1);
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 40, 1), new THREE.MeshStandardMaterial({ map: treadTex, normalMap: treadTex.userData["normalMap"] as THREE.Texture, roughness: 0.9 }));
  tyre.rotation.x = Math.PI / 2;
  const sideMat = new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.85 });
  const hubMat = new THREE.MeshStandardMaterial({ color: "#4a5238", roughness: 0.6, metalness: 0.3 });
  for (const z of [-width / 2 - 0.001, width / 2 + 0.001]) {
    const side = new THREE.Mesh(new THREE.RingGeometry(radius * 0.55, radius, 40), sideMat);
    side.position.z = z;
    if (z < 0) side.rotation.y = Math.PI;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.55, radius * 0.5, 0.03, 24), hubMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = z + (z > 0 ? 0.01 : -0.01);
    g.add(side, hub);
    for (let b = 0; b < 8; b++) {
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), hubMat);
      bolt.rotation.x = Math.PI / 2;
      const a = (b / 8) * Math.PI * 2;
      bolt.position.set(Math.cos(a) * radius * 0.32, Math.sin(a) * radius * 0.32, z + (z > 0 ? 0.025 : -0.025));
      g.add(bolt);
    }
  }
  g.add(tyre);
  return g;
}

/** Common heavy-truck body: chassis, cab with windscreen and lights, wheels, fenders. */
function truck(len: number, axles: number[], camo: THREE.Material, cabW = 0.64) {
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: "#23281b", roughness: 0.7 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(len, 0.14, 0.5), dark);
  chassis.position.set(0, 0.36, 0);
  g.add(chassis);
  // cab at +x
  const cab = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.5, cabW, 4, 0.05), camo);
  cab.position.set(len / 2 - 0.35, 0.68, 0);
  g.add(cab);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: "#1a2633", metalness: 0.2, roughness: 0.05, clearcoat: 1 });
  const wind = new THREE.Mesh(new THREE.PlaneGeometry(cabW * 0.86, 0.2), glassMat);
  wind.position.set(len / 2 + 0.045, 0.78, 0);
  wind.rotation.set(0, Math.PI / 2, -0.12);
  g.add(wind);
  for (const z of [-cabW / 2 - 0.001, cabW / 2 + 0.001]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), glassMat);
    side.position.set(len / 2 - 0.2, 0.8, z);
    if (z < 0) side.rotation.y = Math.PI;
    g.add(side);
  }
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(cabW * 0.6, 0.14), new THREE.MeshStandardMaterial({ color: "#151812", roughness: 0.6 }));
  grille.position.set(len / 2 + 0.051, 0.56, 0);
  grille.rotation.y = Math.PI / 2;
  g.add(grille);
  for (const z of [-cabW * 0.36, cabW * 0.36]) {
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), new THREE.MeshStandardMaterial({ color: "#fff6dc", emissive: "#fff2c8", emissiveIntensity: 0.6 }));
    lamp.position.set(len / 2 + 0.052, 0.5, z);
    lamp.rotation.y = Math.PI / 2;
    g.add(lamp);
  }
  // wheels and fenders
  for (const x of axles) {
    for (const z of [-0.29, 0.29]) {
      const w = wheel(0.2, 0.15);
      w.position.set(x, 0.2, z);
      g.add(w);
    }
    const fender = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.72), dark);
    fender.position.set(x, 0.43, 0);
    g.add(fender);
  }
  // side lockers
  for (const z of [-0.26, 0.26]) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(len * 0.5, 0.14, 0.04), camo);
    box.position.set(-len * 0.05, 0.5, z);
    g.add(box);
  }
  return g;
}

export function buildDF41() {
  const camo = new THREE.MeshStandardMaterial({ map: camoTex(901), roughness: 0.75 });
  const len = 4.0;
  const axles = [1.52, 1.07, 0.62, 0.17, -0.55, -1.0, -1.45, -1.9];
  const g = truck(len, axles, camo);
  // the launch canister: ribbed tube with end caps, on its erector
  const can = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.3, 40), camo);
  tube.rotation.z = Math.PI / 2;
  can.add(tube);
  for (let k = 0; k < 9; k++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.222, 0.012, 8, 40), camo);
    rib.rotation.y = Math.PI / 2;
    rib.position.x = -1.5 + k * 0.375;
    can.add(rib);
  }
  const capMat = new THREE.MeshStandardMaterial({ color: "#3a4229", roughness: 0.6 });
  const front = new THREE.Mesh(new THREE.SphereGeometry(0.225, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
  front.rotation.z = -Math.PI / 2;
  front.scale.set(1, 0.35, 1);
  front.position.x = 1.65;
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 32), capMat);
  back.rotation.z = Math.PI / 2;
  back.position.x = -1.7;
  can.add(front, back);
  can.position.set(-0.35, 0.86, 0);
  g.add(can);
  // erector arms and hydraulic rams
  const steel = new THREE.MeshStandardMaterial({ color: "#3a3f30", metalness: 0.5, roughness: 0.45 });
  for (const z of [-0.2, 0.2]) {
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 12), steel);
    ram.rotation.z = 1.2;
    ram.position.set(0.5, 0.62, z);
    g.add(ram);
  }
  g.position.y = 0;
  return shadow(g);
}

export function buildDF17() {
  const camo = new THREE.MeshStandardMaterial({ map: camoTex(911), roughness: 0.75 });
  const len = 2.7;
  const g = truck(len, [0.82, 0.4, -0.55, -0.97], camo, 0.6);
  // the missile: two-stage booster with the wedge-shaped glide vehicle on top
  const m = new THREE.Group();
  const grey = new THREE.MeshPhysicalMaterial({ color: "#c9cbc4", roughness: 0.45, clearcoat: 0.3 });
  const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.5, 32), grey);
  booster.rotation.z = Math.PI / 2;
  booster.position.x = -0.35;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.131, 0.01, 8, 32), new THREE.MeshStandardMaterial({ color: "#2b2f2a" }));
  band.rotation.y = Math.PI / 2;
  band.position.x = 0.1;
  m.add(booster, band);
  // glide vehicle: a flat-bottomed wedge with a blunt nose and two small fins
  const gv = new THREE.Shape();
  gv.moveTo(0, 0);
  gv.lineTo(0.62, 0.0);
  gv.quadraticCurveTo(0.7, 0.0, 0.66, 0.02);
  gv.lineTo(0.0, 0.14);
  gv.lineTo(0, 0);
  const gvGeo = new THREE.ExtrudeGeometry(gv, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
  gvGeo.translate(0, 0, -0.12);
  const glider = new THREE.Mesh(gvGeo, new THREE.MeshPhysicalMaterial({ color: "#2e3130", roughness: 0.5 }));
  glider.position.set(0.42, -0.06, 0);
  for (const z of [-0.1, 0.1]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.008), glider.material);
    fin.position.set(0.47, 0.1, z);
    fin.rotation.x = z > 0 ? -0.35 : 0.35;
    m.add(fin);
  }
  m.add(glider);
  m.position.set(-0.2, 0.78, 0);
  m.rotation.z = 0.08;
  g.add(m);
  return shadow(g);
}

export function buildJ20() {
  const g = new THREE.Group();
  const skinTex = canvasTex(
    512,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#4b4f55";
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, "rgba(30,32,36,1)", 0.25, 4, 3);
      ctx.strokeStyle = "rgba(20,22,26,0.5)";
      for (let k = 0; k < 40; k++) {
        ctx.beginPath();
        const x = r() * w;
        const y = r() * h;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 30);
        ctx.stroke();
      }
    },
    921,
    true,
    { normal: 0.6, rough: [0.4, 0.6] },
  );
  const skin = new THREE.MeshPhysicalMaterial({ map: skinTex, roughness: 0.42, metalness: 0.35, clearcoat: 0.4 });
  // fuselage: a lathe along x, squashed into a chined, flat-sided body
  const prof = [
    [0, 1.0],
    [0.04, 0.92],
    [0.09, 0.72],
    [0.12, 0.45],
    [0.14, 0.1],
    [0.15, -0.4],
    [0.14, -0.8],
    [0.11, -0.98],
    [0.09, -1.02],
  ].map(([rr, y]) => new THREE.Vector2(rr, y));
  const fus = new THREE.Mesh(new THREE.LatheGeometry(prof, 8), skin);
  fus.rotation.z = -Math.PI / 2;
  fus.scale.set(1, 1, 0.62);
  g.add(fus);
  // gold-tinted canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: "#c9a24a", metalness: 0.9, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.9 }));
  canopy.scale.set(2.6, 0.9, 1);
  canopy.position.set(0.55, 0.075, 0);
  g.add(canopy);
  const plan = (pts: [number, number][], thick = 0.012) => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
    geo.translate(0, 0, -thick / 2);
    return geo;
  };
  // main delta wings
  const wing = plan([
    [0.1, 0],
    [-0.62, 0.62],
    [-0.8, 0.62],
    [-0.8, 0],
  ]);
  for (const s of [1, -1]) {
    const w = new THREE.Mesh(wing, skin);
    w.rotation.x = Math.PI / 2;
    w.scale.z = s;
    w.position.y = -0.01;
    if (s < 0) w.scale.y = -1;
    g.add(w);
    // canards
    const can = new THREE.Mesh(
      plan([
        [0.45, 0],
        [0.22, 0.3],
        [0.16, 0.3],
        [0.2, 0],
      ]),
      skin,
    );
    can.rotation.x = Math.PI / 2;
    if (s < 0) can.scale.y = -1;
    can.position.y = 0.03;
    g.add(can);
    // canted all-moving fins
    const fin = new THREE.Mesh(
      plan([
        [-0.55, 0],
        [-0.82, 0.32],
        [-0.92, 0.32],
        [-0.86, 0],
      ]),
      skin,
    );
    fin.position.set(0, 0.05, 0.16 * s);
    fin.rotation.x = -0.3 * s;
    g.add(fin);
    // ventral fins
    const ven = new THREE.Mesh(
      plan([
        [-0.6, 0],
        [-0.78, -0.12],
        [-0.84, -0.12],
        [-0.76, 0],
      ]),
      skin,
    );
    ven.position.set(0, -0.06, 0.22 * s);
    ven.rotation.x = 0.4 * s;
    g.add(ven);
  }
  // twin engine nozzles with a faint afterburner glow
  for (const z of [-0.06, 0.06]) {
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.12, 20, 1, true), new THREE.MeshStandardMaterial({ color: "#2a2724", metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide }));
    noz.rotation.z = Math.PI / 2;
    noz.position.set(-1.04, -0.01, z);
    const burn = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), new THREE.MeshBasicMaterial({ color: "#ffb36a" }));
    burn.rotation.y = -Math.PI / 2;
    burn.position.set(-1.05, -0.01, z);
    g.add(noz, burn);
  }
  return shadow(g);
}

/** The missile in flight (for the globe): two stages, nose cone, fins of the canister ejection kept off. */
export function buildMissile() {
  const g = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: "#dcdcd4", roughness: 0.4, clearcoat: 0.3 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 24), white);
  body.rotation.z = -Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 24), white);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.39;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.051, 0.051, 0.03, 24), new THREE.MeshStandardMaterial({ color: "#3a3f30" }));
  band.rotation.z = -Math.PI / 2;
  band.position.x = 0.05;
  g.add(body, nose, band);
  return g;
}

// ---------------------------------------------------------------------------
// More hardware for the parade and the air scene (outer shapes only).

/** Road wheel / track run for tracked vehicles; returns a group along x. */
function trackRun(len: number, side: number) {
  const g = new THREE.Group();
  const rubber = new THREE.MeshStandardMaterial({ color: "#1d1f1a", roughness: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ color: "#3d4430", roughness: 0.6, metalness: 0.4 });
  const linkTex = canvasTex(256, 32, (ctx, w, h) => {
    ctx.fillStyle = "#24261f";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#3a3c33";
    for (let x = 0; x < w; x += 16) ctx.fillRect(x, 0, 10, h);
  }, 941, true, { normal: 4 });
  linkTex.repeat.set(10, 1);
  // the track as a rounded loop: a stretched capsule shell
  const shape = new THREE.Shape();
  const r = 0.17;
  shape.absarc(len / 2 - r, r, r, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-len / 2 + r, 2 * r);
  shape.absarc(-len / 2 + r, r, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  shape.lineTo(len / 2 - r, 0);
  const tread = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false, curveSegments: 16 }), new THREE.MeshStandardMaterial({ map: linkTex, normalMap: linkTex.userData["normalMap"] as THREE.Texture, roughness: 0.9 }));
  tread.position.set(0, 0, side * 0.22 - 0.11);
  g.add(tread);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.24, 20), steel);
    w.rotation.x = Math.PI / 2;
    w.position.set(-len / 2 + 0.35 + (i * (len - 0.7)) / (n - 1), 0.15, side * 0.22);
    g.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 10), rubber);
    hub.rotation.x = Math.PI / 2;
    hub.position.copy(w.position);
    g.add(hub);
  }
  return g;
}

/** Main battle tank (after the Type 99A): angular hull, wedge-armoured turret, long gun. */
export function buildTank() {
  const camo = new THREE.MeshStandardMaterial({ map: camoTex(951), roughness: 0.75 });
  const g = new THREE.Group();
  const L = 2.0;
  for (const side of [-1, 1]) {
    const t = trackRun(L, side);
    t.position.z = side * 0.42;
    g.add(t);
  }
  const hull = new THREE.Mesh(new RoundedBoxGeometry(L + 0.1, 0.32, 0.9, 3, 0.04), camo);
  hull.position.y = 0.46;
  const glacis = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.88), camo);
  glacis.position.set(L / 2 - 0.05, 0.44, 0);
  glacis.rotation.z = -0.5;
  // side skirts
  for (const side of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(L, 0.2, 0.03), camo);
    skirt.position.set(0, 0.42, side * 0.66);
    g.add(skirt);
  }
  g.add(hull, glacis);
  // turret: wedge front made from an extruded outline
  const tur = new THREE.Shape();
  tur.moveTo(-0.55, -0.4);
  tur.lineTo(0.3, -0.42);
  tur.lineTo(0.62, 0);
  tur.lineTo(0.3, 0.42);
  tur.lineTo(-0.55, 0.4);
  tur.lineTo(-0.62, 0);
  const turret = new THREE.Mesh(new THREE.ExtrudeGeometry(tur, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }), camo);
  turret.rotation.x = -Math.PI / 2;
  turret.position.set(-0.1, 0.62, 0);
  g.add(turret);
  const gunMat = new THREE.MeshStandardMaterial({ color: "#3a4229", roughness: 0.6 });
  const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.9, 16), gunMat);
  gun.rotation.z = -Math.PI / 2;
  gun.position.set(1.4, 0.77, 0);
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.4, 16), gunMat);
  sleeve.rotation.z = -Math.PI / 2;
  sleeve.position.set(0.95, 0.77, 0);
  const evac = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 16), gunMat);
  evac.rotation.z = -Math.PI / 2;
  evac.position.set(1.6, 0.77, 0);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16), gunMat);
  hatch.position.set(-0.25, 0.92, 0.15);
  const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8), gunMat);
  mg.rotation.z = -Math.PI / 2;
  mg.position.set(-0.05, 1.02, 0.15);
  g.add(gun, sleeve, evac, hatch, mg);
  return shadow(g);
}

/** Self-propelled howitzer (after the PLZ-05): tall box turret, long barrel with a muzzle brake. */
export function buildHowitzer() {
  const camo = new THREE.MeshStandardMaterial({ map: camoTex(961), roughness: 0.75 });
  const g = new THREE.Group();
  const L = 2.2;
  for (const side of [-1, 1]) {
    const t = trackRun(L, side);
    t.position.z = side * 0.42;
    g.add(t);
  }
  const hull = new THREE.Mesh(new RoundedBoxGeometry(L, 0.36, 0.92, 3, 0.04), camo);
  hull.position.y = 0.48;
  const turret = new THREE.Mesh(new RoundedBoxGeometry(1.1, 0.46, 0.86, 3, 0.05), camo);
  turret.position.set(-0.3, 0.88, 0);
  const gunMat = new THREE.MeshStandardMaterial({ color: "#3a4229", roughness: 0.6 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 16), gunMat);
  barrel.rotation.z = -Math.PI / 2 + 0.18;
  barrel.position.set(1.15, 1.08, 0);
  const brake = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.16), gunMat);
  brake.rotation.z = 0.18;
  brake.position.set(2.32, 1.3, 0);
  g.add(hull, turret, barrel, brake);
  return shadow(g);
}

/** Air-defence launcher (after the HQ-9): 8-wheel truck with four canisters raised upright. */
export function buildHQ9() {
  const camo = new THREE.MeshStandardMaterial({ map: camoTex(971), roughness: 0.75 });
  const g = truck(3.0, [1.0, 0.55, -0.6, -1.05], camo, 0.62);
  const pack = new THREE.Group();
  const capMat = new THREE.MeshStandardMaterial({ color: "#2e3524", roughness: 0.6 });
  for (const [y, z] of [
    [0, -0.14],
    [0, 0.14],
    [0.28, -0.14],
    [0.28, 0.14],
  ] as const) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.9, 20), camo);
    can.position.set(0, y, z);
    can.rotation.z = Math.PI / 2;
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), capMat);
    cap.position.set(0.951, y, z);
    cap.rotation.y = Math.PI / 2;
    pack.add(can, cap);
  }
  // raised to firing position at the back of the truck
  pack.position.set(-1.1, 1.0, 0);
  pack.rotation.z = 1.25;
  g.add(pack);
  return shadow(g);
}

/** Heavy torpedo on a display cradle (shape after the Yu-6 class). */
export function buildTorpedo() {
  const g = new THREE.Group();
  const body = new THREE.MeshPhysicalMaterial({ color: "#2b3a36", roughness: 0.35, clearcoat: 0.6 });
  const prof: THREE.Vector2[] = [
    [0, 1.25],
    [0.07, 1.22],
    [0.13, 1.14],
    [0.16, 1.0],
    [0.16, -0.9],
    [0.13, -1.08],
    [0.06, -1.2],
    [0.04, -1.25],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const hull = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), body);
  hull.rotation.z = -Math.PI / 2;
  g.add(hull);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.05, 32), new THREE.MeshStandardMaterial({ color: "#c9a24a", metalness: 0.8, roughness: 0.3 }));
  band.rotation.z = Math.PI / 2;
  band.position.x = 0.7;
  g.add(band);
  for (let k = 0; k < 4; k++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.005, 0.16), body);
    fin.position.set(-1.12, 0, 0);
    fin.rotation.x = (k * Math.PI) / 2;
    fin.translateZ(0.12);
    g.add(fin);
  }
  const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 6), new THREE.MeshStandardMaterial({ color: "#b08a3a", metalness: 0.9, roughness: 0.3 }));
  prop.rotation.z = Math.PI / 2;
  prop.position.x = -1.27;
  g.add(prop);
  const cradle = new THREE.MeshStandardMaterial({ color: "#3a3f30", roughness: 0.6 });
  for (const x of [-0.6, 0.6]) {
    const c = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 24, Math.PI), cradle);
    c.rotation.set(0, Math.PI / 2, Math.PI);
    c.position.set(x, 0, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.4), cradle);
    leg.position.set(x, -0.3, 0);
    g.add(c, leg);
  }
  g.position.y = 0.46;
  const wrap = new THREE.Group();
  wrap.add(g);
  return shadow(wrap);
}

/** Air-to-air missile (shape after the PL-15): long body, small strakes, cruciform tail fins. */
export function buildAAM() {
  const g = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: "#e6e6de", roughness: 0.35, clearcoat: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 24), white);
  body.rotation.z = -Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 24), white);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 1.97;
  const seeker = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshPhysicalMaterial({ color: "#2a2620", roughness: 0.1, clearcoat: 1 }));
  seeker.position.x = 2.22;
  g.add(body, nose, seeker);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.102, 0.08, 24), new THREE.MeshStandardMaterial({ color: "#c9a24a" }));
  band.rotation.z = Math.PI / 2;
  band.position.x = 0.9;
  g.add(band);
  const finMat = new THREE.MeshStandardMaterial({ color: "#cfcfc6", roughness: 0.5 });
  for (let k = 0; k < 4; k++) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.008, 0.36), finMat);
    tail.position.set(-1.5, 0, 0);
    tail.rotation.x = (k * Math.PI) / 2 + Math.PI / 4;
    tail.translateZ(0.24);
    const strake = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.006, 0.08), finMat);
    strake.position.set(0.2, 0, 0);
    strake.rotation.x = (k * Math.PI) / 2 + Math.PI / 4;
    strake.translateZ(0.13);
    g.add(tail, strake);
  }
  return g;
}

/** A target drone: a slim jet-powered aerial target, bright orange. */
export function buildTargetDrone() {
  const g = new THREE.Group();
  const orange = new THREE.MeshPhysicalMaterial({ color: "#e8621c", roughness: 0.4, clearcoat: 0.5 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 2.2, 8, 20), orange);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 2.2), orange);
  wing.position.x = 0.1;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.03), orange);
  tail.position.set(-1.1, 0.25, 0);
  g.add(wing, tail);
  return g;
}
