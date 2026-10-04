import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { canvasTex, metalTex, mottle, paperTex, pbr } from "../stage/textures";

/*
 * The modern descendants of the four inventions, for the finale:
 *  paper    → a tablet showing an online document library
 *  printing → an FDM 3D printer printing a pagoda layer by layer, and a CNC
 *             mill cutting a character into an aluminium block
 *  compass  → a phone with a map, a moving location dot and a compass, under
 *             a ring of navigation satellites around a small Earth
 * Each builder returns the object plus an update(k, t) for its animation,
 * where k (0–1) is how far its segment has played.
 */

export interface Modern {
  object: THREE.Group;
  update(k: number, t: number, dt: number): void;
}

const shadow = <T extends THREE.Object3D>(o: T) => {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return o;
};

const alu = () => new THREE.MeshPhysicalMaterial({ map: metalTex("#b9bcc0", "#9aa0a6", 801), color: "#d9dcdf", metalness: 1, roughness: 0.32, clearcoat: 0.2 });
const glass = (map: THREE.Texture) =>
  new THREE.MeshPhysicalMaterial({ map, emissiveMap: map, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.9, roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03 });

// =====================================================================
// paper → tablet with a document library

function libraryScreen() {
  return canvasTex(
    1600,
    1100,
    (ctx, w, h) => {
      ctx.fillStyle = "#f6f3ec";
      ctx.fillRect(0, 0, w, h);
      // top bar
      ctx.fillStyle = "#8e2a22";
      ctx.fillRect(0, 0, w, 110);
      ctx.fillStyle = "#fff";
      ctx.font = '700 52px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.textBaseline = "middle";
      ctx.fillText("Thư viện số", 60, 56);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.roundRect(560, 28, 760, 56, 28);
      ctx.fill();
      ctx.fillStyle = "#777";
      ctx.font = '400 30px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.fillText("🔍  Tìm sách, tài liệu, giáo trình…", 590, 57);
      // side list
      ctx.fillStyle = "#ece6d8";
      ctx.fillRect(0, 110, 300, h - 110);
      ctx.fillStyle = "#3a3026";
      ctx.font = '600 30px "Be Vietnam Pro", system-ui, sans-serif';
      ["Tất cả", "Sách giáo khoa", "Lịch sử", "Khoa học", "Tạp chí", "Đã lưu"].forEach((t, i) => {
        if (i === 2) {
          ctx.fillStyle = "#d9c9a6";
          ctx.fillRect(16, 150 + i * 80 - 32, 268, 64);
          ctx.fillStyle = "#3a3026";
        }
        ctx.fillText(t, 44, 150 + i * 80);
      });
      // grid of documents
      const docs = [
        ["Lịch sử 10", "#b23a2b"],
        ["Sử kí", "#2f5d50"],
        ["Mộng Khê bút đàm", "#6b4a2a"],
        ["Thiên công khai vật", "#3c4f7a"],
        ["Kinh Kim Cương", "#7a5a1e"],
        ["Science and Civilisation in China", "#1f3a5a"],
        ["Paper and Printing", "#5a2e4a"],
        ["Vũ kinh tổng yếu", "#4a5a2e"],
      ];
      docs.forEach(([t, c], i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 350 + col * 305;
        const y = 160 + row * 460;
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(x + 8, y + 10, 250, 330);
        ctx.fillStyle = c!;
        ctx.fillRect(x, y, 250, 330);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(x, y, 22, 330);
        ctx.fillStyle = "#f6efe0";
        ctx.font = '700 30px "Noto Serif", Georgia, serif';
        const words = t!.split(" ");
        let line = "";
        let ly = y + 60;
        for (const wd of words) {
          if (ctx.measureText(line + wd).width > 200) {
            ctx.fillText(line, x + 36, ly);
            line = "";
            ly += 40;
          }
          line += wd + " ";
        }
        ctx.fillText(line, x + 36, ly);
        ctx.fillStyle = "#3a3026";
        ctx.font = '500 26px "Be Vietnam Pro", system-ui, sans-serif';
        ctx.fillText(i % 3 === 0 ? "PDF · Đọc ngay" : "EPUB · Tải về", x, y + 372);
        ctx.fillStyle = "#8e2a22";
        ctx.fillRect(x, y + 396, 70 + ((i * 37) % 160), 6);
      });
    },
    811,
  );
}

