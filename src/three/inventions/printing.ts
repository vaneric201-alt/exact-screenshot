import * as THREE from "three";
import type { ChapterData } from "../../content/content";
import { span, rng, type LabelDef, type Stage } from "../stage/stage";
import { canvasTex, paperTex, pbr, stoneTex, textTex, woodTex } from "../stage/textures";
import type { InventionScene } from "./types";

/*
 * Printing, on the plinth:
 *  A · woodblock: characters carved in reverse stand in relief; ink is
 *      brushed on, paper is laid on and rubbed, the sheet lifts and turns
 *      over to show the page the right way round
 *  B · Bi Sheng's movable type: fired clay sorts fly one by one into an iron
 *      frame on a tray, the tray is warmed and a board presses the faces flat
 *  C · evolution: seal → woodblock → Diamond Sutra (868) → clay type →
 *      Wang Zhen's revolving type table (1313) → bronze type (Ming)
 */

const P = {
  carve: [0.02, 0.1] as const,
  ink: [0.1, 0.18] as const,
  press: [0.18, 0.27] as const,
  peel: [0.27, 0.34] as const,
  typeIn: 0.36,
  typeSet: [0.4, 0.56] as const,
  fix: [0.56, 0.64] as const,
  evo: 0.66,
};

const SUTRA = "如是我聞一時佛在舍衛國祇樹給孤獨園與大比丘眾千二百五十人俱";
const BISHENG = "慶曆中有布衣畢昇又為活板其法用膠泥刻字薄如錢唇每字為一印火燒令堅";

