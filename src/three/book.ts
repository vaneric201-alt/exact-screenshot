import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/*
 * A real open book for the Great Rewind. The pages rise out of the gutter in
 * a soft curve, as they do when a thick book lies open; under them the page
 * block shows its stacked edges, on a leather cover with rounded corners and a
 * silk bookmark lying in the gutter. One leaf bends as it turns and casts its
 * shadow on the page below. Page faces are painted on canvases (paintLeft /
 * paintRight) with a band across the middle left clear for the timeline
 * ribbon that runs over the book, and cached a few at a time.
 *
 * Spread i shows left page L(i) and right page R(i). Turning from spread i to
 * i + 1 either goes back through the book (the left leaf lifts and lands on
 * the right — the rewind) or forward (right to left).
 */

export interface SpreadContent {
  image?: string;
  imageAlt: string;
  credit?: string;
  year: string;
  caption: string;
  era: string;
  han: string;
  blank?: boolean;
}

export interface Book {
  /** Show spread i, or the turn from i to i + 1 at progress t (0–1). */
  show(i: number, t: number, dir: "back" | "forward"): void;
  resize(): void;
  dispose(): void;
}

const W = 1;
const H = 1.36;
const COLS = 56;
const TEX_W = 1024;
const TEX_H = Math.round(TEX_W * H);
/** Height of the page surface above the cover top, and of the block under it. */
const BLOCK = 0.04;
const RISE = 0.05;

/** The curve of an open page: out of the gutter, up, then settling toward the fore-edge. */
const prof = (u: number) => RISE * (1 - Math.pow(1 - Math.min(1, u / 0.4), 2.4)) * (1 - 0.24 * u);

const imageCache = new Map<string, HTMLImageElement | "loading" | "missing">();

