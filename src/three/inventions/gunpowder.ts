import * as THREE from "three";
import type { ChapterData } from "../../content/content";
import { span, rng, type LabelDef, type Stage } from "../stage/stage";
import { bambooTex, brickTex, pbr, stoneTex, woodTex } from "../stage/textures";
import { createFire } from "../stage/fire";
import { buildFireLance } from "../models/fireLance";
import type { InventionScene } from "./types";

/*
 * Gunpowder, on the plinth:
 *  A · an alchemist's furnace; three bowls — saltpetre, sulphur, charcoal —
 *      tipped into a mortar and mixed until the mixture flares up
 *  B · a fire lance taken apart along its length, each part labelled, then
 *      put together again and fired
 *  C · evolution: alchemy furnace → fire arrow → fire ball → fire lance →
 *      bronze gun, one object at a time
 * No proportions are shown: the site's sources do not give them.
 */

const P = {
  mats: [0.02, 0.14] as const,
  mix: [0.14, 0.25] as const,
  flare: [0.25, 0.31] as const,
  lanceIn: 0.33,
  explode: [0.37, 0.47] as const,
  join: [0.5, 0.56] as const,
  shoot: [0.56, 0.64] as const,
  evo: 0.66,
};

export function create(stage: Stage, ch: ChapterData): InventionScene {
  const root = new THREE.Group();
  stage.turntable.add(root);
  const r = rng(1044);
  const steps = ch.process.parts[0]!.steps;
  const step = (name: string) => steps.find((s) => s.name === name)?.desc ?? "";
  const std = (o: THREE.MeshStandardMaterialParameters & { relief?: number }) => pbr({ roughness: 0.85, ...o });
  const shadowy = <T extends THREE.Object3D>(o: T) => {
    o.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    return o;
  };
  const anchor = (parent: THREE.Object3D, x: number, y: number, z: number) => {
    const a = new THREE.Object3D();
    a.position.set(x, y, z);
    parent.add(a);
    return a;
  };
  const bronze = std({ color: "#7d5a2e", metalness: 0.85, roughness: 0.4 });

  // =====================================================================
  // A · furnace and the three ingredients
  const labA = new THREE.Group();
  root.add(labA);
  const furnace = new THREE.Group();
  const stove = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.5, 8), std({ map: brickTex(5), roughness: 0.95 }));
  stove.position.y = 0.25;
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.1), std({ color: "#120804", emissive: "#ff5a12", emissiveIntensity: 0.9 }));
  mouth.position.set(0, 0.18, 0.43);
  const pot = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0, 0],
        [0.2, 0.02],
        [0.32, 0.14],
        [0.34, 0.3],
        [0.26, 0.4],
        [0.28, 0.44],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      32,
    ),
    bronze,
  );
  pot.position.y = 0.5;
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), bronze);
  lid.position.y = 0.94;
  lid.scale.y = 0.55;
  const lidKnob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), bronze);
  lidKnob.position.y = 1.1;
  furnace.add(stove, mouth, pot, lid, lidKnob);
  const furnaceFire = createFire(120, 0.08, 0.16);
  furnaceFire.object.position.set(0, 0.2, 0.47);
  furnace.add(furnaceFire.object);
  furnace.position.set(-0.85, 0, -0.9);
  labA.add(shadowy(furnace));

  // bowls
  const bowlGeo = new THREE.LatheGeometry(
    [
      [0, 0],
      [0.14, 0],
      [0.2, 0.05],
      [0.23, 0.12],
      [0.21, 0.12],
      [0.18, 0.06],
      [0, 0.04],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    32,
  );
  const bowlMat = std({ color: "#d8d0c0", roughness: 0.35 });
  const makeBowl = (fill: (g: THREE.Group) => void) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(bowlGeo, bowlMat));
    const content = new THREE.Group();
    content.position.y = 0.07;
    fill(content);
    g.add(content);
    return g;
  };
  const heapOf = (count: number, geo: THREE.BufferGeometry, mat: THREE.Material, spread: number, seed: number) => {
    const rr = rng(seed);
    const im = new THREE.InstancedMesh(geo, mat, count);
    const m = new THREE.Matrix4();
    const qq = new THREE.Quaternion();
    for (let k = 0; k < count; k++) {
      const a = rr() * Math.PI * 2;
      const rad = Math.sqrt(rr()) * spread;
      const h = (1 - rad / spread) * 0.07;
      qq.setFromEuler(new THREE.Euler(rr() * 3, rr() * 3, rr() * 3));
      const s = 0.6 + rr() * 0.8;
      m.compose(new THREE.Vector3(Math.cos(a) * rad, h + rr() * 0.02, Math.sin(a) * rad), qq, new THREE.Vector3(s, s, s));
      im.setMatrixAt(k, m);
    }
    return im;
  };
  const saltpetre = makeBowl((g) =>
    g.add(heapOf(160, new THREE.OctahedronGeometry(0.018), new THREE.MeshPhysicalMaterial({ color: "#f4f4ef", roughness: 0.15, transmission: 0.3, thickness: 0.02 }), 0.17, 3)),
  );
  const sulphur = makeBowl((g) => g.add(heapOf(70, new THREE.DodecahedronGeometry(0.03), std({ color: "#e6c52a", roughness: 0.55 }), 0.16, 5)));
  const charcoal = makeBowl((g) => g.add(heapOf(40, new THREE.BoxGeometry(0.1, 0.03, 0.035), std({ color: "#1a1714", roughness: 0.95 }), 0.14, 7)));
  const bowls = [saltpetre, sulphur, charcoal];
  const bowlHome = [new THREE.Vector3(-0.45, 0, 0.75), new THREE.Vector3(0.25, 0, 0.9), new THREE.Vector3(0.95, 0, 0.75)];
  bowls.forEach((b, i) => {
    b.position.copy(bowlHome[i]!);
    labA.add(shadowy(b));
  });

  // mortar where they are mixed; the black powder grows in it
  const mortar = new THREE.Group();
  const mortarGeo = new THREE.LatheGeometry(
    [
      [0, 0],
      [0.3, 0],
      [0.34, 0.05],
      [0.36, 0.24],
      [0.32, 0.3],
      [0.26, 0.3],
      [0.22, 0.16],
      [0, 0.12],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    36,
  );
  mortar.add(new THREE.Mesh(mortarGeo, std({ map: stoneTex("#6f6a62", 11), roughness: 0.9 })));
  const powder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: "#17140f", roughness: 1 }));
  powder.position.y = 0.13;
  powder.scale.set(1, 0.3, 1);
  mortar.add(powder);
  const pestle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.55, 12), std({ map: woodTex("#8a5a32", 13) }));
  pestle.position.set(0.05, 0.38, 0);
  pestle.rotation.z = 0.35;
  mortar.add(pestle);
  mortar.position.set(0.3, 0, 0.05);
  labA.add(shadowy(mortar));
  const flare = createFire(260, 0.18, 0.3);
  flare.object.position.set(0.3, 0.2, 0.05);
  labA.add(flare.object);
  const flareLight = new THREE.PointLight("#ffb050", 0, 5, 2);
  flareLight.position.set(0.3, 0.8, 0.05);
  labA.add(flareLight);

  // =====================================================================
  // B · the fire lance, taken apart along its length
  const lance = new THREE.Group();
  root.add(lance);
  const partsL: { obj: THREE.Object3D; off: number }[] = [];
  const FL = buildFireLance();
  const { shaft, tube: tubeG, charge, fuse, head: headG } = FL.parts;
  partsL.push({ obj: shaft, off: -0.32 }, { obj: tubeG, off: 0.05 }, { obj: charge, off: 0.05 }, { obj: fuse, off: -0.1 }, { obj: headG, off: 0.38 });
  partsL.forEach(({ obj }) => lance.add(obj));
  lance.position.set(0, 0.45, 0.2);
  lance.rotation.y = -0.25;
  shadowy(lance);
  const partHome = partsL.map(({ obj }) => obj.position.clone());
  const jet = createFire(320, 0.05, 0.22);
  jet.setJet(new THREE.Vector3(1, 0.05, 0), 3.4);
  jet.object.position.copy(FL.muzzle.position);
  lance.add(jet.object);
  // a small stand for the lance
  const standMat = std({ map: woodTex("#4a3020", 23) });
  const stands = new THREE.Group();
  for (const x of [-1, 0.4]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.05), standMat);
    post.position.set(x, 0.21, 0);
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), standMat);
    yoke.rotation.z = Math.PI;
    yoke.position.set(x, 0.45, 0);
    yoke.rotation.y = Math.PI / 2;
    stands.add(post, yoke);
  }
  stands.position.copy(lance.position).setY(0);
  stands.rotation.y = lance.rotation.y;
  root.add(shadowy(stands));

  // =====================================================================
  // C · evolution
  const evo = new THREE.Group();
  root.add(evo);
  const ex: THREE.Group[] = [];
  // 1 alchemy furnace (small)
  const f2 = furnace.clone(true);
  f2.scale.setScalar(0.55);
  f2.position.set(0, 0, 0);
  f2.children.filter((c) => (c as THREE.Points).isPoints).forEach((c) => c.removeFromParent());
  ex.push(new THREE.Group().add(f2) as THREE.Group);
  // 2 fire arrow: an arrow with a powder tube tied behind the head
  const arrow = new THREE.Group();
  const aShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 8), std({ map: bambooTex(29) }));
  aShaft.rotation.z = Math.PI / 2;
  const aHead = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), std({ color: "#9a9690", metalness: 0.9, roughness: 0.3 }));
  aHead.rotation.z = -Math.PI / 2;
  aHead.position.x = 0.56;
  const aTube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 12), std({ color: "#b8763a", roughness: 0.9 }));
  aTube.rotation.z = Math.PI / 2;
  aTube.position.set(0.36, -0.04, 0);
  const aFletch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.004), std({ color: "#e8e0cc", side: THREE.DoubleSide }));
  aFletch.position.x = -0.45;
  const aFletch2 = aFletch.clone();
  aFletch2.rotation.x = Math.PI / 2;
  arrow.add(aShaft, aHead, aTube, aFletch, aFletch2);
  arrow.position.y = 0.12;
  arrow.rotation.z = 0.12;
  ex.push(new THREE.Group().add(arrow) as THREE.Group);
  // 3 fire ball: a wrapped ball with cords and a fuse
  const ball = new THREE.Group();
  const bCore = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), std({ color: "#6d5a3c", roughness: 1 }));
  bCore.position.y = 0.16;
  for (let k = 0; k < 3; k++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.162, 0.008, 6, 36), std({ color: "#3a2c1c" }));
    band.position.y = 0.16;
    band.rotation.set(Math.PI / 2, 0, (k * Math.PI) / 3);
    band.rotation.y = (k * Math.PI) / 3;
    ball.add(band);
  }
  const bFuse = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 6), std({ color: "#9a7a4a" }));
  bFuse.position.y = 0.37;
  bFuse.rotation.z = 0.3;
  ball.add(bCore, bFuse);
  ex.push(ball);
  // 4 fire lance (small copy)
  const l2 = new THREE.Group();
  partsL.forEach(({ obj }, i) => {
    const c = obj.clone(true);
    c.position.copy(partHome[i]!);
    l2.add(c);
  });
  l2.scale.setScalar(0.5);
  l2.position.y = 0.1;
  ex.push(new THREE.Group().add(l2) as THREE.Group);
  // 5 bronze hand gun (after the Yuan bronze gun)
  const gun = new THREE.Group();
  const barrel = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        [0.03, 0],
        [0.045, 0],
        [0.045, 0.2],
        [0.09, 0.26],
        [0.1, 0.34],
        [0.07, 0.4],
        [0.045, 0.44],
        [0.05, 0.62],
        [0.06, 0.66],
        [0.03, 0.66],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      28,
    ),
    std({ color: "#6f5a38", metalness: 0.9, roughness: 0.45 }),
  );
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.set(-0.2, 0.12, 0);
  const socketG = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.22, 16), std({ color: "#6f5a38", metalness: 0.9, roughness: 0.45 }));
  socketG.rotation.z = Math.PI / 2;
  socketG.position.set(-0.3, 0.12, 0);
  gun.add(barrel, socketG);
  ex.push(gun);
  ex.forEach((g, i) => {
    const a = ((i - 2) / 2) * 0.95;
    g.position.set(Math.sin(a) * 1.65, 0, 0.8 - Math.cos(a) * 1.2);
    g.rotation.y = -a * 0.6;
    evo.add(shadowy(g));
  });
  void r;

  // =====================================================================
  const E0 = P.evo + 0.03;
  const ES = (1 - E0) / ex.length;
  const ew = (i: number): [number, number] => [E0 + i * ES, i === ex.length - 1 ? 1.01 : E0 + (i + 1) * ES];
  const L = (id: string, text: string, sub: string | undefined, a: THREE.Object3D, from: number, to: number, side?: "left" | "right", dy?: number): LabelDef => ({
    id,
    text,
    sub,
    anchor: a,
    from,
    to,
    side,
    dy,
  });
  const labels: LabelDef[] = [
    L("furnace", "Lò luyện đan", step("Lò luyện đan"), anchor(furnace, 0, 1.12, 0), P.mats[0], P.mix[0] + 0.02, "left"),
    L("salt", "Diêm tiêu", undefined, anchor(saltpetre, 0, 0.16, 0), P.mats[0] + 0.02, P.mix[0] + 0.03, "left", 70),
    L("sulphur", "Lưu huỳnh", undefined, anchor(sulphur, 0, 0.16, 0), P.mats[0] + 0.04, P.mix[0] + 0.03, "right", 70),
    L("charcoal", "Than củi", undefined, anchor(charcoal, 0, 0.16, 0), P.mats[0] + 0.06, P.mix[0] + 0.03, "right"),
    L("mix", "Hỗn hợp", "trộn lẫn ba chất", anchor(mortar, 0, 0.35, 0), P.mix[0] + 0.03, P.flare[0], "right"),
    L("flare", "Bùng cháy", step("Tai nạn"), anchor(mortar, 0, 0.8, 0), P.flare[0], P.flare[1] + 0.01, "right"),
    L("head", "Mũi giáo", undefined, anchor(headG, 0.3, 0.05, 0), P.explode[0] + 0.02, P.join[0], "right", 60),
    L("tube", "Ống tre", "buộc chặt bằng dây", anchor(tubeG, 0.1, 0.08, 0), P.explode[0] + 0.03, P.join[0], "right", -100),
    L("charge", "Thuốc súng nhồi trong ống", undefined, anchor(charge, 0, 0.05, 0), P.explode[0] + 0.04, P.join[0], "right", -170),
    L("fuse", "Ngòi", undefined, anchor(fuse, -0.24, 0.05, 0), P.explode[0] + 0.05, P.join[0], "left", 10),
    L("shaft", "Cán giáo", undefined, anchor(shaft, -0.9, 0, 0), P.explode[0] + 0.06, P.join[0], "left", 70),
    L("fire", "Hỏa thương", step("Hỏa thương"), anchor(lance, 1.1, 0.1, 0), P.shoot[0], P.shoot[1] + 0.01, "right"),
    L("e-furnace", "Lò luyện đan", "thế kỷ IX, thời Đường", anchor(ex[0]!, 0, 0.7, 0), ...ew(0), "left"),
    L("e-arrow", "Tên lửa cháy", step("Tên lửa cháy"), anchor(ex[1]!, 0.2, 0.2, 0), ...ew(1), "left"),
    L("e-ball", "Hỏa cầu", step("Hỏa cầu"), anchor(ex[2]!, 0, 0.36, 0), ...ew(2), "right"),
    L("e-lance", "Hỏa thương", "tổ tiên của súng", anchor(ex[3]!, 0.3, 0.15, 0), ...ew(3), "right"),
    L("e-gun", "Súng", step("Súng"), anchor(ex[4]!, 0, 0.25, 0), ...ew(4), "right"),
  ];

  // =====================================================================
  const mortarTop = new THREE.Vector3().copy(mortar.position).setY(0.55);
  const update = (p: number, t: number, dt: number) => {
    const outA = span(p, P.flare[1], P.lanceIn + 0.02);
    labA.visible = outA < 0.99;
    labA.position.y = -outA * 1.2;
    furnaceFire.update(dt, labA.visible ? 0.5 : 0);
    // bowls tip their contents into the mortar one after another
    bowls.forEach((b, i) => {
      const k = span(p, P.mix[0] + i * 0.02, P.mix[0] + 0.04 + i * 0.02);
      const back = span(p, P.mix[0] + 0.05 + i * 0.02, P.mix[0] + 0.08 + i * 0.02);
      const above = mortarTop.clone().add(new THREE.Vector3(-0.25 + i * 0.2, 0.15, 0.1));
      b.position.lerpVectors(bowlHome[i]!, above, k - back * 0.0);
      if (back > 0) b.position.lerpVectors(above, bowlHome[i]!, back);
      b.rotation.z = Math.sin(Math.min(1, k) * Math.PI) * (1 - back) * 1.4 * (i === 0 ? 1 : -1);
      (b.children[1] as THREE.Object3D).visible = k < 0.6;
    });
    const mixed = span(p, P.mix[0] + 0.02, P.mix[1]);
    powder.scale.set(0.4 + mixed * 0.6, 0.15 + mixed * 0.25, 0.4 + mixed * 0.6);
    powder.visible = mixed > 0.02;
    const stirring = p > P.mix[0] + 0.06 && p < P.mix[1];
    pestle.rotation.y = stirring ? t * 4 : pestle.rotation.y;
    const burst = p > P.flare[0] && p < P.flare[1] + 0.02 ? 1 : 0;
    flare.update(dt, burst ? 0.9 : 0);
    flareLight.intensity = burst * (6 + Math.sin(t * 30) * 2);
    // B
    const inB = span(p, P.lanceIn - 0.02, P.lanceIn + 0.04);
    const outB = span(p, P.evo - 0.02, P.evo + 0.04);
    const showB = inB > 0.001 && outB < 0.999;
    lance.visible = stands.visible = showB;
    lance.position.y = 0.45 + (1 - inB) * -1.2 - outB * 1.4;
    stands.position.y = (1 - inB) * -1.2 - outB * 1.4;
    const apart = span(p, P.explode[0], P.explode[1]) * (1 - span(p, P.join[0], P.join[1]));
    partsL.forEach(({ obj, off }, i) => {
      obj.position.x = partHome[i]!.x + off * apart;
      obj.position.y = partHome[i]!.y + (i === 2 ? apart * 0.28 : i === 3 ? apart * 0.35 : 0);
    });
    stands.visible = showB && apart < 0.05;
    const firing = p > P.shoot[0] && p < P.shoot[1] + 0.02;
    jet.update(dt, firing ? 1 : 0);
    // C
    const active = Math.min(ex.length - 1, Math.max(0, Math.floor((p - E0) / ES)));
    ex.forEach((g, i) => {
      const k = span(p, P.evo + 0.01, P.evo + 0.04);
      const on = p >= E0 && i === active ? 1 : 0;
      g.userData["on"] = (g.userData["on"] ?? 0) + (on - (g.userData["on"] ?? 0)) * 0.12;
      const lift = g.userData["on"] as number;
      g.visible = k > 0.001;
      g.scale.setScalar((0.4 + 0.6 * k) * (1 + lift * 0.35));
      g.position.y = (1 - k) * -0.6 + lift * 0.1;
    });
  };

  return {
    labels,
    phases: [
      { from: 0, to: P.mix[0], title: "Lò luyện đan", text: ch.why[1] ?? "" },
      { from: P.mix[0], to: P.lanceIn, title: "Hỗn hợp bùng cháy", text: ch.why[2] ?? "" },
      { from: P.lanceIn, to: P.evo, title: "Hỏa thương", text: step("Hỏa thương") },
      { from: P.evo, to: 1.01, title: "Từ lò luyện đan đến súng", text: ch.why[0] ?? "" },
    ],
    update,
    frame(p) {
      if (p < P.lanceIn) return { target: new THREE.Vector3(-0.1, 0.35, 0.2), distance: 5.4, height: 2.8 };
      if (p < P.evo) return { target: new THREE.Vector3(0.25, 0.45, 0.2), distance: 6.3, height: 2.6 };
      if (p < E0) return { target: new THREE.Vector3(0, 0.2, 0.2), distance: 6.0, height: 3.0 };
      const g = ex[Math.min(ex.length - 1, Math.max(0, Math.floor((p - E0) / ES)))]!;
      return { target: new THREE.Vector3(g.position.x * 0.8, 0.25, g.position.z), distance: 3.9, height: 2.0 };
    },
  };
}