export function create(stage: Stage, ch: ChapterData): InventionScene {
  const root = new THREE.Group();
  stage.turntable.add(root);
  const r = rng(868);
  const parts = ch.process.parts;
  const stepOf = (name: string) => parts.flatMap((p) => p.steps).find((s) => s.name === name)?.desc ?? "";
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

  // character layouts for the block: relief height and colour, mirrored as carved
  const blockChars = (mirror: boolean, kind: "height" | "color" | "ink") =>
    canvasTex(
      1024,
      700,
      (ctx, w, h, rr) => {
        ctx.fillStyle = kind === "height" ? "#000" : kind === "ink" ? "rgba(0,0,0,0)" : "#5a3a1f";
        if (kind === "ink") ctx.clearRect(0, 0, w, h);
        else ctx.fillRect(0, 0, w, h);
        if (kind === "color") {
          // carving marks in the cut-away ground
          for (let k = 0; k < 500; k++) {
            ctx.strokeStyle = `rgba(30,15,5,${0.1 + rr() * 0.2})`;
            ctx.lineWidth = 1 + rr() * 2;
            const x = rr() * w;
            const y = rr() * h;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (rr() - 0.5) * 18, y + (rr() - 0.5) * 18);
            ctx.stroke();
          }
        }
        ctx.save();
        if (mirror) {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }
        ctx.fillStyle = kind === "height" ? "#fff" : kind === "ink" ? "#14110e" : "#c29460";
        if (kind === "height") ctx.filter = "blur(2px)";
        ctx.font = `900 92px "Noto Serif TC", "Songti TC", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const cols = 8;
        const per = 6;
        [...SUTRA].slice(0, cols * per).forEach((c, i) => {
          const col = Math.floor(i / per);
          const row = i % per;
          ctx.fillText(c, w - 70 - col * 118, 40 + row * 104);
        });
        // a border line, as on real blocks
        ctx.strokeStyle = ctx.fillStyle as string;
        ctx.lineWidth = 10;
        ctx.strokeRect(18, 18, w - 36, h - 36);
        ctx.restore();
      },
      7,
      kind === "color",
    );

  // =====================================================================
  // A · woodblock
  const blockG = new THREE.Group();
  root.add(blockG);
  const BW = 1.5;
  const BD = 1.02;
  const woodBody = std({ map: woodTex("#7b5130", 5), roughness: 0.7 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(BW, 0.14, BD), woodBody);
  slab.position.y = 0.07;
  blockG.add(slab);
  const faceGeo = new THREE.PlaneGeometry(BW - 0.04, BD - 0.04, 360, 245);
  faceGeo.rotateX(-Math.PI / 2);
  const face = new THREE.Mesh(
    faceGeo,
    std({ map: blockChars(true, "color"), displacementMap: blockChars(true, "height"), displacementScale: 0.028, roughness: 0.65 }),
  );
  face.position.y = 0.141;
  blockG.add(face);
  const inkLayer = new THREE.Mesh(
    faceGeo,
    new THREE.MeshStandardMaterial({ map: blockChars(true, "ink"), displacementMap: blockChars(true, "height"), displacementScale: 0.028, transparent: true, opacity: 0, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, depthWrite: false }),
  );
  inkLayer.position.y = 0.1415;
  inkLayer.renderOrder = 2;
  blockG.add(inkLayer);
  blockG.position.set(0, 0, 0.1);
  shadowy(blockG);

  // ink brush
  const brush = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.8, 16), std({ map: woodTex("#3b2414", 11), roughness: 0.4 }));
  handle.position.y = 0.5;
  const bristle = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 20), std({ color: "#15110d", roughness: 0.9 }));
  bristle.rotation.x = Math.PI;
  bristle.position.y = 0.08;
  brush.add(handle, bristle);
  brush.rotation.z = 0.5;
  root.add(shadowy(brush));

  // the sheet of paper: laid on the block, then turned over on a hinge at the
  // block's right edge like a page, to show the printed side
  const SW = BW - 0.08;
  const sheetPivot = new THREE.Group();
  sheetPivot.position.set(BW / 2 - 0.04, 0, 0.1);
  root.add(sheetPivot);
  const sheetG = new THREE.Group();
  sheetG.position.set(-SW / 2, 0, 0);
  sheetG.rotation.x = -Math.PI / 2;
  sheetPivot.add(sheetG);
  const sheetGeo = new THREE.PlaneGeometry(SW, BD - 0.08);
  const plain = new THREE.Mesh(sheetGeo, std({ map: paperTex(false, 17), roughness: 0.9 }));
  // the underside (printed) is a second face turned the other way
  const under = new THREE.Group();
  under.rotation.y = Math.PI;
  under.position.z = -0.002;
  const underPaper = new THREE.Mesh(sheetGeo, std({ map: paperTex(false, 19), roughness: 0.9 }));
  const printLayer = new THREE.Mesh(sheetGeo, new THREE.MeshStandardMaterial({ map: blockChars(false, "ink"), transparent: true, roughness: 0.8, opacity: 0 }));
  printLayer.position.z = 0.001;
  under.add(underPaper, printLayer);
  sheetG.add(plain, under);
  shadowy(sheetPivot);

  // rubbing pad (a flat palm-fibre brush)
  const pad = new THREE.Group();
  const padBody = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.16), std({ color: "#6d4a2a" }));
  const padBristle = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.14), std({ color: "#3a2a1a", roughness: 1 }));
  padBristle.position.y = -0.06;
  pad.add(padBody, padBristle);
  root.add(shadowy(pad));

  // =====================================================================
  // B · movable type
  const typeG = new THREE.Group();
  root.add(typeG);
  const iron = std({ color: "#3c3a38", metalness: 0.7, roughness: 0.45 });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 0.95), iron);
  tray.position.y = 0.04;
  const waxMat = std({ color: "#5b4a33", roughness: 0.6 });
  const wax = new THREE.Mesh(new THREE.BoxGeometry(1.29, 0.02, 0.89), waxMat);
  wax.position.y = 0.09;
  typeG.add(tray, wax);
  const frameBars = [
    [1.2, 0.05, 0.03, 0, -0.41],
    [1.2, 0.05, 0.03, 0, 0.41],
    [0.03, 0.05, 0.85, -0.6, 0],
    [0.03, 0.05, 0.85, 0.6, 0],
  ] as const;
  const frame = new THREE.Group();
  for (const [w, h, d, x, z] of frameBars) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h + 0.1, d), iron);
    b.position.set(x, 0.14, z);
    frame.add(b);
  }
  typeG.add(frame);
  // glow of the fire under the tray while the wax softens
  const glow = new THREE.PointLight("#ff8a3a", 0, 2.5, 2);
  glow.position.set(0, -0.05, 0);
  typeG.add(glow);

  // clay sorts: one character each, reversed, on the top face
  const COLS = 8;
  const ROWS = 5;
  const atlas = canvasTex(
    1024,
    1024,
    (ctx) => {
      ctx.fillStyle = "#b8774a";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.save();
      ctx.translate(1024, 0);
      ctx.scale(-1, 1);
      ctx.fillStyle = "#6e3f22";
      ctx.font = `900 96px "Noto Serif TC", "Songti TC", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      [...BISHENG].slice(0, 64).forEach((c, i) => {
        const cx = (i % 8) * 128 + 64;
        const cy = Math.floor(i / 8) * 128 + 66;
        ctx.fillText(c, 1024 - cx, cy);
      });
      ctx.restore();
    },
    23,
  );
  const clay = std({ color: "#a86a40", roughness: 0.9 });
  const atlasMat = std({ map: atlas, roughness: 0.7 });
  const sorts: { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; delay: number }[] = [];
  const cell = 0.135;
  for (let k = 0; k < COLS * ROWS; k++) {
    const g = new THREE.BoxGeometry(0.12, 0.1, 0.12);
    // top face (+y) shows atlas cell k
    const uv = g.getAttribute("uv") as THREE.BufferAttribute;
    const cx = (k % 8) / 8;
    const cy = 1 - (Math.floor(k / 8) + 1) / 8;
    for (let i = 8; i < 12; i++) uv.setXY(i, cx + uv.getX(i) / 8, cy + uv.getY(i) / 8);
    const m = new THREE.Mesh(g, [clay, clay, atlasMat, clay, clay, clay]);
    const col = k % COLS;
    const row = Math.floor(k / COLS);
    const to = new THREE.Vector3((col - (COLS - 1) / 2) * cell, 0.16, (row - (ROWS - 1) / 2) * cell);
    // the sorts wait in a heap on a tray in front
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 0.45;
    const from = new THREE.Vector3(1.55 + Math.cos(a) * rad, 0.05 + r() * 0.08, 0.6 + Math.sin(a) * rad * 0.7);
    m.position.copy(from);
    m.rotation.y = r() * 3;
    typeG.add(m);
    sorts.push({ mesh: m, from, to, delay: k / (COLS * ROWS) });
  }
  // the board pressed on the faces
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.9), std({ map: woodTex("#8a5a32", 29) }));
  typeG.add(board);
  typeG.position.set(-0.3, 0, 0);
  shadowy(typeG);

  // =====================================================================
  // C · evolution
  const evo = new THREE.Group();
  root.add(evo);
  const ex: THREE.Group[] = [];

  // seal: a stone square with its red impression beside it
  const sealG = new THREE.Group();
  const sealStone = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.2), std({ map: stoneTex("#9a8c72", 31), roughness: 0.5 }));
  sealStone.position.y = 0.17;
  const knobS = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), std({ map: stoneTex("#9a8c72", 33), roughness: 0.5 }));
  knobS.position.y = 0.38;
  const imprint = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), std({ map: textTex("印", { w: 128, h: 128, cols: 1, paper: "#b23a2b", ink: "#f3e9d2", size: 104 }) }));
  imprint.rotation.x = -Math.PI / 2;
  imprint.position.set(0.22, 0.004, 0.08);
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), std({ map: paperTex(false, 35) }));
  note.rotation.x = -Math.PI / 2;
  note.position.set(0.16, 0.002, 0.06);
  sealG.add(sealStone, knobS, note, imprint);
  ex.push(sealG);

  // small woodblock
  const miniBlock = blockG.clone(true);
  miniBlock.scale.setScalar(0.32);
  miniBlock.position.set(0, 0, 0);
  const miniG = new THREE.Group();
  miniG.add(miniBlock);
  ex.push(miniG);

  // the Diamond Sutra of 868, from the real scroll in the British Library
  const sutraG = new THREE.Group();
  const sutraTex = new THREE.TextureLoader().load("/img/print-wood-6.webp");
  sutraTex.colorSpace = THREE.SRGBColorSpace;
  const sutraGeo = new THREE.PlaneGeometry(0.9, 0.5, 30, 1);
  const sg = sutraGeo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < sg.count; i++) sg.setZ(i, 0.02 * Math.sin(sg.getX(i) * 9));
  sutraGeo.computeVertexNormals();
  const sutra = new THREE.Mesh(sutraGeo, std({ map: sutraTex, roughness: 0.85, side: THREE.DoubleSide }));
  sutra.rotation.x = -Math.PI / 2;
  sutra.position.y = 0.04;
  const sutraRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.52, 20), std({ map: paperTex(false, 37) }));
  sutraRoll.rotation.x = Math.PI / 2;
  sutraRoll.position.set(0.5, 0.06, 0);
  sutraG.add(sutra, sutraRoll);
  ex.push(sutraG);

  // a few clay sorts
  const claySortsG = new THREE.Group();
  for (let k = 0; k < 6; k++) {
    const s = sorts[k]!.mesh.clone();
    s.position.set((k % 3) * 0.14 - 0.14, 0.05, Math.floor(k / 3) * 0.14 - 0.07);
    s.rotation.set(0, 0, 0);
    claySortsG.add(s);
  }
  ex.push(claySortsG);

  // Wang Zhen's revolving type table
  const wheelG = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 48), std({ map: woodTex("#8a5a32", 41) }));
  top.position.y = 0.3;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.3, 12), std({ color: "#5a3a20" }));
  post.position.y = 0.15;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.03, 24), std({ color: "#5a3a20" }));
  wheelG.add(top, post, foot);
  const wheel = new THREE.Group();
  wheel.position.y = 0.33;
  wheelG.add(wheel);
  const woodType = std({ color: "#c79a62", roughness: 0.8 });
  for (let ring = 0; ring < 3; ring++) {
    const n = 10 + ring * 8;
    const rad = 0.14 + ring * 0.1;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.035), woodType);
      b.position.set(Math.cos(a) * rad, 0.015, Math.sin(a) * rad);
      b.rotation.y = -a;
      wheel.add(b);
    }
  }
  ex.push(wheelG);

  // bronze type
  const bronzeG = new THREE.Group();
  const bronze = std({ color: "#8a6433", metalness: 0.9, roughness: 0.35 });
  const bronzeTop = std({ map: atlas, color: "#c9a26a", metalness: 0.8, roughness: 0.35 });
  for (let k = 0; k < 6; k++) {
    const src = sorts[10 + k]!.mesh.geometry.clone();
    const b = new THREE.Mesh(src, [bronze, bronze, bronzeTop, bronze, bronze, bronze]);
    b.position.set((k % 3) * 0.14 - 0.14, 0.05, Math.floor(k / 3) * 0.14 - 0.07);
    bronzeG.add(b);
  }
  ex.push(bronzeG);

  // a gentle arc facing the reader
  ex.forEach((g, i) => {
    const a = ((i - 2.5) / 2.5) * 1.05;
    g.position.set(Math.sin(a) * 1.75, 0, 0.9 - Math.cos(a) * 1.3);
    g.rotation.y = -a * 0.6;
    evo.add(shadowy(g));
  });

  // =====================================================================
  // labels
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
  // the evolution is told one object at a time
  const E0 = P.evo + 0.03;
  const ES = (1 - E0) / 6;
  const ew = (i: number): [number, number] => [E0 + i * ES, i === 5 ? 1.01 : E0 + (i + 1) * ES];
  const labels: LabelDef[] = [
    L("block", "Ván gỗ, chữ khắc ngược", stepOf("Khắc"), anchor(blockG, -0.5, 0.17, -0.3), P.carve[0], P.ink[1], "left"),
    L("brush", "Bôi mực", stepOf("Bôi mực"), anchor(brush, 0, 0.9, 0), P.ink[0] + 0.01, P.ink[1], "right"),
    L("pad", "Ép giấy", stepOf("Ép giấy"), anchor(pad, 0, 0.06, 0), P.press[0] + 0.02, P.press[1], "right"),
    L("page", "Trang in", "chữ hiện đúng chiều", anchor(under, 0, 0, 0), P.peel[0] + 0.04, P.peel[1] + 0.02, "right"),
    L("sorts", "Con chữ đất sét nung", stepOf("Khắc chữ"), anchor(typeG, 1.55, 0.2, 0.6), P.typeIn + 0.01, P.typeSet[0] + 0.06, "right"),
    L("frame", "Khung sắt", stepOf("Xếp chữ"), anchor(frame, -0.6, 0.2, -0.41), P.typeSet[0] + 0.04, P.fix[0], "left"),
    L("tray", "Khay sắt", stepOf("Chuẩn bị khay"), anchor(tray, 0.68, 0.02, 0.3), P.typeSet[0] + 0.08, P.fix[0], "right", 40),
    L("fix", "Hơ nóng và ép phẳng", stepOf("Cố định"), anchor(board, 0, 0.05, 0), P.fix[0] + 0.01, P.fix[1], "right"),
    L("e-seal", "Con dấu", "khắc ngược, bôi mực, ấn xuống", anchor(sealG, 0, 0.42, 0), ew(0)[0], ew(0)[1], "left"),
    L("e-block", "In khắc gỗ", "khoảng thế kỷ VII–VIII", anchor(miniG, 0, 0.1, 0), ew(1)[0], ew(1)[1], "left"),
    L("e-sutra", "Kinh Kim Cương", "868 · bản in có ghi năm sớm nhất còn lại", anchor(sutraG, 0, 0.08, -0.2), ew(2)[0], ew(2)[1], "left"),
    L("e-clay", "Chữ rời đất sét · Tất Thăng", "1041–1048", anchor(claySortsG, 0, 0.12, -0.1), ew(3)[0], ew(3)[1], "right"),
    L("e-wheel", "Bàn xoay chữ gỗ · Vương Trinh", "1313", anchor(wheelG, 0, 0.35, 0), ew(4)[0], ew(4)[1], "right"),
    L("e-bronze", "Chữ đồng", "thời Minh", anchor(bronzeG, 0, 0.12, 0), ew(5)[0], ew(5)[1], "right"),
  ];

  // =====================================================================
  // animation
  const brushFrom = new THREE.Vector3(-0.9, 0.2, 0.1);
  const padLift = new THREE.Vector3(0.9, 0.9, 0.9);
  const update = (p: number, t: number) => {
    // A
    const outA = span(p, P.peel[1], P.typeIn);
    blockG.visible = outA < 0.99;
    blockG.position.y = -outA * 0.6;
    blockG.scale.setScalar(1 - outA * 0.4);
    // brush sweeps across the relief, inking the character tops
    const inkT = span(p, P.ink[0], P.ink[1]);
    brush.visible = p > P.ink[0] - 0.02 && p < P.ink[1] + 0.02;
    brush.position.set(brushFrom.x + inkT * 1.6, 0.2 + 0.03 * Math.sin(t * 9), brushFrom.z + 0.25 * Math.sin(inkT * Math.PI * 5));
    (inkLayer.material as THREE.MeshStandardMaterial).opacity = inkT;
    // paper comes down, is rubbed, then turns over like a page
    const down = span(p, P.press[0], P.press[0] + 0.03);
    const peel = span(p, P.peel[0], P.peel[1]);
    sheetPivot.visible = p > P.press[0] - 0.01 && outA < 0.99;
    sheetPivot.position.y = 0.182 + (1 - down) * 0.8 + Math.sin(peel * Math.PI) * 0.15 - outA * 0.6;
    sheetPivot.rotation.z = -peel * Math.PI * 0.8;
    (printLayer.material as THREE.MeshStandardMaterial).opacity = span(p, P.press[0] + 0.03, P.press[1]);
    const rub = span(p, P.press[0] + 0.03, P.press[1]);
    pad.visible = rub > 0 && rub < 1;
    pad.position.set(-0.55 + rub * 1.1, 0.22 + Math.abs(Math.sin(t * 6)) * 0.02, 0.1 + 0.3 * Math.sin(rub * Math.PI * 6));
    if (!pad.visible) pad.position.copy(padLift);
    // B
    const inB = span(p, P.typeIn - 0.02, P.typeIn + 0.04);
    const outB = span(p, P.evo - 0.02, P.evo + 0.04);
    typeG.visible = inB > 0.001 && outB < 0.999;
    typeG.position.y = (1 - inB) * -1 - outB * 1.2;
    const setT = span(p, P.typeSet[0], P.typeSet[1]);
    for (const s of sorts) {
      const k = Math.min(1, Math.max(0, (setT - s.delay * 0.85) / 0.15));
      s.mesh.position.lerpVectors(s.from, s.to, k);
      s.mesh.position.y += Math.sin(k * Math.PI) * 0.45;
      s.mesh.rotation.y = (1 - k) * 2.3;
    }
    const heat = span(p, P.fix[0], P.fix[0] + 0.03) * (1 - span(p, P.fix[1] - 0.02, P.fix[1]));
    glow.intensity = heat * 6;
    waxMat.emissive.set("#ff6a1a");
    waxMat.emissiveIntensity = heat * 0.35;
    const press = span(p, P.fix[0] + 0.03, P.fix[1] - 0.01);
    board.visible = press > 0.001;
    board.position.set(0, 0.24 + (1 - press) * 0.6, 0);
    // C: all objects come up, then each in turn is lifted into the light
    const active = Math.min(5, Math.max(0, Math.floor((p - E0) / ES)));
    ex.forEach((g, i) => {
      const k = span(p, P.evo + 0.01 + i * 0.004, P.evo + 0.04 + i * 0.004);
      const on = p >= E0 && i === active ? 1 : 0;
      g.userData["on"] = (g.userData["on"] ?? 0) + (on - (g.userData["on"] ?? 0)) * 0.12;
      const lift = g.userData["on"] as number;
      g.visible = k > 0.001;
      g.scale.setScalar((0.4 + 0.6 * k) * (1 + lift * 0.35));
      g.position.y = (1 - k) * -0.6 + lift * 0.12;
    });
    wheel.rotation.y = t * 0.3;
  };

  return {
    labels,
    phases: [
      { from: 0, to: P.peel[1], title: "In khắc gỗ", text: parts[0]!.steps.map((s) => s.name).join(" → ") + "." },
      { from: P.typeIn, to: P.fix[1], title: "Chữ rời của Tất Thăng", text: stepOf("Tháo & dùng lại") },
      { from: P.evo, to: 1.01, title: "Từ con dấu đến chữ đồng", text: ch.origin[0] ?? "" },
    ],
    update,
    frame(p) {
      if (p < P.typeIn) return { target: new THREE.Vector3(0.2, 0.2, 0.1), distance: 4.3, height: 2.7 };
      if (p < P.evo) return { target: new THREE.Vector3(0.2, 0.2, 0.2), distance: 5.4, height: 3.4 };
      if (p < E0) return { target: new THREE.Vector3(0, 0.2, 0.2), distance: 6.2, height: 3.1 };
      const g = ex[Math.min(5, Math.max(0, Math.floor((p - E0) / ES)))]!;
      return { target: new THREE.Vector3(g.position.x * 0.8, 0.25, g.position.z), distance: 3.9, height: 2.1 };
    },
  };
}