export function createBook(canvas: HTMLCanvasElement, spreads: SpreadContent[]): Book {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);

  // a warm reading lamp high on the left, a cool fill from the window side
  scene.add(new THREE.HemisphereLight("#fff6e6", "#8a7552", 1.1));
  const key = new THREE.DirectionalLight("#ffe9c7", 2.1);
  key.position.set(-1.8, 3.6, 1.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1.7;
  key.shadow.camera.right = 1.7;
  key.shadow.camera.top = 1.3;
  key.shadow.camera.bottom = -1.3;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.01;
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight("#d8e2ff", 0.35);
  fill.position.set(2.2, 1.5, -0.8);
  scene.add(fill);

  const grain = paperGrainTexture();

  // ---------- the book body ----------
  const edgeTex = pageEdgeTexture();
  const edgeMat = new THREE.MeshStandardMaterial({ map: edgeTex, roughness: 0.95, color: "#f3e9d2" });
  for (const s of [-1, 1] as const) {
    const block = new THREE.Mesh(pageBlockGeometry(s), edgeMat);
    block.receiveShadow = true;
    block.castShadow = true;
    scene.add(block);
  }
  const leatherMaps = leatherTextures();
  const leather = new THREE.MeshStandardMaterial({ map: leatherMaps.color, bumpMap: leatherMaps.bump, bumpScale: 1.2, roughness: 0.62, metalness: 0.04 });
  const cover = new THREE.Mesh(new RoundedBoxGeometry(2 * W + 0.13, 0.03, H + 0.11, 4, 0.014), leather);
  cover.position.y = -BLOCK - 0.015;
  cover.receiveShadow = true;
  cover.castShadow = true;
  scene.add(cover);
  // the round spine shows as a soft bulge under the gutter
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H + 0.1, 24, 1, false, Math.PI, Math.PI), leather);
  spine.rotation.x = Math.PI / 2;
  spine.position.y = -BLOCK - 0.028;
  spine.scale.set(1, 1, 0.35);
  scene.add(spine);
  // a silk bookmark lying down the gutter and hanging over the bottom edge
  const mark = new THREE.Mesh(bookmarkGeometry(), new THREE.MeshStandardMaterial({ color: "#9c2a1f", roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide }));
  mark.castShadow = true;
  mark.receiveShadow = true;
  scene.add(mark);
  // soft contact shadow on the paper page of the website
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.6),
    new THREE.MeshBasicMaterial({ map: radialShadow(), transparent: true, depthWrite: false, toneMapped: false }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -BLOCK - 0.031;
  scene.add(contact);

  // ---------- pages ----------
  const pageMat = () => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, color: "#ffffff", bumpMap: grain, bumpScale: 0.35 });
  const leftMat = pageMat();
  const rightMat = pageMat();
  const leafFrontMat = pageMat();
  const leafBackMat = pageMat();
  const left = new THREE.Mesh(pageGeometry(-1), leftMat);
  const right = new THREE.Mesh(pageGeometry(1), rightMat);
  left.receiveShadow = right.receiveShadow = true;
  scene.add(left, right);
  const leafFront = new THREE.Mesh(pageGeometry(1), leafFrontMat);
  const leafBack = new THREE.Mesh(pageGeometry(1, true), leafBackMat);
  leafFront.castShadow = leafBack.castShadow = true;
  leafFront.receiveShadow = leafBack.receiveShadow = true;
  const leaf = new THREE.Group();
  leaf.add(leafFront, leafBack);
  scene.add(leaf);

  // ---------- page textures ----------
  const cache = new Map<string, { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture }>();
  const face = (i: number, side: "L" | "R") => {
    const key = `${i}${side}`;
    let hit = cache.get(key);
    if (!hit) {
      const c = document.createElement("canvas");
      c.width = TEX_W;
      c.height = TEX_H;
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      hit = { canvas: c, tex };
      cache.set(key, hit);
      paint(i, side, hit);
      // keep a handful of faces around the current spread
      if (cache.size > 12) {
        for (const [k, v] of cache) {
          const n = Number.parseInt(k, 10);
          if (Math.abs(n - i) > 3) {
            v.tex.dispose();
            cache.delete(k);
          }
        }
      }
    }
    return hit.tex;
  };
  const paint = (i: number, side: "L" | "R", hit: { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture }) => {
    const s = spreads[i];
    if (!s) return;
    const ctx = hit.canvas.getContext("2d")!;
    const again = () => {
      if (cache.get(`${i}${side}`) !== hit) return;
      paint(i, side, hit);
      render();
    };
    if (side === "L") paintLeft(ctx, s, i, again);
    else paintRight(ctx, s, i);
    hit.tex.needsUpdate = true;
  };
  // the fonts must be ready before the faces are painted
  document.fonts?.ready.then(() => {
    for (const [k, v] of cache) paint(Number.parseInt(k, 10), k.endsWith("L") ? "L" : "R", v);
    render();
  });

  // ---------- turning ----------
  const leafPosF = leafFront.geometry.getAttribute("position") as THREE.BufferAttribute;
  const leafPosB = leafBack.geometry.getAttribute("position") as THREE.BufferAttribute;
  const bend = (theta: number, sign: number) => {
    // integrate the page along its width; the free edge lags behind the hinge.
    // Near either side the leaf settles into the curve of the page it lands on.
    const settle = Math.pow(Math.cos(theta), 2);
    let x = 0;
    let y = 0;
    const du = W / COLS;
    for (let c = 0; c <= COLS; c++) {
      const u = c / COLS;
      const lift = settle * prof(u) + 0.004;
      for (const pos of [leafPosF, leafPosB]) {
        pos.setXYZ(c * 2, x, y + lift, -H / 2);
        pos.setXYZ(c * 2 + 1, x, y + lift, H / 2);
      }
      const phi = theta - sign * 0.95 * Math.sin(theta) * Math.pow(u, 1.4);
      x += Math.cos(phi) * du;
      y += Math.sin(phi) * du;
    }
    leafPosF.needsUpdate = leafPosB.needsUpdate = true;
    leafFront.geometry.computeVertexNormals();
    leafBack.geometry.computeVertexNormals();
    leafFront.geometry.computeBoundingSphere();
    leafBack.geometry.computeBoundingSphere();
  };

  const render = () => renderer.render(scene, camera);

  const show = (i: number, t: number, dir: "back" | "forward") => {
    const n = spreads.length;
    i = Math.max(0, Math.min(n - 1, i));
    const turning = t > 0.001 && t < 0.999 && i + 1 < n;
    if (!turning) {
      const k = t >= 0.999 && i + 1 < n ? i + 1 : i;
      leftMat.map = face(k, "L");
      rightMat.map = face(k, "R");
      leaf.visible = false;
    } else {
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (dir === "back") {
        leftMat.map = face(i + 1, "L");
        rightMat.map = face(i, "R");
        leafFrontMat.map = face(i + 1, "R");
        leafBackMat.map = face(i, "L");
        bend(Math.PI * (1 - e), -1);
      } else {
        leftMat.map = face(i, "L");
        rightMat.map = face(i + 1, "R");
        leafFrontMat.map = face(i, "R");
        leafBackMat.map = face(i + 1, "L");
        bend(Math.PI * e, 1);
      }
      leaf.visible = true;
      // prepare the faces of the next turn
      face(Math.min(n - 1, i + 2), "L");
      face(Math.min(n - 1, i + 2), "R");
    }
    for (const m of [leftMat, rightMat, leafFrontMat, leafBackMat]) m.needsUpdate = true;
    render();
  };

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit the open book: about 60% of the width and 76% of the height
    const vf = THREE.MathUtils.degToRad(camera.fov);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const d = Math.max((2 * W + 0.13) / (0.62 * 2 * Math.tan(hf / 2)), (H * 0.8 + 0.1) / (0.74 * 2 * Math.tan(vf / 2)));
    // look down almost square onto the open pages so their text faces the reader
    const dir = new THREE.Vector3(0, 0.965, 0.26).normalize();
    camera.position.copy(dir.multiplyScalar(d));
    camera.lookAt(0, 0, 0.02);
    // lift the book into the upper part of the screen; the timeline runs along the bottom
    camera.setViewOffset(w, h, 0, h * 0.045, w, h);
    camera.updateProjectionMatrix();
    render();
  };

  return {
    show,
    resize,
    dispose() {
      cache.forEach((v) => v.tex.dispose());
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => {
            (x as THREE.MeshStandardMaterial).map?.dispose();
            x.dispose();
          });
        }
      });
      grain.dispose();
      edgeTex.dispose();
      leatherMaps.bump.dispose();
      renderer.dispose();
    },
  };
}

