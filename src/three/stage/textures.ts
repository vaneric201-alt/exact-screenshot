import * as THREE from "three";
import { rng } from "./stage";

/*
 * Canvas textures for the invention models: wood, bamboo, cloth, paper fibre,
 * stone, brick and brush-written characters. Each material texture carries a
 * matching normal map and roughness map in `userData` (derived from the same
 * drawing: dark grooves read as low, pale fibres as high), which `pbr()` picks
 * up, so grain, weave and chisel marks catch the light instead of being flat
 * paint.
 */

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number) => void;

export interface Relief {
  /** Normal-map strength; 0 = none. */
  normal?: number;
  /** Roughness map range, lightest → darkest pixel. */
  rough?: [number, number];
  /** Invert the height: pale = low (e.g. ink, mortar). */
  invert?: boolean;
}

export function canvasTex(w: number, h: number, draw: Draw, seed = 1, srgb = true, relief: Relief = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: !!(relief.normal || relief.rough) })!;
  draw(ctx, w, h, rng(seed));
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (relief.normal || relief.rough) {
    const img = ctx.getImageData(0, 0, w, h).data;
    const hgt = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const l = (img[i * 4]! * 0.299 + img[i * 4 + 1]! * 0.587 + img[i * 4 + 2]! * 0.114) / 255;
      hgt[i] = relief.invert ? 1 - l : l;
    }
    if (relief.normal) t.userData["normalMap"] = normalFromHeight(hgt, w, h, relief.normal);
    if (relief.rough) t.userData["roughnessMap"] = roughFromHeight(hgt, w, h, relief.rough);
  }
  return t;
}

function dataTex(data: Uint8ClampedArray, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.putImageData(new ImageData(data as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** Sobel normals from a height field (wraps at the edges so tiling stays seamless). */
function normalFromHeight(hgt: Float32Array, w: number, h: number, strength: number) {
  const out = new Uint8ClampedArray(w * h * 4);
  const at = (x: number, y: number) => hgt[((y + h) % h) * w + ((x + w) % w)]!;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const dy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      let nx = -dx * strength;
      let ny = dy * strength;
      let nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      const i = (y * w + x) * 4;
      out[i] = (nx * 0.5 + 0.5) * 255;
      out[i + 1] = (ny * 0.5 + 0.5) * 255;
      out[i + 2] = (nz * 0.5 + 0.5) * 255;
      out[i + 3] = 255;
    }
  return dataTex(out, w, h);
}

function roughFromHeight(hgt: Float32Array, w: number, h: number, [hi, lo]: [number, number]) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = (lo + (hi - lo) * hgt[i]!) * 255;
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v;
    out[i * 4 + 3] = 255;
  }
  return dataTex(out, w, h);
}

/**
 * A MeshStandardMaterial that wears the relief of its colour texture: normal
 * and roughness maps follow the map's repeat, offset and rotation.
 */
export function pbr(o: THREE.MeshStandardMaterialParameters & { relief?: number }) {
  const { relief, ...params } = o;
  const m = new THREE.MeshStandardMaterial(params);
  const map = params.map as THREE.Texture | null | undefined;
  const link = (t: THREE.Texture) => {
    t.repeat = map!.repeat;
    t.offset = map!.offset;
    t.center = map!.center;
    t.rotation = map!.rotation;
    return t;
  };
  const n = map?.userData["normalMap"] as THREE.Texture | undefined;
  if (n && !params.normalMap) {
    m.normalMap = link(n);
    m.normalScale.setScalar(relief ?? 1);
  }
  const r = map?.userData["roughnessMap"] as THREE.Texture | undefined;
  if (r && !params.roughnessMap) m.roughnessMap = link(r);
  return m;
}

/**
 * Smooth value noise painted onto the canvas: random cells of `cells` across,
 * scaled up with smoothing, several octaves — cheap fBm for mottling.
 */
