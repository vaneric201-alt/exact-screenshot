import * as THREE from "three";
import type { ChapterData } from "../../content/content";
import { span, rng, type LabelDef, type Stage } from "../stage/stage";
import { canvasTex, pbr, woodTex } from "../stage/textures";
import type { InventionScene } from "./types";

/*
 * The compass, on the plinth. Every needle, spoon and fish points south in the
 * world — turn the plinth and they swing back, as the real ones would.
 *  A · a lodestone holding iron nails; the si nan spoon on its bronze board
 *      (labelled as a 20th-century reconstruction, as the chapter says)
 *  B · Shen Kuo's four ways to mount a needle: floating on water, on a
 *      fingernail, on the rim of a bowl, hung on a silk thread; the needle
 *      points a little east of south — magnetic declination
 *  C · evolution: lodestone → si nan → south-pointing fish (1044) → hanging
 *      needle (c. 1088) → mariner's compass (c. 1119) → luopan
 */

const P = {
  stone: [0.02, 0.14] as const,
  spoon: [0.14, 0.31] as const,
  four: [0.34, 0.52] as const,
  decl: [0.52, 0.64] as const,
  evo: 0.66,
};

/** South, on the plinth: to the right and a little towards the reader. */
const SOUTH = new THREE.Vector3(1, 0, 0.3).normalize();
const SOUTH_YAW = Math.atan2(-SOUTH.z, SOUTH.x);
/** Shown larger than life so it can be seen. */
const DECLINATION = 0.14;