/**
 * A page lying open, hinged at the spine (x = 0), reaching to x = side · W,
 * following the curve prof(u). `reversed` builds the other face (the leaf's back).
 */
function pageGeometry(side: 1 | -1, reversed = false) {
  const pos: number[] = [];
  const uv: number[] = [];
  for (let c = 0; c <= COLS; c++) {
    const u = c / COLS;
    const x = side * u * W;
    const y = side === -1 || !reversed ? prof(u) : 0;
    pos.push(x, y, -H / 2, x, y, H / 2);
    // the texture always reads from the outer edge for left pages, from the spine for right ones
    const tu = side === 1 && !reversed ? u : 1 - u;
    uv.push(tu, 1, tu, 0);
  }
  const idx: number[] = [];
  for (let c = 0; c < COLS; c++) {
    const a = c * 2;
    const b = a + 1;
    const d = a + 2;
    const e = a + 3;
    // faces point up (+y) for the right page and the leaf front, down for the leaf back
    const up = (side === 1) !== reversed;
    if (up) idx.push(a, b, d, d, b, e);
    else idx.push(a, d, b, d, e, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The stack of pages under one side: its fore-edge and head/tail edges follow the page curve. */
function pageBlockGeometry(side: 1 | -1) {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[], u0: number, u1: number) => {
    const k = pos.length / 3;
    pos.push(...a, ...b, ...c, ...d);
    uv.push(u0, 0, u1, 0, u1, 1, u0, 1);
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  };
  const bottom = -BLOCK;
  const top = (u: number) => prof(u) - 0.003;
  // head and tail edges (z = ∓H/2), one strip each along the width
  for (let c = 0; c < COLS; c++) {
    const u0 = c / COLS;
    const u1 = (c + 1) / COLS;
    const x0 = side * u0 * W;
    const x1 = side * u1 * W;
    for (const z of [-H / 2, H / 2]) {
      const facingOut = (z > 0) === (side > 0);
      const a = [x0, bottom, z];
      const b = [x1, bottom, z];
      const cc = [x1, top(u1), z];
      const d = [x0, top(u0), z];
      if (facingOut) quad(a, b, cc, d, u0, u1);
      else quad(b, a, d, cc, u1, u0);
    }
  }
  // fore-edge
  const x = side * W;
  const a = [x, bottom, -H / 2];
  const b = [x, bottom, H / 2];
  const cc = [x, top(1), H / 2];
  const d = [x, top(1), -H / 2];
  if (side > 0) quad(b, a, d, cc, 0, 1);
  else quad(a, b, cc, d, 0, 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A silk ribbon down the gutter of the right page, draping over the tail edge. */
function bookmarkGeometry() {
  const pts: THREE.Vector3[] = [];
  const x = 0.035;
  for (let k = 0; k <= 24; k++) {
    const z = -H / 2 + (k / 24) * H;
    pts.push(new THREE.Vector3(x + Math.sin(k * 0.4) * 0.004, prof(x / W) + 0.006, z));
  }
  pts.push(new THREE.Vector3(x + 0.004, prof(x) - 0.02, H / 2 + 0.03));
  pts.push(new THREE.Vector3(x + 0.012, -BLOCK - 0.02, H / 2 + 0.07));
  pts.push(new THREE.Vector3(x + 0.02, -BLOCK - 0.03, H / 2 + 0.2));
  const curve = new THREE.CatmullRomCurve3(pts);
  const n = 90;
  const pos: number[] = [];
  const idx: number[] = [];
  const half = 0.016;
  for (let k = 0; k <= n; k++) {
    const p = curve.getPoint(k / n);
    pos.push(p.x - half, p.y, p.z, p.x + half, p.y, p.z);
    if (k < n) {
      const a = k * 2;
      idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// painting the page faces

const PAPER = "#f3e8d0";
const INK = "#1f2326";
const INK_SOFT = "#4a4f52";
const SON = "#b23a2b";
const GOLD = "#b8903a";
const DISPLAY = `"Newsreader", "Noto Serif", Georgia, serif`;
const BODY = `"Be Vietnam Pro", system-ui, sans-serif`;
/** The band across the middle of each page that the timeline ribbon covers. */
const BAND_TOP = Math.round(TEX_H * 0.43);
const BAND_BOTTOM = Math.round(TEX_H * 0.57);

function paperBase(ctx: CanvasRenderingContext2D, seed: number, spineOnRight: boolean) {
  const w = TEX_W;
  const h = TEX_H;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  // tone variation and fibres
  for (let k = 0; k < 40; k++) {
    const g = ctx.createRadialGradient(rnd() * w, rnd() * h, 0, rnd() * w, rnd() * h, 80 + rnd() * 220);
    g.addColorStop(0, `rgba(170, 130, 70, ${0.02 + rnd() * 0.03})`);
    g.addColorStop(1, "rgba(170, 130, 70, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.lineWidth = 1;
  for (let k = 0; k < 520; k++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const a = rnd() * Math.PI;
    const l = 6 + rnd() * 24;
    ctx.strokeStyle = `rgba(120, 95, 60, ${0.04 + rnd() * 0.07})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + rnd() * 4, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  // a few foxing spots of age
  for (let k = 0; k < 7; k++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 3 + rnd() * 9;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(150, 100, 40, 0.16)");
    g.addColorStop(1, "rgba(150, 100, 40, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // gutter shadow, a warm outer edge, darker head and tail
  const g = ctx.createLinearGradient(spineOnRight ? w : 0, 0, spineOnRight ? w * 0.78 : w * 0.22, 0);
  g.addColorStop(0, "rgba(90, 60, 25, 0.34)");
  g.addColorStop(0.35, "rgba(90, 60, 25, 0.1)");
  g.addColorStop(1, "rgba(90, 60, 25, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const o = ctx.createLinearGradient(spineOnRight ? 0 : w, 0, spineOnRight ? 50 : w - 50, 0);
  o.addColorStop(0, "rgba(150, 110, 50, 0.22)");
  o.addColorStop(1, "rgba(150, 110, 50, 0)");
  ctx.fillStyle = o;
  ctx.fillRect(0, 0, w, h);
  for (const [y0, y1] of [
    [0, 40],
    [h, h - 40],
  ]) {
    const e = ctx.createLinearGradient(0, y0!, 0, y1!);
    e.addColorStop(0, "rgba(150, 110, 50, 0.16)");
    e.addColorStop(1, "rgba(150, 110, 50, 0)");
    ctx.fillStyle = e;
    ctx.fillRect(0, 0, w, h);
  }
  // double gold rule with key-fret corners
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 56, w - 112, h - 112);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(68, 68, w - 136, h - 136);
  const fret = (x: number, y: number, sx: number, sy: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 42);
    ctx.lineTo(0, 0);
    ctx.lineTo(42, 0);
    ctx.lineTo(42, 30);
    ctx.lineTo(11, 30);
    ctx.lineTo(11, 11);
    ctx.lineTo(31, 11);
    ctx.lineTo(31, 21);
    ctx.lineTo(20, 21);
    ctx.stroke();
    ctx.restore();
  };
  fret(80, 80, 1, 1);
  fret(w - 80, 80, -1, 1);
  fret(80, h - 80, 1, -1);
  fret(w - 80, h - 80, -1, -1);
}

/** Loads an image once; `onReady` repaints the face when it arrives. */
function getImage(name: string, onReady: () => void) {
  const url = `/img/${name}.webp`;
  const hit = imageCache.get(url);
  if (hit && hit !== "loading") return hit === "missing" ? null : hit;
  if (!hit) {
    imageCache.set(url, "loading");
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      imageCache.set(url, img);
      onReady();
    };
    img.onerror = () => imageCache.set(url, "missing");
    img.src = url;
  }
  return null;
}

/** Breaks text into lines that fit maxW with the current font. */
function lines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line);
      line = word;
    } else line = test;
  }
  if (line) out.push(line);
  return out;
}

/** Sets the largest font size (≤ max) at which the text fits in maxLines lines; returns the lines. */
function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, maxW: number, max: number, min: number, maxLines: number) {
  let px = max;
  for (; px > min; px -= 2) {
    ctx.font = font(px);
    const ls = lines(ctx, text, maxW);
    if (ls.length <= maxLines && ls.every((l) => ctx.measureText(l).width <= maxW)) return { px, ls };
  }
  ctx.font = font(min);
  return { px: min, ls: lines(ctx, text, maxW).slice(0, maxLines) };
}

/** Left page: the period image mounted on the page, its description and credit below the ribbon band. */
function paintLeft(ctx: CanvasRenderingContext2D, s: SpreadContent, seed: number, again: () => void) {
  paperBase(ctx, seed * 2 + 1, true);
  const w = TEX_W;
  // watermark: the era's character, faint, in the lower half
  ctx.save();
  ctx.fillStyle = "rgba(184, 144, 58, 0.1)";
  ctx.font = `900 330px "Noto Serif TC", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s.han, w / 2 - 20, TEX_H - 120);
  ctx.restore();
  if (s.blank) return;
  // the mount: a lighter card with a soft shadow, the photo inset, four photo corners
  const mx = 112;
  const my = 118;
  const mw = w - 112 - 150;
  const mh = BAND_TOP - my - 30;
  ctx.save();
  ctx.shadowColor = "rgba(60, 40, 20, 0.28)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#fbf5e8";
  ctx.fillRect(mx, my, mw, mh);
  ctx.restore();
  const pad = 22;
  const bx = mx + pad;
  const by = my + pad;
  const bw = mw - pad * 2;
  const bh = mh - pad * 2;
  const img = s.image ? getImage(s.image, again) : null;
  if (img) {
    const r = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
    const iw = img.naturalWidth * r;
    const ih = img.naturalHeight * r;
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    ctx.filter = "sepia(0.18) contrast(1.03) saturate(0.95)";
    ctx.drawImage(img, bx + (bw - iw) / 2, by + (bh - ih) / 2, iw, ih);
    ctx.restore();
  } else {
    ctx.fillStyle = "#e6d9bb";
    ctx.fillRect(bx, by, bw, bh);
  }
  ctx.fillStyle = "#2b2420";
  const corner = (x: number, y: number, sx: number, sy: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + sx * 46, y);
    ctx.lineTo(x, y + sy * 46);
    ctx.closePath();
    ctx.fill();
  };
  corner(bx - 6, by - 6, 1, 1);
  corner(bx + bw + 6, by - 6, -1, 1);
  corner(bx - 6, by + bh + 6, 1, -1);
  corner(bx + bw + 6, by + bh + 6, -1, -1);
  // description and credit below the ribbon band
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  const cap = fit(ctx, s.imageAlt, (px) => `italic 500 ${px}px ${DISPLAY}`, mw, 42, 28, 3);
  const y0 = BAND_BOTTOM + 70;
  cap.ls.forEach((l, k) => ctx.fillText(l, mx, y0 + k * cap.px * 1.28));
  if (s.credit) {
    ctx.fillStyle = INK_SOFT;
    const cr = fit(ctx, s.credit, (px) => `400 ${px}px ${BODY}`, mw, 24, 18, 2);
    cr.ls.forEach((l, k) => ctx.fillText(l, mx, y0 + cap.ls.length * cap.px * 1.28 + 16 + k * cr.px * 1.4));
  }
}

/** Right page: dynasty and year above the ribbon band, the event below it, and the era's seal. */
function paintRight(ctx: CanvasRenderingContext2D, s: SpreadContent, seed: number) {
  paperBase(ctx, seed * 2 + 2, false);
  const w = TEX_W;
  const x = 160;
  const maxW = w - x - 120;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  // the era in cinnabar with a short gold rule
  ctx.fillStyle = SON;
  const era = fit(ctx, s.era, (px) => `600 ${px}px ${BODY}`, maxW, 40, 26, 1);
  ctx.fillText(era.ls[0] ?? "", x, 200);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, 226, 120, 4);
  // the year, as large as the width allows
  ctx.fillStyle = INK;
  const yr = fit(ctx, s.year, (px) => `700 ${px}px ${DISPLAY}`, maxW, 190, 84, 1);
  ctx.fillText(yr.ls[0] ?? "", x - 4, Math.min(BAND_TOP - 40, 250 + yr.px * 0.98));
  // the event below the band
  ctx.fillStyle = INK;
  const cap = fit(ctx, s.caption, (px) => `500 ${px}px ${DISPLAY}`, maxW - 30, 56, 34, 5);
  cap.ls.forEach((l, k) => ctx.fillText(l, x, BAND_BOTTOM + 90 + k * cap.px * 1.26));
  // seal
  const sx = w - 270;
  const sy = TEX_H - 280;
  ctx.save();
  ctx.translate(sx + 70, sy + 70);
  ctx.rotate(-0.05);
  ctx.fillStyle = SON;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(-70, -70, 140, 140);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 5;
  ctx.strokeRect(-60, -60, 120, 120);
  ctx.fillStyle = PAPER;
  ctx.font = `900 92px "Noto Serif TC", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s.han, 0, 6);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// small textures for the book body

function paperGrainTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.random() * 20;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 5);
  return t;
}

function pageEdgeTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f2e7cf";
  ctx.fillRect(0, 0, 64, 256);
  // many thin page lines, slightly uneven
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = `rgba(110, 85, 50, ${0.08 + Math.random() * 0.14})`;
    ctx.fillRect(0, y + (Math.random() < 0.3 ? 1 : 0), 64, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function leatherTextures() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#6a1d16";
  ctx.fillRect(0, 0, size, size);
  for (let k = 0; k < 7000; k++) {
    ctx.fillStyle = `rgba(${Math.random() < 0.5 ? "30,8,6" : "150,55,40"}, ${Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  // blind-tooled border in gold
  ctx.strokeStyle = "#c9a24a";
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, size - 24, size - 24);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, size - 44, size - 44);
  const color = new THREE.CanvasTexture(c);
  color.colorSpace = THREE.SRGBColorSpace;
  // pebbled grain for the bump map
  const b = document.createElement("canvas");
  b.width = b.height = 256;
  const bx = b.getContext("2d")!;
  bx.fillStyle = "#808080";
  bx.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 2600; k++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 1 + Math.random() * 2.6;
    const g = bx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    bx.fillStyle = g;
    bx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const bump = new THREE.CanvasTexture(b);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(6, 4);
  return { color, bump };
}

function radialShadow() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, "rgba(60, 40, 20, 0.4)");
  g.addColorStop(0.55, "rgba(60, 40, 20, 0.14)");
  g.addColorStop(1, "rgba(60, 40, 20, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