export function buildTablet(): Modern {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.92, 1.36, 0.07, 6, 0.07), alu());
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.78, 1.22), glass(libraryScreen()));
  screen.position.z = 0.036;
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 1.3), new THREE.MeshPhysicalMaterial({ color: "#0a0a0c", roughness: 0.1, clearcoat: 1 }));
  bezel.position.z = 0.0355;
  const cam = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16), new THREE.MeshBasicMaterial({ color: "#1c2733" }));
  cam.position.set(0, 0.635, 0.0365);
  g.add(body, bezel, screen, cam);
  // a slim stand
  const standMat = alu();
  const leg = new THREE.Mesh(new RoundedBoxGeometry(0.5, 1.1, 0.03, 4, 0.015), standMat);
  leg.position.set(0, -0.2, -0.32);
  leg.rotation.x = -0.35;
  const foot = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.03, 0.5, 4, 0.012), standMat);
  foot.position.set(0, -0.72, -0.18);
  const tablet = new THREE.Group();
  tablet.add(g);
  tablet.rotation.x = -0.28;
  const root = new THREE.Group();
  root.add(tablet, leg, foot);
  // sheets of paper that fly into the screen and become its documents
  const sheets: THREE.Mesh[] = [];
  const sheetMat = pbr({ map: paperTex(false, 815), roughness: 0.9, side: THREE.DoubleSide, transparent: true });
  for (let k = 0; k < 8; k++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.48, 6, 6), sheetMat.clone());
    sheets.push(s);
    root.add(s);
  }
  const start = sheets.map((_, k) => new THREE.Vector3(-2.6 - (k % 3) * 0.4, -0.4 + (k % 4) * 0.35, 0.6 - (k % 2) * 0.5));
  const target = new THREE.Vector3(0, 0, 0.1);
  return {
    object: shadow(root),
    update(k, t) {
      sheets.forEach((s, i) => {
        const a = Math.min(1, Math.max(0, (k - 0.12 - i * 0.06) / 0.35));
        const e = a * a * (3 - 2 * a);
        s.position.lerpVectors(start[i]!, target, e);
        s.position.y += Math.sin(e * Math.PI) * 0.5 + Math.sin(t * 1.3 + i) * 0.03 * (1 - e);
        s.rotation.set(Math.sin(t + i) * 0.3 * (1 - e) - 0.28 * e, (1 - e) * (0.8 + i * 0.2), Math.sin(t * 0.7 + i) * 0.2 * (1 - e));
        s.scale.setScalar(1 - e * 0.85);
        (s.material as THREE.MeshStandardMaterial).opacity = 1 - Math.max(0, (e - 0.85) / 0.15);
        s.visible = e < 0.999;
      });
      tablet.position.y = Math.sin(t * 0.8) * 0.02;
    },
  };
}

// =====================================================================
// printing → 3D printer and CNC mill

/** A small pagoda for the printer to build, in red PLA with visible layer lines. */
function pagodaGeometry() {
  const prof: THREE.Vector2[] = [];
  const tiers = 5;
  let y = 0;
  prof.push(new THREE.Vector2(0, 0));
  for (let i = 0; i < tiers; i++) {
    const r = 0.26 - i * 0.04;
    prof.push(new THREE.Vector2(r * 0.72, y), new THREE.Vector2(r * 0.72, y + 0.07), new THREE.Vector2(r * 1.25, y + 0.075), new THREE.Vector2(r * 0.7, y + 0.11));
    y += 0.11;
  }
  prof.push(new THREE.Vector2(0.025, y), new THREE.Vector2(0.012, y + 0.12), new THREE.Vector2(0, y + 0.12));
  const g = new THREE.LatheGeometry(prof, 8);
  return { g, height: y + 0.12 };
}