export function mottle(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, color: string, alpha: number, cells = 6, octaves = 4) {
  for (let o = 0; o < octaves; o++) {
    const n = cells * 2 ** o;
    const s = document.createElement("canvas");
    s.width = n;
    s.height = Math.max(1, Math.round((n * h) / w));
    const sc = s.getContext("2d")!;
    const id = sc.createImageData(s.width, s.height);
    for (let i = 0; i < s.width * s.height; i++) {
      id.data[i * 4 + 3] = r() * 255;
    }
    sc.putImageData(id, 0, 0);
    // tint: keep only alpha from the noise
    sc.globalCompositeOperation = "source-in";
    sc.fillStyle = color;
    sc.fillRect(0, 0, s.width, s.height);
    ctx.save();
    ctx.globalAlpha = alpha / (o + 1);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(s, 0, 0, w, h);
    ctx.restore();
  }
}

/** Wood with long grain running along x: growth bands, pores, rays and the odd knot. */
export function woodTex(base = "#8a5a32", seed = 3) {
  return canvasTex(
    1024,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, "rgba(30,15,5,1)", 0.25, 3, 3);
      mottle(ctx, w, h, r, "rgba(255,225,180,1)", 0.12, 4, 3);
      // a knot or two: concentric rings the grain has to flow around
      const knots: [number, number, number][] = [];
      for (let k = 0; k < 1 + Math.floor(r() * 2); k++) knots.push([r() * w, h * (0.2 + r() * 0.6), 10 + r() * 18]);
      const bend = (x: number, y: number) => {
        let d = 0;
        for (const [kx, ky, kr] of knots) {
          const dx = (x - kx) / (kr * 5);
          const dy = y - ky;
          d += (Math.sign(dy) || 1) * kr * 1.6 * Math.exp(-dx * dx) * Math.exp(-(dy * dy) / (kr * kr * 9));
        }
        return d;
      };
      // growth bands: wide soft late-wood lines, then fine grain
      for (let k = 0; k < 220; k++) {
        const y0 = r() * h;
        const late = k < 40;
        ctx.strokeStyle = late ? `rgba(45,22,6,${0.1 + r() * 0.16})` : r() < 0.55 ? `rgba(40,20,5,${0.05 + r() * 0.14})` : `rgba(255,225,175,${0.04 + r() * 0.08})`;
        ctx.lineWidth = late ? 2 + r() * 5 : 0.5 + r() * 1.6;
        ctx.beginPath();
        const ph = r() * 10;
        for (let x = 0; x <= w; x += 8) {
          const y = y0 + Math.sin(x * 0.006 + ph) * 6 + Math.sin(x * 0.021 + ph * 2) * 1.5 + bend(x, y0);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (const [kx, ky, kr] of knots) {
        for (let ring = kr; ring > 1; ring -= 2.2) {
          ctx.strokeStyle = `rgba(35,15,4,${0.25 + (1 - ring / kr) * 0.4})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(kx, ky, ring * 1.5, ring, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(25,10,3,0.55)";
        ctx.beginPath();
        ctx.ellipse(kx, ky, kr * 0.35, kr * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // open pores: short dark dashes along the grain
      for (let k = 0; k < 2600; k++) {
        const x = r() * w;
        const y = r() * h;
        ctx.fillStyle = `rgba(25,12,3,${0.15 + r() * 0.3})`;
        ctx.fillRect(x, y + bend(x, y), 2 + r() * 7, 0.8);
      }
      // medullary rays: faint pale flecks across the grain
      for (let k = 0; k < 120; k++) {
        ctx.fillStyle = `rgba(255,230,190,${0.05 + r() * 0.08})`;
        ctx.fillRect(r() * w, r() * h, 1.2, 4 + r() * 10);
      }
    },
    seed,
    true,
    { normal: 2.2, rough: [0.62, 0.92] },
  );
}

/** Bamboo: green-gold skin, fine vascular fibres along y, a raised node ring. */
export function bambooTex(seed = 5) {
  return canvasTex(
    256,
    1024,
    (ctx, w, h, r) => {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "#a88d4b");
      g.addColorStop(0.35, "#d4bd78");
      g.addColorStop(0.55, "#dcc584");
      g.addColorStop(1, "#9f8545");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, "rgba(110,120,50,1)", 0.18, 2, 3);
      for (let k = 0; k < 220; k++) {
        ctx.fillStyle = r() < 0.7 ? `rgba(90,70,30,${0.05 + r() * 0.12})` : `rgba(255,245,200,${0.05 + r() * 0.1})`;
        const x = r() * w;
        ctx.fillRect(x, 0, 0.6 + r() * 1.2, h);
      }
      // node: dark ring with a pale raised lip
      const ny = h * 0.5;
      ctx.fillStyle = "rgba(80,55,20,0.55)";
      ctx.fillRect(0, ny - 4, w, 8);
      ctx.fillStyle = "rgba(255,240,190,0.45)";
      ctx.fillRect(0, ny - 8, w, 3);
      ctx.fillRect(0, ny + 5, w, 2);
      // speckles and scuffs
      for (let k = 0; k < 160; k++) {
        ctx.fillStyle = `rgba(70,50,20,${0.1 + r() * 0.25})`;
        ctx.beginPath();
        ctx.ellipse(r() * w, r() * h, 0.6 + r() * 1.5, 1 + r() * 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    seed,
    true,
    { normal: 1.6, rough: [0.38, 0.7] },
  );
}

/** Plain woven cloth: individual warp and weft threads, slubs, wear and stains. */
export function clothTex(color: string, seed = 7) {
  return canvasTex(
    512,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      const p = 4;
      for (let y = 0; y < h; y += p)
        for (let x = 0; x < w; x += p) {
          const over = ((x + y) / p) % 2 === 0;
          const v = r() * 0.08;
          ctx.fillStyle = over ? `rgba(255,255,255,${0.05 + v})` : `rgba(0,0,0,${0.08 + v})`;
          ctx.fillRect(x + (over ? 0 : 1), y + (over ? 1 : 0), over ? p : p - 2, over ? p - 2 : p);
        }
      // slubs: thicker spots along a thread
      for (let k = 0; k < 90; k++) {
        const horiz = r() < 0.5;
        ctx.fillStyle = `rgba(255,250,235,${0.08 + r() * 0.12})`;
        if (horiz) ctx.fillRect(r() * w, Math.floor(r() * (h / p)) * p + 1, 8 + r() * 30, 2);
        else ctx.fillRect(Math.floor(r() * (w / p)) * p + 1, r() * h, 2, 8 + r() * 30);
      }
      mottle(ctx, w, h, r, "rgba(110,90,60,1)", 0.22, 3, 3);
      for (let k = 0; k < 10; k++) {
        ctx.fillStyle = `rgba(100,80,50,${0.06 + r() * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(r() * w, r() * h, 14 + r() * 40, 8 + r() * 24, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    seed,
    true,
    { normal: 2.4, rough: [0.85, 1] },
  );
}

/** Handmade paper: warm, mottled, with curved fibres; `rough` makes early, coarse paper with bark specks. */
export function paperTex(rough = false, seed = 11) {
  return canvasTex(
    1024,
    1024,
    (ctx, w, h, r) => {
      ctx.fillStyle = rough ? "#cdb88e" : "#efe4c8";
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, rough ? "rgba(120,90,45,1)" : "rgba(170,140,95,1)", rough ? 0.3 : 0.16, 4, 4);
      mottle(ctx, w, h, r, "rgba(255,250,235,1)", 0.14, 8, 3);
      const n = rough ? 6000 : 3800;
      for (let k = 0; k < n; k++) {
        const x = r() * w;
        const y = r() * h;
        const a = r() * Math.PI;
        const l = 6 + r() * (rough ? 46 : 26);
        const bend = (r() - 0.5) * 0.9;
        const pale = r() < 0.35;
        ctx.strokeStyle = pale ? `rgba(255,250,235,${0.12 + r() * 0.2})` : `rgba(${rough ? "90,65,30" : "130,105,70"},${0.06 + r() * (rough ? 0.22 : 0.11)})`;
        ctx.lineWidth = rough ? 0.8 + r() * 1.4 : 0.5 + r() * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(a + bend) * l * 0.5, y + Math.sin(a + bend) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
      }
      const specks = rough ? 160 : 40;
      for (let k = 0; k < specks; k++) {
        ctx.fillStyle = `rgba(70,48,20,${0.12 + r() * (rough ? 0.3 : 0.15)})`;
        ctx.beginPath();
        ctx.ellipse(r() * w, r() * h, 0.8 + r() * (rough ? 5 : 2), 0.6 + r() * (rough ? 3 : 1.4), r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    seed,
    true,
    { normal: rough ? 2.4 : 1.2, rough: [0.82, 0.98] },
  );
}

/** Stone: layered noise, mineral speckles, tool pits. */
export function stoneTex(base = "#8b867c", seed = 13) {
  return canvasTex(
    1024,
    1024,
    (ctx, w, h, r) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, "rgba(0,0,0,1)", 0.38, 4, 5);
      mottle(ctx, w, h, r, "rgba(255,255,255,1)", 0.22, 6, 4);
      for (let k = 0; k < 14000; k++) {
        const v = r() < 0.5 ? 20 : 235;
        ctx.fillStyle = `rgba(${v},${v},${v},${r() * 0.18})`;
        ctx.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
      }
      // chisel pits
      for (let k = 0; k < 420; k++) {
        const x = r() * w;
        const y = r() * h;
        const rr = 1.5 + r() * 5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, "rgba(0,0,0,0.35)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      // a few hairline veins
      for (let k = 0; k < 5; k++) {
        ctx.strokeStyle = `rgba(230,225,215,${0.12 + r() * 0.15})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        let x = r() * w;
        let y = r() * h;
        ctx.moveTo(x, y);
        for (let s = 0; s < 30; s++) {
          x += (r() - 0.3) * 30;
          y += (r() - 0.5) * 30;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    seed,
    true,
    { normal: 2.8, rough: [0.7, 0.98] },
  );
}

/** Brick wall under thin grey-buff plaster: varied bricks, recessed mortar, chips and soot. */
export function brickTex(seed = 17) {
  return canvasTex(
    1024,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#8f846f";
      ctx.fillRect(0, 0, w, h);
      const bh = 32;
      const bw = 64;
      for (let y = 0, row = 0; y < h; y += bh, row++) {
        for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
          const l = 52 + r() * 18;
          ctx.fillStyle = `hsl(${22 + r() * 10}, ${16 + r() * 12}%, ${l}%)`;
          ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
          // edge bevel: lit top, shaded bottom
          ctx.fillStyle = "rgba(255,240,215,0.18)";
          ctx.fillRect(x + 3, y + 3, bw - 6, 2);
          ctx.fillStyle = "rgba(30,20,10,0.22)";
          ctx.fillRect(x + 3, y + bh - 5, bw - 6, 2);
          // chipped corner
          if (r() < 0.3) {
            ctx.fillStyle = "rgba(60,45,30,0.4)";
            ctx.beginPath();
            const cx = x + 3 + (r() < 0.5 ? 0 : bw - 12);
            const cy = y + 3 + (r() < 0.5 ? 0 : bh - 12);
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 6 + r() * 5, cy);
            ctx.lineTo(cx, cy + 5 + r() * 5);
            ctx.fill();
          }
        }
      }
      mottle(ctx, w, h, r, "rgba(235,225,205,1)", 0.28, 4, 4);
      mottle(ctx, w, h, r, "rgba(25,18,10,1)", 0.18, 3, 3);
      for (let k = 0; k < 5000; k++) {
        ctx.fillStyle = `rgba(${r() < 0.5 ? "30,20,10" : "250,240,220"},${r() * 0.14})`;
        ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
      }
    },
    seed,
    true,
    { normal: 3.2, rough: [0.85, 1] },
  );
}

/** Raw bronze/iron with a patina: for small metal parts. */
export function metalTex(base = "#6b5a3a", patina = "#4f7a62", seed = 19) {
  return canvasTex(
    512,
    512,
    (ctx, w, h, r) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, patina, 0.45, 3, 4);
      mottle(ctx, w, h, r, "rgba(255,230,170,1)", 0.12, 5, 3);
      for (let k = 0; k < 3000; k++) {
        ctx.fillStyle = `rgba(${r() < 0.5 ? "20,15,10" : "255,240,200"},${r() * 0.12})`;
        ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
      }
    },
    seed,
    true,
    { normal: 1.6, rough: [0.35, 0.8] },
  );
}

/**
 * Brush-written characters in columns (right to left, as in old books).
 * `mirror` writes them reversed, as they are carved on a printing block.
 */
export function textTex(chars: string, opts: { w?: number; h?: number; cols?: number; mirror?: boolean; ink?: string; paper?: string | null; size?: number } = {}) {
  const w = opts.w ?? 512;
  const h = opts.h ?? 512;
  const cols = opts.cols ?? 6;
  return canvasTex(w, h, (ctx, _w, _h, r) => {
    if (opts.paper) {
      ctx.fillStyle = opts.paper;
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, "rgba(150,120,80,1)", 0.12, 4, 3);
      for (let k = 0; k < (w * h) / 300; k++) {
        ctx.strokeStyle = `rgba(130,105,70,${0.05 + r() * 0.08})`;
        ctx.lineWidth = 0.6;
        const x = r() * w;
        const y = r() * h;
        const a = r() * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
        ctx.stroke();
      }
    } else ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (opts.mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.fillStyle = opts.ink ?? "#1f1a14";
    const size = opts.size ?? Math.floor(h / (Math.ceil(chars.length / cols) + 1));
    ctx.font = `900 ${size}px "Noto Serif TC", "Songti TC", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const perCol = Math.ceil(chars.length / cols);
    const colW = w / (cols + 0.5);
    [...chars].forEach((ch, i) => {
      const c = Math.floor(i / perCol);
      const rI = i % perCol;
      // ink soaks a little unevenly into fibre
      ctx.globalAlpha = 0.82 + r() * 0.18;
      ctx.fillText(ch, w - colW * (c + 0.75), size * 0.4 + rI * size * 1.02);
    });
    ctx.restore();
  });
}

/** Outer tree bark: deep vertical fissures between grey-brown plates, lichen flecks. */
export function barkTex(seed = 23) {
  return canvasTex(
    512,
    1024,
    (ctx, w, h, r) => {
      ctx.fillStyle = "#6a5240";
      ctx.fillRect(0, 0, w, h);
      mottle(ctx, w, h, r, "rgba(140,120,95,1)", 0.35, 3, 4);
      // fissures: dark wandering cracks running along y
      for (let k = 0; k < 46; k++) {
        let x = r() * w;
        ctx.strokeStyle = `rgba(25,15,8,${0.55 + r() * 0.35})`;
        ctx.lineWidth = 2 + r() * 7;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y <= h; y += 24) {
          x += (r() - 0.5) * 18;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // plate ridges catch light
      for (let k = 0; k < 220; k++) {
        ctx.fillStyle = `rgba(190,170,140,${0.08 + r() * 0.14})`;
        ctx.fillRect(r() * w, r() * h, 3 + r() * 12, 12 + r() * 50);
      }
      for (let k = 0; k < 60; k++) {
        ctx.fillStyle = `rgba(150,160,110,${0.15 + r() * 0.2})`;
        ctx.beginPath();
        ctx.arc(r() * w, r() * h, 2 + r() * 7, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    seed,
    true,
    { normal: 4, rough: [0.85, 1] },
  );
}