export function create(stage: Stage, ch: ChapterData): InventionScene {
  const root = new THREE.Group();
  stage.turntable.add(root);
  const r = rng(1088);
  const steps = ch.process.parts[0]!.steps;
  const step = (name: string) => steps.find((s) => s.name.startsWith(name))?.desc ?? "";
  const std = (o: THREE.MeshStandardMaterialParameters & { relief?: number }) => pbr({ roughness: 0.8, ...o });
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
  const bronze = std({ color: "#8a6a3a", metalness: 0.85, roughness: 0.38 });
  const lodestoneMat = std({ color: "#2e2c2a", metalness: 0.55, roughness: 0.42 });
  const iron = std({ color: "#5d5a56", metalness: 0.8, roughness: 0.4 });
  const water = new THREE.MeshPhysicalMaterial({ color: "#8fb4c4", roughness: 0.05, transmission: 0.5, thickness: 0.05, transparent: true, opacity: 0.8 });
  const glaze = std({ color: "#dfe3da", roughness: 0.25 });

  /** Things that point south: their local +x is the pointing end. */
  const pointers: { obj: THREE.Object3D; offset: number; seed: number }[] = [];
  const pointer = <T extends THREE.Object3D>(obj: T, offset = 0) => {
    pointers.push({ obj, offset, seed: r() * 10 });
    return obj;
  };

  const needleGeo = () => {
    const g = new THREE.Group();
    const south = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.19, 10), std({ color: "#3a3836", metalness: 0.85, roughness: 0.3 }));
    south.rotation.z = -Math.PI / 2;
    south.position.x = 0.095;
    const north = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.19, 10), std({ color: "#b8b4ae", metalness: 0.85, roughness: 0.3 }));
    north.rotation.z = Math.PI / 2;
    north.position.x = -0.095;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), std({ color: "#b23a2b" }));
    tip.position.x = 0.19;
    g.add(south, north, tip);
    return g;
  };
  const bowlGeo = (rad: number, h: number) =>
    new THREE.LatheGeometry(
      [
        [0, 0],
        [rad * 0.55, 0],
        [rad * 0.9, h * 0.35],
        [rad, h],
        [rad * 0.94, h],
        [rad * 0.84, h * 0.4],
        [0, h * 0.12],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      40,
    );

  // =====================================================================
  // A · lodestone and si nan
  const partA = new THREE.Group();
  root.add(partA);
  const rockGeo = new THREE.IcosahedronGeometry(0.3, 3);
  const rp = rockGeo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < rp.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(rp, i);
    const n = 1 + 0.18 * Math.sin(v.x * 9 + v.y * 4) * Math.cos(v.z * 7);
    v.multiplyScalar(n);
    rp.setXYZ(i, v.x, v.y * 0.75, v.z);
  }
  rockGeo.computeVertexNormals();
  const lodestone = new THREE.Group();
  const rock = new THREE.Mesh(rockGeo, lodestoneMat);
  rock.position.y = 0.22;
  lodestone.add(rock);
  // iron nails clinging to it
  for (let k = 0; k < 14; k++) {
    const nail = new THREE.Group();
    const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.16, 6), iron);
    shank.position.y = 0.08;
    const headN = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 10), iron);
    headN.position.y = 0.16;
    nail.add(shank, headN);
    const dir = new THREE.Vector3(r() - 0.5, r() * 0.8 - 0.1, r() - 0.5).normalize();
    nail.position.copy(dir.clone().multiplyScalar(0.27)).add(new THREE.Vector3(0, 0.22, 0));
    nail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    lodestone.add(nail);
  }
  lodestone.position.set(-1.25, 0, 0.35);
  partA.add(shadowy(lodestone));

  // the bronze board of the si nan (reconstruction)
  const boardTex = canvasTex(
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = "#8a6a3a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#3e2c14";
      ctx.lineWidth = 6;
      ctx.strokeRect(40, 40, w - 80, h - 80);
      ctx.strokeRect(150, 150, w - 300, h - 300);
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 250, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#c8a870";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 240, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#3e2c14";
      ctx.lineWidth = 3;
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 + Math.cos(a) * 270, h / 2 + Math.sin(a) * 270);
        ctx.lineTo(w / 2 + Math.cos(a) * 360, h / 2 + Math.sin(a) * 360);
        ctx.stroke();
      }
      // the four directions by their earthly branches: 午 south, 子 north, 卯 east, 酉 west
      ctx.fillStyle = "#2a1d0c";
      ctx.font = `900 76px "Noto Serif TC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const dirs: [string, number, number][] = [
        ["午", w - 95, h / 2],
        ["子", 95, h / 2],
        ["卯", w / 2, 95],
        ["酉", w / 2, h - 95],
      ];
      for (const [c, x, y] of dirs) ctx.fillText(c, x, y);
    },
    11,
  );
  const sinan = new THREE.Group();
  const boardFace = std({ map: boardTex, metalness: 0.7, roughness: 0.45 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 1.0), [bronze, bronze, boardFace, bronze, bronze, bronze]);
  board.position.y = 0.02;
  // the board's 午 (south) mark faces south
  board.rotation.y = SOUTH_YAW;
  sinan.add(board);
  // the spoon: a polished lodestone ladle whose handle points south
  const spoonMat = std({ color: "#1f1d1b", metalness: 0.6, roughness: 0.22, side: THREE.DoubleSide });
  const spoon = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), spoonMat);
  bowl.scale.set(1.25, 0.7, 1);
  bowl.position.y = 0.065;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 0.26, 12), spoonMat);
  handle.rotation.z = -Math.PI / 2 + 0.12;
  handle.position.set(0.21, 0.08, 0);
  spoon.add(bowl, handle);
  spoon.position.y = 0.04;
  sinan.add(spoon);
  sinan.position.set(0.55, 0, 0.2);
  partA.add(shadowy(sinan));

  // =====================================================================
  // B · Shen Kuo's four mountings
  const partB = new THREE.Group();
  root.add(partB);
  const stations: THREE.Group[] = [];
  // 1 floating on water
  const s1 = new THREE.Group();
  s1.add(new THREE.Mesh(bowlGeo(0.24, 0.16), glaze));
  const w1 = new THREE.Mesh(new THREE.CircleGeometry(0.21, 36), water);
  w1.rotation.x = -Math.PI / 2;
  w1.position.y = 0.13;
  s1.add(w1);
  const n1 = pointer(needleGeo());
  n1.position.y = 0.14;
  s1.add(n1);
  stations.push(s1);
  // 2 balanced on a fingernail
  const s2 = new THREE.Group();
  const skin = std({ color: "#c99a7a", roughness: 0.6 });
  const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.28, 8, 16), skin);
  finger.position.y = 0.19;
  const nailPlate = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), std({ color: "#e9c8b4", roughness: 0.3 }));
  nailPlate.position.y = 0.345;
  s2.add(finger, nailPlate);
  const n2 = pointer(needleGeo());
  n2.position.y = 0.37;
  s2.add(n2);
  stations.push(s2);
  // 3 on the rim of a bowl
  const s3 = new THREE.Group();
  s3.add(new THREE.Mesh(bowlGeo(0.2, 0.18), glaze));
  const n3 = pointer(needleGeo());
  n3.position.set(0, 0.185, -0.2);
  s3.add(n3);
  stations.push(s3);
  // 4 hung from a silk thread
  const buildHanger = () => {
    const g = new THREE.Group();
    const wood = std({ map: woodTex("#5a3a22", 13) });
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), wood);
    post.position.set(-0.18, 0.3, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.035), wood);
    arm.position.set(-0.06, 0.6, 0);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.2), wood);
    foot.position.set(-0.18, 0.015, 0);
    const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.36, 4), std({ color: "#f3ecd8" }));
    thread.position.set(0.06, 0.42, 0);
    const wax = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), std({ color: "#c9a24a" }));
    wax.position.set(0.06, 0.245, 0);
    const needle = pointer(needleGeo(), DECLINATION);
    needle.position.set(0.06, 0.24, 0);
    g.add(post, arm, foot, thread, wax, needle);
    return g;
  };
  const s4 = buildHanger();
  stations.push(s4);
  // true south, drawn on the plinth under the hanging needle
  const trueSouth = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.012), new THREE.MeshBasicMaterial({ color: "#b23a2b", transparent: true, opacity: 0 }));
  trueSouth.rotation.x = -Math.PI / 2;
  trueSouth.position.x = 0.31;
  const trueSouthPivot = new THREE.Group();
  trueSouthPivot.add(trueSouth);
  trueSouthPivot.position.set(0.06, 0.005, 0);
  s4.add(trueSouthPivot);
  stations.forEach((s, i) => {
    s.position.set(-1.1 + i * 0.74, 0, 0.35 + (i % 2) * 0.22);
    partB.add(shadowy(s));
  });

  // =====================================================================
  // C · evolution
  const evo = new THREE.Group();
  root.add(evo);
  const ex: THREE.Group[] = [];
  // 1 lodestone
  const e1 = new THREE.Group();
  const eRock = rock.clone();
  eRock.scale.setScalar(0.7);
  eRock.position.y = 0.15;
  e1.add(eRock);
  ex.push(e1);
  // 2 si nan
  const e2 = new THREE.Group();
  const eBoard = board.clone();
  eBoard.scale.setScalar(0.55);
  const eSpoon = pointer(spoon.clone(true));
  eSpoon.scale.setScalar(0.8);
  eSpoon.position.y = 0.03;
  e2.add(eBoard, eSpoon);
  ex.push(e2);
  // 3 south-pointing fish in a bowl of water
  const e3 = new THREE.Group();
  e3.add(new THREE.Mesh(bowlGeo(0.26, 0.15), glaze));
  const w3 = w1.clone();
  w3.scale.setScalar(1.1);
  w3.position.y = 0.12;
  e3.add(w3);
  const fishShape = new THREE.Shape();
  fishShape.moveTo(0.12, 0);
  fishShape.quadraticCurveTo(0.05, 0.05, -0.06, 0.02);
  fishShape.lineTo(-0.12, 0.05);
  fishShape.lineTo(-0.1, 0);
  fishShape.lineTo(-0.12, -0.05);
  fishShape.lineTo(-0.06, -0.02);
  fishShape.quadraticCurveTo(0.05, -0.05, 0.12, 0);
  const fishGeo = new THREE.ExtrudeGeometry(fishShape, { depth: 0.008, bevelEnabled: false });
  fishGeo.rotateX(-Math.PI / 2);
  const fish = pointer(new THREE.Group());
  const fishMesh = new THREE.Mesh(fishGeo, std({ color: "#4a4744", metalness: 0.8, roughness: 0.35 }));
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), std({ color: "#b23a2b" }));
  eye.position.set(0.075, 0.01, 0.015);
  fish.add(fishMesh, eye);
  fish.position.y = 0.125;
  e3.add(fish);
  ex.push(e3);
  // 4 needle on a silk thread
  const e4 = new THREE.Group();
  e4.add(buildHanger());
  ex.push(e4);
  // 5 mariner's compass: a water bowl set in a square wooden box
  const e5 = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.46), std({ map: woodTex("#6a4428", 17) }));
  box.position.y = 0.06;
  const bowl5 = new THREE.Mesh(bowlGeo(0.18, 0.1), glaze);
  bowl5.position.y = 0.09;
  const w5 = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), water);
  w5.rotation.x = -Math.PI / 2;
  w5.position.y = 0.18;
  const n5 = pointer(needleGeo());
  n5.scale.setScalar(0.8);
  n5.position.y = 0.185;
  e5.add(box, bowl5, w5, n5);
  ex.push(e5);
  // 6 luopan, faced with a photograph of a real one
  const e6 = new THREE.Group();
  const luoTex = new THREE.TextureLoader().load("/img/compass-7.webp");
  luoTex.colorSpace = THREE.SRGBColorSpace;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.62), std({ map: woodTex("#7a2a1c", 19), roughness: 0.4 }));
  base.position.y = 0.03;
  const rimMat = std({ color: "#8a5a2a" });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.05, 64), [rimMat, std({ map: luoTex, roughness: 0.5 }), rimMat]);
  disc.position.y = 0.085;
  e6.add(base, disc);
  ex.push(e6);
  ex.forEach((g, i) => {
    const a = ((i - 2.5) / 2.5) * 1.05;
    g.position.set(Math.sin(a) * 1.75, 0, 0.9 - Math.cos(a) * 1.3);
    evo.add(shadowy(g));
  });

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
    L("stone", "Đá nam châm", step("Đá nam châm"), anchor(lodestone, 0, 0.5, 0), P.stone[0], P.spoon[1], "left"),
    L("spoon", "Tư nam", "mô hình phục dựng thế kỷ XX · chưa tìm thấy hiện vật, còn tranh luận", anchor(sinan, 0.1, 0.2, 0), P.spoon[0], P.spoon[1], "right", -70),
    L("south", "Cán thìa chỉ hướng nam", undefined, anchor(sinan, 0.5, 0.05, 0.15), P.spoon[0] + 0.08, P.spoon[1], "right", 70),
    L("m1", "Thả nổi trên nước", undefined, anchor(s1, 0, 0.2, 0), P.four[0] + 0.01, P.decl[0], "left", -60),
    L("m2", "Đặt trên móng tay", undefined, anchor(s2, 0, 0.42, 0), P.four[0] + 0.04, P.decl[0], "left", -90),
    L("m3", "Đặt trên miệng bát", undefined, anchor(s3, 0, 0.22, -0.2), P.four[0] + 0.07, P.decl[0], "right", -90),
    L("m4", "Treo bằng sợi tơ", "Thẩm Quát cho là tốt nhất", anchor(s4, 0.06, 0.62, 0), P.four[0] + 0.1, P.decl[1], "right", -60),
    L("decl", "Hơi lệch về phía đông", "độ lệch từ — Thẩm Quát ghi lại lần đầu", anchor(s4, 0.3, 0.02, 0), P.decl[0] + 0.02, P.decl[1], "right", 70),
    L("e1", "Đá nam châm", "hút sắt, tự quay về một hướng", anchor(e1, 0, 0.35, 0), ...ew(0), "left"),
    L("e2", "Tư nam", "Chiến Quốc – Hán, còn tranh luận · bản phục dựng", anchor(e2, 0, 0.15, 0), ...ew(1), "left"),
    L("e3", "Cá chỉ nam", "1044 · Vũ kinh tổng yếu", anchor(e3, 0, 0.18, 0), ...ew(2), "left"),
    L("e4", "Kim treo sợi tơ", "khoảng 1088 · Thẩm Quát", anchor(e4, 0.06, 0.62, 0), ...ew(3), "right"),
    L("e5", "La bàn trên biển", "khoảng 1119", anchor(e5, 0, 0.2, 0), ...ew(4), "right"),
    L("e6", "La kinh", step("La kinh"), anchor(e6, 0, 0.12, 0), ...ew(5), "right"),
  ];

  // =====================================================================
  const update = (p: number, t: number) => {
    const spin = stage.turntable.rotation.y;
    // A
    const outA = span(p, P.spoon[1], P.four[0]);
    partA.visible = outA < 0.99;
    partA.position.y = -outA * 1.2;
    // the spoon turns idly, then is set spinning and settles pointing south
    const settle = span(p, P.spoon[0], P.spoon[0] + 0.1);
    const whirl = p < P.spoon[0] ? t * 0.4 : (1 - settle) * t * 6;
    spoon.rotation.y = SOUTH_YAW - spin + whirl;
    // B
    const inB = span(p, P.four[0] - 0.03, P.four[0] + 0.03);
    const outB = span(p, P.evo - 0.02, P.evo + 0.04);
    partB.visible = inB > 0.001 && outB < 0.999;
    partB.position.y = (1 - inB) * -1 - outB * 1.2;
    const calm = span(p, P.four[0], P.four[1]);
    for (const pt of pointers) {
      // local yaw so that the world yaw is south (plus declination), with a settling swing
      const wobble = (1 - calm) * 1.2 * Math.sin(t * 2.4 + pt.seed) + 0.02 * Math.sin(t * 1.3 + pt.seed);
      pt.obj.rotation.y = SOUTH_YAW + pt.offset - spin + wobble;
    }
    (trueSouth.material as THREE.MeshBasicMaterial).opacity = span(p, P.decl[0], P.decl[0] + 0.03);
    trueSouthPivot.rotation.y = SOUTH_YAW - spin;
    // C
    const active = Math.min(ex.length - 1, Math.max(0, Math.floor((p - E0) / ES)));
    ex.forEach((g, i) => {
      const k = span(p, P.evo + 0.01, P.evo + 0.04);
      const on = p >= E0 && i === active ? 1 : 0;
      g.userData["on"] = (g.userData["on"] ?? 0) + (on - (g.userData["on"] ?? 0)) * 0.12;
      const lift = g.userData["on"] as number;
      g.visible = k > 0.001;
      g.scale.setScalar((0.4 + 0.6 * k) * (1 + lift * 0.4));
      g.position.y = (1 - k) * -0.6 + lift * 0.1;
    });
  };

  return {
    labels,
    phases: [
      { from: 0, to: P.four[0], title: "Đá nam châm và tư nam", text: `${ch.origin[1] ?? ""} ${ch.origin[2] ?? ""}` },
      { from: P.four[0], to: P.decl[0], title: "Bốn cách đặt kim", text: step("Bốn cách đặt kim") },
      { from: P.decl[0], to: P.evo, title: "Độ lệch từ", text: ch.origin[4] ?? "" },
      { from: P.evo, to: 1.01, title: "Từ đá nam châm đến la kinh", text: ch.why[2] ?? "" },
    ],
    update,
    frame(p) {
      if (p < P.four[0]) return { target: new THREE.Vector3(-0.2, 0.25, 0.3), distance: 5.0, height: 2.6 };
      if (p < P.decl[0]) return { target: new THREE.Vector3(0, 0.25, 0.45), distance: 4.4, height: 2.1 };
      if (p < P.evo) return { target: new THREE.Vector3(s4.position.x + 0.1, 0.25, s4.position.z), distance: 2.6, height: 1.5 };
      if (p < E0) return { target: new THREE.Vector3(0, 0.2, 0.2), distance: 6.0, height: 3.0 };
      const g = ex[Math.min(ex.length - 1, Math.max(0, Math.floor((p - E0) / ES)))]!;
      return { target: new THREE.Vector3(g.position.x * 0.8, 0.22, g.position.z), distance: 3.6, height: 1.9 };
    },
  };
}