export function buildPrinterAndMill(): Modern {
  const root = new THREE.Group();

  // ---------- printer
  const printer = new THREE.Group();
  const frameMat = new THREE.MeshPhysicalMaterial({ color: "#2a2c30", metalness: 0.7, roughness: 0.38 });
  const ext = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    m.position.set(x, y, z);
    printer.add(m);
    return m;
  };
  const S = 1.0;
  for (const [x, z] of [
    [-S / 2, -S / 2],
    [S / 2, -S / 2],
    [-S / 2, S / 2],
    [S / 2, S / 2],
  ] as const)
    ext(0.05, 1.3, 0.05, x, 0.65, z);
  for (const y of [0.03, 1.28]) {
    ext(S + 0.05, 0.05, 0.05, 0, y, -S / 2);
    ext(S + 0.05, 0.05, 0.05, 0, y, S / 2);
    ext(0.05, 0.05, S + 0.05, -S / 2, y, 0);
    ext(0.05, 0.05, S + 0.05, S / 2, y, 0);
  }
  // bed: black textured glass with a grid
  const bedTex = canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#16171a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    for (let x = 0; x <= w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, x);
      ctx.lineTo(w, x);
      ctx.stroke();
    }
  });
  const bed = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.025, 0.86), [frameMat, frameMat, new THREE.MeshPhysicalMaterial({ map: bedTex, roughness: 0.25, clearcoat: 0.8 }), frameMat, frameMat, frameMat]);
  bed.position.y = 0.2;
  printer.add(bed);
  // the print, revealed from the bottom by a clipping plane
  const { g: pg, height: PH } = pagodaGeometry();
  const layerTex = canvasTex(64, 512, (ctx, w, h) => {
    ctx.fillStyle = "#c8322a";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.fillRect(0, y, w, 1);
    }
  }, 821, true, { normal: 3 });
  layerTex.repeat.set(1, 1);
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.2);
  const printMat = pbr({ map: layerTex, roughness: 0.45, clippingPlanes: [clip], relief: 1 });
  const print = new THREE.Mesh(pg, printMat);
  print.scale.setScalar(1.15);
  print.position.y = 0.2125;
  printer.add(print);
  // gantry: X bar on two Z rods, carriage with hot end and fan
  const gantry = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(S, 0.045, 0.06), frameMat);
  gantry.add(bar);
  const carriage = new THREE.Group();
  const block = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.16, 0.12, 3, 0.02), new THREE.MeshPhysicalMaterial({ color: "#e8e8e6", roughness: 0.5 }));
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 24), new THREE.MeshStandardMaterial({ color: "#222" }));
  fan.rotation.x = Math.PI / 2;
  fan.position.z = 0.07;
  const heat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.06), alu());
  heat.position.y = -0.1;
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 12), new THREE.MeshStandardMaterial({ color: "#c9a24a", metalness: 1, roughness: 0.3 }));
  nozzle.rotation.x = Math.PI;
  nozzle.position.y = -0.145;
  const glow = new THREE.PointLight("#ff5a30", 0.6, 0.4, 2);
  glow.position.y = -0.16;
  carriage.add(block, fan, heat, nozzle, glow);
  carriage.position.z = 0.06;
  gantry.add(carriage);
  printer.add(gantry);
  // spool of red filament on top, with the strand feeding down
  const spool = new THREE.Group();
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 40), new THREE.MeshStandardMaterial({ color: "#1d1d1f" }));
  const wound = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 40), new THREE.MeshStandardMaterial({ color: "#c8322a", roughness: 0.4 }));
  const f2 = flange.clone();
  flange.position.y = 0.045;
  f2.position.y = -0.045;
  spool.add(flange, wound, f2);
  spool.rotation.x = Math.PI / 2;
  spool.position.set(0.25, 1.48, -0.2);
  printer.add(spool);
  printer.position.set(-0.75, -0.6, 0);
  root.add(printer);

  // ---------- CNC mill: base, column, spindle, aluminium stock with a cut
  const mill = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: "#d9d6cf", roughness: 0.45, clearcoat: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: "#2a2c30", roughness: 0.5, metalness: 0.4 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.18, 0.7, 4, 0.03), paint);
  base.position.y = 0.09;
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.5), dark);
  table.position.y = 0.205;
  const column = new THREE.Mesh(new RoundedBoxGeometry(0.22, 1.0, 0.24, 4, 0.03), paint);
  column.position.set(0, 0.68, -0.3);
  const head = new THREE.Group();
  const housing = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.32, 0.26, 4, 0.03), paint);
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 24), dark);
  motor.position.y = 0.24;
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.12, 24), alu());
  spindle.position.y = -0.21;
  const bit = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 12), new THREE.MeshStandardMaterial({ color: "#c9a24a", metalness: 1, roughness: 0.25 }));
  bit.position.y = -0.31;
  head.add(housing, motor, spindle, bit);
  head.position.set(0, 0.72, 0);
  // the stock: an aluminium block whose top shows the cut so far
  const cutCanvas = document.createElement("canvas");
  cutCanvas.width = cutCanvas.height = 512;
  const cctx = cutCanvas.getContext("2d")!;
  const cutTex = new THREE.CanvasTexture(cutCanvas);
  cutTex.colorSpace = THREE.SRGBColorSpace;
  const paintStock = () => {
    cctx.fillStyle = "#b8bcc2";
    cctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 3) {
      cctx.fillStyle = `rgba(255,255,255,${0.05 + ((y * 7) % 11) / 110})`;
      cctx.fillRect(0, y, 512, 1);
    }
  };
  paintStock();
  // the toolpath: the outline of 印, sampled from the glyph's pixels
  const path: [number, number][] = [];
  {
    const m = document.createElement("canvas");
    m.width = m.height = 128;
    const mc = m.getContext("2d")!;
    mc.fillStyle = "#000";
    mc.fillRect(0, 0, 128, 128);
    mc.fillStyle = "#fff";
    mc.font = '900 110px "Noto Serif TC", "Songti TC", serif';
    mc.textAlign = "center";
    mc.textBaseline = "middle";
    mc.fillText("印", 64, 68);
    const d = mc.getImageData(0, 0, 128, 128).data;
    for (let y = 2; y < 126; y += 3)
      for (let xx = 2; xx < 126; xx += 2) {
        const x = y % 6 ? xx : 126 - xx;
        if (d[(y * 128 + x) * 4]! > 128) path.push([x / 128, y / 128]);
      }
  }
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.38), [alu(), alu(), new THREE.MeshPhysicalMaterial({ map: cutTex, metalness: 0.9, roughness: 0.3 }), alu(), alu(), alu()]);
  stock.position.y = 0.29;
  const chips = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(120 * 3), 3)),
    new THREE.PointsMaterial({ color: "#e8eaee", size: 0.012 }),
  );
  chips.frustumCulled = false;
  mill.add(base, table, column, head, stock, chips);
  mill.position.set(0.85, -0.6, 0.05);
  mill.rotation.y = -0.35;
  root.add(mill);
  let drawn = 0;
  const clipAt = new THREE.Vector3();
  const chipPos = chips.geometry.getAttribute("position") as THREE.BufferAttribute;
  const chipVel = new Float32Array(120 * 3);
  let chipI = 0;

  return {
    object: shadow(root),
    update(k, t, dt) {
      // printer: layers rise with k; the head rasters across the top of the current layer
      const h = Math.min(1, Math.max(0, (k - 0.1) / 0.75)) * PH * 1.15;
      // clipping planes live in world space: cut at the current layer's world height
      clipAt.set(0, 0.2125 + h, 0);
      printer.localToWorld(clipAt);
      clip.constant = clipAt.y;
      gantry.position.y = 0.2125 + h + 0.17;
      const sweep = Math.sin(t * 5);
      carriage.position.x = sweep * 0.22 * (0.4 + 0.6 * (1 - h / (PH * 1.15)));
      gantry.position.z = Math.cos(t * 1.7) * 0.18;
      glow.intensity = k > 0.1 && k < 0.85 ? 0.6 : 0;
      spool.rotation.y += dt * (k > 0.1 && k < 0.85 ? 1.2 : 0);
      // mill: follow the path, engraving it onto the stock
      const want = Math.floor(Math.min(1, Math.max(0, (k - 0.1) / 0.8)) * path.length);
      if (want < drawn) {
        paintStock();
        drawn = 0;
      }
      cctx.fillStyle = "#5d6168";
      for (; drawn < want; drawn++) {
        const [u, v] = path[drawn]!;
        cctx.beginPath();
        cctx.arc(64 + u * 384, 64 + v * 384, 6, 0, Math.PI * 2);
        cctx.fill();
      }
      cutTex.needsUpdate = true;
      const [u, v] = path[Math.min(path.length - 1, Math.max(0, want))] ?? [0.5, 0.5];
      head.position.x = (u - 0.5) * 0.375;
      head.position.z = (v - 0.5) * 0.285;
      head.position.y = 0.72 - (k > 0.1 && k < 0.9 ? 0.055 : 0);
      bit.rotation.y += dt * 60;
      // chips fly while cutting
      if (k > 0.1 && k < 0.9) {
        for (let n = 0; n < 3; n++) {
          chipI = (chipI + 1) % 120;
          chipPos.setXYZ(chipI, head.position.x, 0.36, head.position.z);
          chipVel[chipI * 3] = (Math.random() - 0.5) * 0.8;
          chipVel[chipI * 3 + 1] = 0.4 + Math.random() * 0.6;
          chipVel[chipI * 3 + 2] = (Math.random() - 0.5) * 0.8;
        }
      }
      for (let i = 0; i < 120; i++) {
        chipVel[i * 3 + 1]! -= dt * 3;
        chipPos.setXYZ(i, chipPos.getX(i) + chipVel[i * 3]! * dt, Math.max(0.23, chipPos.getY(i) + chipVel[i * 3 + 1]! * dt), chipPos.getZ(i) + chipVel[i * 3 + 2]! * dt);
      }
      chipPos.needsUpdate = true;
    },
  };
}

