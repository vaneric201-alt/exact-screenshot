import * as THREE from "three";
import type { ChapterData } from "../../content/content";
import { span, rng, type LabelDef, type Stage } from "../stage/stage";
import { bambooTex, barkTex, brickTex, canvasTex, clothTex, paperTex, pbr, stoneTex, textTex, woodTex } from "../stage/textures";
import type { InventionScene } from "./types";

/*
 * Paper, on the plinth:
 *  A · the four cheap materials Cai Lun used (bark, hemp ends, rags, old nets)
 *  B · pounding in a mortar, pulp in a vat, lifting a sheet on a screen mould,
 *      pasting it on a warm wall to dry
 *  C · what people wrote on before and after: bamboo slips, silk, the rough
 *      paper of the Western Han, the paper of 105
 */

const P = {
  matsEnd: 0.26,
  pound: [0.26, 0.36] as const,
  vat: [0.36, 0.44] as const,
  dip: [0.44, 0.54] as const,
  dry: [0.54, 0.66] as const,
  evo: 0.66,
};

export function create(stage: Stage, ch: ChapterData): InventionScene {
  const root = new THREE.Group();
  stage.turntable.add(root);
  const r = rng(105);
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

  // =====================================================================
  // A · materials
  const mats = new THREE.Group();
  root.add(mats);

  // bark: thick curved slabs stripped from a trunk — fissured outside, pale bast inside
  const bark = new THREE.Group();
  const barkOut = std({ map: barkTex(21), roughness: 1, relief: 1.6 });
  const bastMat = std({ map: woodTex("#c9a879", 22), roughness: 0.85, relief: 0.8 });
  for (let k = 0; k < 4; k++) {
    const R = 0.2 + r() * 0.06;
    const T = 0.035 + r() * 0.015;
    const A = 1.2 + r() * 0.7;
    const sh = new THREE.Shape();
    sh.absarc(0, 0, R, 0, A, false);
    sh.absarc(0, 0, R - T, A, 0, true);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.8 + r() * 0.2, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 28 });
    g.translate(0, 0, -0.45);
    const m = new THREE.Mesh(g, [bastMat, barkOut]);
    m.rotation.set(0, Math.PI / 2 + (r() - 0.5) * 0.5, 0);
    m.position.set((r() - 0.5) * 0.25, 0.02 + k * 0.05 - R * 0.45, (r() - 0.5) * 0.3);
    m.rotation.z = r() * 0.6;
    bark.add(m);
  }
  bark.position.set(-1.6, 0, 0.2);
  mats.add(shadowy(bark));

  // hemp: a tied bundle of fibres
  const hemp = new THREE.Group();
  const fibreGeo = new THREE.CylinderGeometry(0.006, 0.006, 1, 4);
  const fibres = new THREE.InstancedMesh(fibreGeo, std({ color: "#cdb98a", roughness: 0.9 }), 140);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let k = 0; k < 140; k++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 0.09;
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.12, 0, Math.PI / 2 + (r() - 0.5) * 0.12));
    m4.compose(new THREE.Vector3((r() - 0.5) * 0.12, 0.1 + Math.sin(a) * rad, Math.cos(a) * rad), q, new THREE.Vector3(1, 0.8 + r() * 0.35, 1));
    fibres.setMatrixAt(k, m4);
  }
  hemp.add(fibres);
  for (const x of [-0.18, 0.18]) {
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 8, 24), std({ color: "#7a5a32" }));
    tie.rotation.y = Math.PI / 2;
    tie.position.set(x, 0.1, 0);
    hemp.add(tie);
  }
  hemp.position.set(-0.55, 0, 0.9);
  hemp.rotation.y = 0.5;
  mats.add(shadowy(hemp));

  // rags: folded pieces of worn cloth
  const rags = new THREE.Group();
  const clothPiece = (w: number, d: number, color: string, seed: number) => {
    const g = new THREE.PlaneGeometry(w, d, 28, 20);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute("position") as THREE.BufferAttribute;
    const rr = rng(seed);
    const f1 = 4 + rr() * 4;
    const f2 = 3 + rr() * 5;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, 0.04 * Math.sin(x * f1 + z * 2) * Math.cos(z * f2) + 0.03 * Math.max(0, Math.sin(x * 3 - 1)) + 0.02);
    }
    g.computeVertexNormals();
    return new THREE.Mesh(g, std({ map: clothTex(color, seed), side: THREE.DoubleSide, roughness: 0.95 }));
  };
  const rag1 = clothPiece(0.75, 0.55, "#4a5a7a", 31);
  const rag2 = clothPiece(0.6, 0.45, "#c9b99a", 37);
  rag2.position.set(0.08, 0.05, 0.05);
  rag2.rotation.y = 0.7;
  rags.add(rag1, rag2);
  rags.position.set(0.55, 0, 0.9);
  mats.add(shadowy(rags));

  // old fishing net draped over a heap
  const net = new THREE.Group();
  const twine = canvasTex(
    256,
    32,
    (ctx, w, h) => {
      ctx.fillStyle = "#8a6d45";
      ctx.fillRect(0, 0, w, h);
      for (let x = -h; x < w; x += 8) {
        ctx.strokeStyle = "rgba(40,28,12,0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }
    },
    81,
    true,
    { normal: 3 },
  );
  twine.repeat.set(6, 1);
  const netMat = std({ map: twine, roughness: 0.95 });
  const heap = (x: number, z: number) => 0.3 * Math.exp(-(x * x + z * z) / 0.12) + 0.015;
  const lines: THREE.BufferGeometry[] = [];
  for (let k = -6; k <= 6; k++) {
    for (const dir of [0, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let j = -12; j <= 12; j++) {
        const a = (k / 6) * 0.5;
        const b = (j / 12) * 0.5;
        const x = dir ? b : a;
        const z = dir ? a : b;
        pts.push(new THREE.Vector3(x, heap(x, z), z));
      }
      lines.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.0075, 6));
    }
  }
  lines.forEach((g) => net.add(new THREE.Mesh(g, netMat)));
  const knots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.014, 8, 6), netMat, 13 * 13);
  {
    let i = 0;
    const m = new THREE.Matrix4();
    for (let a1 = -6; a1 <= 6; a1++)
      for (let b1 = -6; b1 <= 6; b1++) {
        const x = (a1 / 6) * 0.5;
        const z = (b1 / 6) * 0.5;
        m.makeScale(1.3, 0.8, 1.3).setPosition(x, heap(x, z), z);
        knots.setMatrixAt(i++, m);
      }
  }
  net.add(knots);
  const floats = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), std({ color: "#b98a52" }));
  for (const [x, z] of [
    [-0.45, -0.3],
    [0.4, 0.35],
    [0.2, -0.45],
  ] as const) {
    const f = floats.clone();
    f.position.set(x, heap(x, z) + 0.03, z);
    net.add(f);
  }
  net.position.set(1.6, 0, 0.2);
  mats.add(shadowy(net));

  // =====================================================================
  // B · making paper
  const proc = new THREE.Group();
  root.add(proc);

  // stone mortar and wooden pestle
  const mortar = new THREE.Group();
  const prof = [
    [0, 0],
    [0.36, 0],
    [0.42, 0.06],
    [0.45, 0.32],
    [0.41, 0.44],
    [0.34, 0.44],
    [0.3, 0.26],
    [0.18, 0.18],
    [0, 0.16],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  mortar.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 40), std({ map: stoneTex("#7f7a70", 41), roughness: 0.9 })));
  const pulpInMortar = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), std({ map: paperTex(true, 43), roughness: 1 }));
  pulpInMortar.rotation.x = -Math.PI / 2;
  pulpInMortar.position.y = 0.2;
  mortar.add(pulpInMortar);
  const pestle = new THREE.Group();
  const pestleMat = std({ map: woodTex("#9a6a3c", 47), roughness: 0.7 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.1, 16), pestleMat);
  shaft.position.y = 0.55;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), pestleMat);
  knob.scale.set(1, 0.8, 1);
  pestle.add(shaft, knob);
  pestle.rotation.z = 0.12;
  mortar.add(pestle);
  mortar.position.set(-1.55, 0, -0.35);
  proc.add(shadowy(mortar));

  // the vat: staves, iron hoops, a surface of milky pulp
  const vat = new THREE.Group();
  const staveTex = woodTex("#7a5230", 53);
  staveTex.rotation = Math.PI / 2;
  staveTex.repeat.set(1, 8);
  const staveMat = std({ map: woodTex("#7a5230", 54), roughness: 0.8, relief: 1.3 });
  const tub = new THREE.Group();
  const STAVES = 30;
  for (let k = 0; k < STAVES; k++) {
    const a0 = (k / STAVES) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.72, 0.05), staveMat);
    const rr = 0.78;
    st.position.set(Math.cos(a0) * rr, 0, Math.sin(a0) * rr);
    st.rotation.y = -a0 + Math.PI / 2;
    st.rotation.x = 0;
    // the tub flares slightly toward the top
    st.rotateX(-0.055);
    st.scale.y = 0.98 + r() * 0.04;
    tub.add(st);
  }
  tub.position.y = 0.36;
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.74, 48), std({ color: "#5a3a20" }));
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.02;
  vat.add(tub, bottom);
  for (const y of [0.12, 0.6]) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.74 + (y / 0.72) * 0.08 + 0.012, 0.018, 8, 64), std({ color: "#3a3430", metalness: 0.6, roughness: 0.5 }));
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = y;
    vat.add(hoop);
  }
  const pulpGeo = new THREE.CircleGeometry(0.79, 64, 0, Math.PI * 2);
  pulpGeo.rotateX(-Math.PI / 2);
  const pulpMat = new THREE.MeshPhysicalMaterial({ color: "#ebe3cf", roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, map: paperTex(false, 57) });
  const pulp = new THREE.Mesh(pulpGeo, pulpMat);
  pulp.position.y = 0.58;
  vat.add(pulp);
  vat.position.set(0.05, 0, -0.35);
  proc.add(shadowy(vat));

  // the screen mould: a bamboo frame with fine slats
  const mould = new THREE.Group();
  const bamboo = std({ map: bambooTex(59), roughness: 0.6 });
  const W = 0.9;
  const D = 0.64;
  for (const [w, d, x, z] of [
    [W, 0.04, 0, -D / 2],
    [W, 0.04, 0, D / 2],
    [0.04, D, -W / 2, 0],
    [0.04, D, W / 2, 0],
  ] as const) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), bamboo);
    bar.position.set(x, 0, z);
    mould.add(bar);
  }
  const slats = canvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "#c8ad6a";
      ctx.lineWidth = 2;
      for (let y = 2; y < h; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.lineWidth = 3;
      for (let x = 20; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    },
    61,
  );
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, D - 0.04), std({ map: slats, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
  screen.rotation.x = -Math.PI / 2;
  mould.add(screen);
  // the screen's thin bamboo strips, laid across, and the cross-ribs beneath
  const NS = 60;
  const strips = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0035, 0.0035, W - 0.06, 5), std({ map: bambooTex(62), roughness: 0.55 }), NS);
  {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));
    for (let k = 0; k < NS; k++) {
      m.compose(new THREE.Vector3(0, 0.006, -(D - 0.06) / 2 + (k / (NS - 1)) * (D - 0.06)), q, new THREE.Vector3(1, 1, 1));
      strips.setMatrixAt(k, m);
    }
  }
  mould.add(strips);
  for (let k = 0; k < 6; k++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, D - 0.04), bamboo);
    rib.position.set(-W / 2 + 0.1 + k * ((W - 0.2) / 5), -0.006, 0);
    mould.add(rib);
  }
  proc.add(shadowy(mould));

  // the wet sheet it lifts, which then goes to the wall
  const wetTex = paperTex(false, 67);
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.08, D - 0.08, 12, 8),
    new THREE.MeshPhysicalMaterial({ map: wetTex, color: "#d8cfb8", roughness: 0.4, clearcoat: 0.5, transparent: true, side: THREE.DoubleSide }),
  );
  proc.add(shadowy(sheet));

  // the drying wall: warm brick, sheets pasted on it
  const wall = new THREE.Group();
  const wallTex = brickTex(71);
  const bricks = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.35, 0.26), std({ map: wallTex, roughness: 0.95 }));
  bricks.position.y = 0.68;
  wall.add(bricks);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.34), std({ color: "#6f6456" }));
  cap.position.y = 1.39;
  wall.add(cap);
  const dried = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, D - 0.1), std({ map: paperTex(false, 73), roughness: 0.9 }));
  dried.position.set(-0.32, 0.9, 0.135);
  dried.scale.setScalar(0.72);
  wall.add(dried);
  const dried2 = dried.clone();
  dried2.position.set(0.34, 0.42, 0.135);
  wall.add(dried2);
  wall.position.set(1.55, 0, -0.95);
  wall.rotation.y = -0.35;
  proc.add(shadowy(wall));
  const wallSpot = anchor(wall, 0.3, 0.92, 0.14);

  // =====================================================================
  // C · evolution of writing materials
  const evo = new THREE.Group();
  root.add(evo);
  const exhibits: THREE.Group[] = [];

  // bamboo slips tied with two cords, the last ones rolled up
  const slipsG = new THREE.Group();
  const slipTex = textTex("自古書契多編以竹簡", { w: 64, h: 512, cols: 1, paper: null, ink: "#2b2014", size: 52 });
  const slipMat = [bamboo, bamboo, std({ map: bambooTex(79), roughness: 0.6 }), bamboo, bamboo, bamboo];
  const slipFace = std({ map: slipTex, transparent: true, alphaTest: 0.4 });
  for (let k = 0; k < 13; k++) {
    const slip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.012, 0.95), slipMat);
    const roll = Math.max(0, k - 8);
    const x = -0.36 + k * 0.06 - roll * 0.03;
    slip.position.set(x, 0.01 + roll * roll * 0.012, 0);
    slip.rotation.z = -roll * 0.35;
    const txt = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.9), slipFace);
    txt.rotation.x = -Math.PI / 2;
    txt.position.y = 0.007;
    slip.add(txt);
    slipsG.add(slip);
  }
  for (const z of [-0.3, 0.3]) {
    const cord = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.016, 0.01), std({ color: "#5a3f22" }));
    cord.position.set(0.02, 0.02, z);
    slipsG.add(cord);
  }
  exhibits.push(slipsG);

  // silk scroll on a wooden roller
  const silkG = new THREE.Group();
  const silkTex = textTex("縑帛者謂之為紙縑貴而簡重並不便於人", { w: 512, h: 384, cols: 6, paper: "#e7dab9", ink: "#3a2a18" });
  const silkGeo = new THREE.PlaneGeometry(0.62, 0.8, 24, 1);
  const sp = silkGeo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.03 * Math.sin((sp.getX(i) + 0.31) * 8));
  silkGeo.computeVertexNormals();
  const silk = new THREE.Mesh(silkGeo, new THREE.MeshPhysicalMaterial({ map: silkTex, sheen: 1, sheenColor: new THREE.Color("#fff4dc"), roughness: 0.55, side: THREE.DoubleSide }));
  silk.rotation.x = -Math.PI / 2;
  silk.position.set(0.02, 0.05, 0);
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 20), std({ map: woodTex("#5a2e1c", 83), roughness: 0.5 }));
  roller.rotation.x = Math.PI / 2;
  roller.position.set(-0.34, 0.06, 0);
  for (const z of [-0.47, 0.47]) {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), std({ color: "#c9a24a", metalness: 0.9, roughness: 0.35 }));
    k.position.set(-0.34, 0.06, z);
    silkG.add(k);
  }
  const rolled = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.8, 24), std({ map: silkTex, roughness: 0.55 }));
  rolled.rotation.x = Math.PI / 2;
  rolled.position.set(-0.34, 0.09, 0);
  silkG.add(silk, roller, rolled);
  exhibits.push(silkG);

  // rough Western Han paper fragment on a board
  const hanG = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.7), std({ map: woodTex("#4a3322", 89), roughness: 0.6 }));
  board.position.y = 0.02;
  const frag = new THREE.Shape();
  const n = 22;
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2;
    const rad = 0.24 + r() * 0.08;
    const x = Math.cos(a) * rad * 1.25;
    const y = Math.sin(a) * rad;
    if (k === 0) frag.moveTo(x, y);
    else frag.lineTo(x, y);
  }
  const fragGeo = new THREE.ShapeGeometry(frag, 4);
  fragGeo.rotateX(-Math.PI / 2);
  const fragMesh = new THREE.Mesh(fragGeo, std({ map: paperTex(true, 97), roughness: 1, side: THREE.DoubleSide }));
  fragMesh.position.y = 0.045;
  const fragUv = fragGeo.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < fragUv.count; i++) fragUv.setXY(i, fragUv.getX(i) + 0.5, fragUv.getY(i) + 0.5);
  hanG.add(board, fragMesh);
  exhibits.push(hanG);

  // a stack of Cai Lun's paper, the top sheet written on
  const cailunG = new THREE.Group();
  for (let k = 0; k < 5; k++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.006, 0.78), std({ map: paperTex(false, 101 + k), roughness: 0.9 }));
    s.position.set((r() - 0.5) * 0.02, 0.004 + k * 0.007, (r() - 0.5) * 0.02);
    s.rotation.y = (r() - 0.5) * 0.06;
    cailunG.add(s);
  }
  const topGeo = new THREE.PlaneGeometry(0.6, 0.78, 16, 16);
  const tp = topGeo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i);
    const y = tp.getY(i);
    // one corner lifts a little
    const c = Math.max(0, x + y - 0.45);
    tp.setZ(i, c * c * 0.9);
  }
  topGeo.computeVertexNormals();
  const top = new THREE.Mesh(topGeo, std({ map: textTex("倫乃造意用樹膚麻頭及敝布魚網以為紙", { w: 384, h: 512, cols: 5, paper: "#f0e6cc", ink: "#231a10" }), side: THREE.DoubleSide, roughness: 0.9 }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.045;
  cailunG.add(top);
  exhibits.push(cailunG);

  const evoX = [-1.3, -0.44, 0.44, 1.3];
  exhibits.forEach((g, i) => {
    g.position.set(evoX[i]!, 0, 0.45);
    g.rotation.y = (i - 1.5) * -0.12;
    evo.add(shadowy(g));
  });

  // =====================================================================
  // labels
  const L = (id: string, text: string, sub: string | undefined, a: THREE.Object3D, from: number, to: number, side?: "left" | "right", dy?: number): LabelDef => ({ id, text, sub, anchor: a, from, to, side, dy });
  const labels: LabelDef[] = [
    L("bark", "Vỏ cây", undefined, anchor(bark, 0, 0.32, 0), 0.02, P.matsEnd, "left"),
    L("hemp", "Đầu gai", "sợi gai thừa", anchor(hemp, 0, 0.25, 0), 0.04, P.matsEnd, "left"),
    L("rags", "Vải rách", undefined, anchor(rags, 0, 0.15, 0), 0.06, P.matsEnd, "right"),
    L("net", "Lưới đánh cá cũ", undefined, anchor(net, 0, 0.36, 0), 0.08, P.matsEnd, "right"),
    L("mortar", "Cối giã", step("Giã"), anchor(mortar, 0, 0.5, 0), P.pound[0], P.pound[1] + 0.02, "left"),
    L("vat", "Bể bột giấy", step("Hòa bể"), anchor(vat, 0, 0.62, 0), P.vat[0], P.vat[1] + 0.02, "right"),
    L("mould", "Khuôn xeo", step("Xeo giấy"), anchor(mould, 0.3, 0.05, 0), P.dip[0], P.dip[1], "left"),
    L("wall", "Tường phơi", step("Phơi"), wallSpot, P.dry[0] + 0.03, P.dry[1], "right"),
    L("slips", "Thẻ tre", "rẻ nhưng rất nặng, cồng kềnh", anchor(slipsG, 0, 0.12, -0.3), 0.7, 1.01, "left", -80),
    L("silk", "Lụa", "nhẹ, đẹp nhưng quá đắt", anchor(silkG, 0, 0.1, 0.3), 0.75, 1.01, "left", 90),
    L("han", "Giấy thô thời Tây Hán", "thế kỷ II TCN", anchor(hanG, 0, 0.1, -0.2), 0.8, 1.01, "right", -80),
    L("cailun", "Giấy của Thái Luân", "năm 105", anchor(cailunG, 0, 0.1, 0.3), 0.85, 1.01, "right", 90),
  ];

  // =====================================================================
  // animation
  const matHome = new Map<THREE.Object3D, THREE.Vector3>();
  for (const m of [bark, hemp, rags, net]) matHome.set(m, m.position.clone());
  const into = new THREE.Vector3().copy(mortar.position).setY(0.5);
  const mouldUp = new THREE.Vector3(0.05, 1.35, -0.35);
  const mouldIn = new THREE.Vector3(0.05, 0.52, -0.35);
  const wallWorld = new THREE.Vector3();
  const sheetFrom = new THREE.Vector3();
  const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const qWall = new THREE.Quaternion();
  const pulpPos = pulpGeo.getAttribute("position") as THREE.BufferAttribute;
  const pulpBase = Float32Array.from(pulpPos.array as Float32Array);

  const update = (p: number, t: number) => {
    // A → B: materials fly into the mortar
    const fly = span(p, P.matsEnd - 0.02, P.pound[0] + 0.05);
    for (const [m, home] of matHome) {
      m.position.lerpVectors(home, into, fly);
      m.position.y += Math.sin(fly * Math.PI) * 0.8;
      m.scale.setScalar(1 - fly * 0.85);
      m.visible = fly < 0.99;
      if (fly < 0.01) m.rotation.y += 0;
    }
    // process props rise in, and leave for C
    const inB = span(p, P.matsEnd - 0.04, P.pound[0] + 0.02);
    const outB = span(p, P.evo - 0.02, P.evo + 0.05);
    proc.visible = inB > 0.001 && outB < 0.999;
    proc.position.y = (1 - inB) * -1.2 + outB * -1.4;
    proc.scale.setScalar(0.6 + 0.4 * inB - 0.3 * outB);
    // pounding
    const pounding = p > P.pound[0] + 0.02 && p < P.pound[1] + 0.01;
    const hit = pounding ? Math.abs(Math.sin(t * 7)) : 0;
    pestle.position.y = 0.12 + hit * 0.45;
    pulpInMortar.visible = p > P.pound[0] + 0.03;
    pulpInMortar.scale.setScalar(0.4 + 0.6 * span(p, P.pound[0], P.pound[1]));
    // pulp surface ripples while the mould dips
    const dipT = span(p, P.dip[0], (P.dip[0] + P.dip[1]) / 2);
    const liftT = span(p, (P.dip[0] + P.dip[1]) / 2, P.dip[1]);
    const ripple = Math.sin(dipT * Math.PI) * 0.018 + (p > P.vat[0] && p < P.dip[1] ? 0.004 : 0);
    for (let i = 0; i < pulpPos.count; i++) {
      const x = pulpBase[i * 3]!;
      const z = pulpBase[i * 3 + 2]!;
      const d = Math.hypot(x, z);
      pulpPos.setY(i, ripple * Math.sin(d * 18 - t * 4));
    }
    pulpPos.needsUpdate = true;
    pulp.geometry.computeVertexNormals();
    pulp.scale.setScalar(0.3 + 0.7 * span(p, P.vat[0], P.vat[1]));
    // the mould: waits above, dips, lifts out tilted
    mould.visible = p > P.vat[0];
    if (p < P.dip[0]) mould.position.copy(mouldUp);
    else if (dipT < 1) mould.position.lerpVectors(mouldUp, mouldIn, dipT);
    else mould.position.lerpVectors(mouldIn, mouldUp, liftT);
    mould.rotation.x = -0.35 * (1 - dipT) + 0.25 * liftT * (1 - span(p, P.dry[0], P.dry[0] + 0.03));
    // the sheet: on the mould after lifting, then carried to the wall
    const carry = span(p, P.dry[0], P.dry[0] + 0.07);
    sheet.visible = liftT > 0.05;
    (sheet.material as THREE.MeshPhysicalMaterial).opacity = Math.min(1, liftT * 1.5);
    sheetFrom.copy(mould.position).add(new THREE.Vector3(0, 0.03, 0));
    wallSpot.getWorldPosition(wallWorld);
    root.worldToLocal(wallWorld);
    wallWorld.z += 0.01;
    sheet.position.lerpVectors(sheetFrom, wallWorld, carry);
    sheet.position.y += Math.sin(carry * Math.PI) * 0.4;
    qWall.setFromEuler(new THREE.Euler(0, wall.rotation.y, 0));
    sheet.quaternion.slerpQuaternions(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + mould.rotation.x, 0, 0)), qWall, carry);
    sheet.scale.setScalar(1 - carry * 0.3);
    // drying: from grey-wet to warm paper
    const dry = span(p, P.dry[0] + 0.07, P.dry[1]);
    (sheet.material as THREE.MeshPhysicalMaterial).color.set("#d8cfb8").lerp(new THREE.Color("#fff7e6"), dry);
    (sheet.material as THREE.MeshPhysicalMaterial).clearcoat = 0.5 * (1 - dry);
    // C: exhibits rise one by one and turn slowly
    exhibits.forEach((g, i) => {
      const k = span(p, P.evo + 0.02 + i * 0.05, P.evo + 0.08 + i * 0.05);
      g.visible = k > 0.001;
      g.position.y = (1 - k) * -0.8;
      g.scale.setScalar((0.5 + 0.5 * k) * 0.82);
    });
    void qFlat;
  };

  return {
    labels,
    phases: [
      { from: 0, to: P.matsEnd, title: "Nguyên liệu", text: step("Chọn nguyên liệu") },
      { from: P.pound[0], to: P.pound[1], title: "Ngâm, nấu, giã", text: `${step("Ngâm")} ${step("Nấu")} ${step("Giã")}` },
      { from: P.vat[0], to: P.vat[1], title: "Hòa bể", text: step("Hòa bể") },
      { from: P.dip[0], to: P.dip[1], title: "Xeo giấy", text: step("Xeo giấy") },
      { from: P.dry[0], to: P.dry[1], title: "Ép và phơi", text: `${step("Ép")} ${step("Phơi")}` },
      { from: P.evo, to: 1.01, title: "Từ thẻ tre đến giấy", text: ch.why[2] ?? "" },
    ],
    update,
    frame(p) {
      if (p < P.matsEnd) return { target: new THREE.Vector3(0, 0.15, 0.35), distance: 6.9, height: 3.3 };
      if (p < P.evo) return { target: new THREE.Vector3(0, 0.6, -0.45), distance: 7.4, height: 3.9 };
      return { target: new THREE.Vector3(0, 0.15, 0.4), distance: 6.2, height: 2.9 };
    },
  };
}