// =====================================================================
// compass → phone with a map + navigation satellites

function mapScreen() {
  return canvasTex(
    700,
    1440,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#eef0ea";
      ctx.fillRect(0, 0, w, h);
      // parks and water
      ctx.fillStyle = "#cfe6c4";
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.ellipse(r() * w, r() * h, 60 + r() * 90, 40 + r() * 80, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "#a9cbe6";
      ctx.lineWidth = 46;
      ctx.beginPath();
      ctx.moveTo(-20, h * 0.62);
      ctx.bezierCurveTo(w * 0.3, h * 0.55, w * 0.55, h * 0.75, w + 20, h * 0.68);
      ctx.stroke();
      // streets: a grid with a few diagonals
      ctx.strokeStyle = "#ffffff";
      for (let k = 0; k < 18; k++) {
        ctx.lineWidth = k % 4 ? 10 : 20;
        const y = (k / 18) * h + r() * 20;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (r() - 0.5) * 60);
        ctx.stroke();
      }
      for (let k = 0; k < 9; k++) {
        ctx.lineWidth = k % 3 ? 10 : 22;
        const x = (k / 9) * w + r() * 20;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (r() - 0.5) * 80, h);
        ctx.stroke();
      }
      ctx.strokeStyle = "#f6d37a";
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.lineTo(w, h * 0.9);
      ctx.stroke();
      // the route
      ctx.strokeStyle = "#1a73e8";
      ctx.lineWidth = 18;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ROUTE.forEach(([u, v], i) => (i ? ctx.lineTo(u * w, v * h) : ctx.moveTo(u * w, v * h)));
      ctx.stroke();
      // destination pin
      const [du, dv] = ROUTE[ROUTE.length - 1]!;
      ctx.fillStyle = "#d93025";
      ctx.beginPath();
      ctx.arc(du * w, dv * h - 40, 26, Math.PI, 0);
      ctx.lineTo(du * w, dv * h);
      ctx.fill();
      // header card
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.beginPath();
      ctx.roundRect(30, 60, w - 60, 150, 26);
      ctx.fill();
      ctx.fillStyle = "#1a73e8";
      ctx.font = '700 46px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.fillText("↱  Rẽ phải sau 200 m", 60, 132);
      ctx.fillStyle = "#555";
      ctx.font = '400 32px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.fillText("Định vị vệ tinh · Bắc Đẩu / GPS", 60, 182);
      // bottom card
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.beginPath();
      ctx.roundRect(30, h - 210, w - 60, 160, 26);
      ctx.fill();
      ctx.fillStyle = "#188038";
      ctx.font = '700 52px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.fillText("12 phút", 60, h - 130);
      ctx.fillStyle = "#555";
      ctx.font = '400 32px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.fillText("4,2 km · đến Văn Miếu", 60, h - 82);
      mottle(ctx, w, h, r, "rgba(0,0,0,1)", 0.02, 4, 2);
    },
    831,
  );
}
const ROUTE: [number, number][] = [
  [0.2, 0.86],
  [0.2, 0.7],
  [0.42, 0.62],
  [0.42, 0.45],
  [0.68, 0.38],
  [0.7, 0.24],
];

export function buildPhoneAndSatellites(): Modern {
  const root = new THREE.Group();
  const phone = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.78, 1.6, 0.08, 8, 0.1), new THREE.MeshPhysicalMaterial({ color: "#2b2d31", metalness: 0.9, roughness: 0.28, clearcoat: 0.6 }));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.52), glass(mapScreen()));
  screen.position.z = 0.041;
  // the location dot travels along the route on the glass
  const dot = new THREE.Group();
  const halo = new THREE.Mesh(new THREE.CircleGeometry(0.05, 32), new THREE.MeshBasicMaterial({ color: "#1a73e8", transparent: true, opacity: 0.25 }));
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.022, 32), new THREE.MeshBasicMaterial({ color: "#1a73e8" }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.03, 32), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
  core.position.z = ring.position.z = 0.001;
  const cone = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24, Math.PI / 2 - 0.4, 0.8), new THREE.MeshBasicMaterial({ color: "#1a73e8", transparent: true, opacity: 0.18 }));
  dot.add(cone, halo, ring, core);
  dot.position.z = 0.043;
  // a compass rose in the corner of the screen
  const roseTex = canvasTex(256, 256, (ctx) => {
    ctx.translate(128, 128);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d93025";
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(22, 0);
    ctx.lineTo(-22, 0);
    ctx.fill();
    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(22, 0);
    ctx.lineTo(-22, 0);
    ctx.fill();
  });
  const rose = new THREE.Mesh(new THREE.CircleGeometry(0.07, 32), new THREE.MeshBasicMaterial({ map: roseTex, transparent: true }));
  rose.position.set(0.25, 0.48, 0.043);
  const camBump = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.26, 0.03, 4, 0.05), new THREE.MeshPhysicalMaterial({ color: "#1d1f22", metalness: 0.8, roughness: 0.25 }));
  camBump.position.set(-0.2, 0.58, -0.052);
  phone.add(frame, screen, dot, rose, camBump);
  phone.rotation.set(-0.15, 0.25, 0.04);
  root.add(phone);

  // a small Earth with a ring of navigation satellites
  const earth = new THREE.Group();
  const eTex = canvasTex(1024, 512, (ctx, w, h, r) => {
    ctx.fillStyle = "#1d4f86";
    ctx.fillRect(0, 0, w, h);
    mottle(ctx, w, h, r, "rgba(70,140,90,1)", 0.9, 3, 4);
    mottle(ctx, w, h, r, "rgba(29,79,134,1)", 0.8, 5, 3);
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.45, 64, 32), new THREE.MeshStandardMaterial({ map: eTex, roughness: 0.6 }));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(0.47, 48, 24), new THREE.MeshBasicMaterial({ color: "#6fb4ff", transparent: true, opacity: 0.12, side: THREE.BackSide }));
  earth.add(globe, atmo);
  const sats: THREE.Group[] = [];
  const satBody = (i: number) => {
    const s = new THREE.Group();
    const bus = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.08), new THREE.MeshPhysicalMaterial({ color: "#d4a84a", metalness: 1, roughness: 0.35 }));
    const panelMat = new THREE.MeshPhysicalMaterial({ color: "#1d2c6b", metalness: 0.6, roughness: 0.2, clearcoat: 1 });
    for (const x of [-0.11, 0.11]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.004, 0.06), panelMat);
      p.position.x = x;
      s.add(p);
    }
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.02, 16, 1, true), new THREE.MeshStandardMaterial({ color: "#eee", side: THREE.DoubleSide }));
    dish.position.z = 0.05;
    dish.rotation.x = -Math.PI / 2;
    s.add(bus, dish);
    s.userData["orbit"] = { r: 0.85 + (i % 2) * 0.12, tilt: (i % 3) * 0.6 - 0.3, phase: (i / 6) * Math.PI * 2 };
    return s;
  };
  for (let i = 0; i < 6; i++) {
    const s = satBody(i);
    sats.push(s);
    earth.add(s);
  }
  // signal lines from three satellites down to the phone
  const lineMat = new THREE.LineBasicMaterial({ color: "#7fd0ff", transparent: true, opacity: 0.6 });
  const lines = [0, 2, 4].map(() => {
    const geo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(geo, lineMat);
    l.frustumCulled = false;
    root.add(l);
    return l;
  });
  earth.position.set(0.95, 0.55, -0.9);
  root.add(earth);
  const routeLen = ROUTE.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - ROUTE[i]![0], p[1] - ROUTE[i]![1]), 0);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  return {
    object: shadow(root),
    update(k, t) {
      // the dot walks the route as k goes 0.15 → 0.85
      let d = Math.min(1, Math.max(0, (k - 0.15) / 0.7)) * routeLen;
      let u = ROUTE[0]![0];
      let v = ROUTE[0]![1];
      let ang = 0;
      for (let i = 1; i < ROUTE.length; i++) {
        const [x0, y0] = ROUTE[i - 1]!;
        const [x1, y1] = ROUTE[i]!;
        const seg = Math.hypot(x1 - x0, y1 - y0);
        ang = Math.atan2(-(y1 - y0) * 2, x1 - x0);
        if (d <= seg) {
          u = x0 + ((x1 - x0) * d) / seg;
          v = y0 + ((y1 - y0) * d) / seg;
          break;
        }
        d -= seg;
        u = x1;
        v = y1;
      }
      dot.position.x = (u - 0.5) * 0.72;
      dot.position.y = (0.5 - v) * 1.52;
      cone.rotation.z = ang - Math.PI / 2;
      halo.scale.setScalar(1 + Math.sin(t * 3) * 0.2);
      rose.rotation.z = Math.sin(t * 0.7) * 0.3;
      earth.rotation.y = t * 0.15;
      sats.forEach((s) => {
        const o = s.userData["orbit"] as { r: number; tilt: number; phase: number };
        const ph = o.phase + t * 0.4;
        s.position.set(Math.cos(ph) * o.r, Math.sin(ph) * o.r * Math.sin(o.tilt), Math.sin(ph) * o.r * Math.cos(o.tilt));
        s.lookAt(0, 0, 0);
      });
      lines.forEach((l, i) => {
        sats[i * 2]!.getWorldPosition(a);
        dot.getWorldPosition(b);
        root.worldToLocal(a);
        root.worldToLocal(b);
        const pos = l.geometry.getAttribute("position") as THREE.BufferAttribute;
        pos.setXYZ(0, a.x, a.y, a.z);
        pos.setXYZ(1, b.x, b.y, b.z);
        pos.needsUpdate = true;
        (l.material as THREE.LineBasicMaterial).opacity = 0.35 + 0.3 * Math.sin(t * 4 + i * 2);
      });
    },
  };
}
