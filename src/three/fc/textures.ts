import * as THREE from "three";

/*
 * Procedural material textures for the Forbidden City flyover. Everything is
 * painted on canvases at start-up so the scene needs no image downloads and no
 * third-party assets. Colours follow photographs of the real palace: oxide-red
 * lime plaster, amber glazed roof tiles, grey Jinzhuan floor bricks, Hanbaiyu
 * white marble and blue-green "xuanzi" painted brackets.
 */

// ---------- deterministic noise ----------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise on an integer lattice of `period` cells. */
function makeNoise(period: number, seed: number) {
  const rnd = mulberry32(seed);
  const grid = new Float32Array(period * period);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const at = (x: number, y: number) =>
    grid[(((y % period) + period) % period) * period + (((x % period) + period) % period)]!;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = smooth(x - xi);
    const ty = smooth(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

/** Tileable fractal noise in [0,1] for a texture of `size` pixels. */
function fbmField(size: number, basePeriod: number, octaves: number, seed: number) {
  const layers = Array.from({ length: octaves }, (_, o) =>
    makeNoise(basePeriod * 2 ** o, seed + o * 101),
  );
  const out = new Float32Array(size * size);
  let norm = 0;
  for (let o = 0; o < octaves; o++) norm += 0.5 ** o;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (let o = 0; o < octaves; o++) {
        const p = basePeriod * 2 ** o;
        v += layers[o]!((x / size) * p, (y / size) * p) * 0.5 ** o;
      }
      out[y * size + x] = v / norm;
    }
  }
  return out;
}

function canvas(size: number, h = size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  return { c, ctx };
}

function toTexture(c: HTMLCanvasElement, srgb: boolean, anisotropy: number) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = anisotropy;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

/** Height field → tangent-space normal map (tileable). */
function normalFromHeight(h: Float32Array, size: number, strength: number) {
  const { c, ctx } = canvas(size);
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) =>
    h[(((y + size) % size) * size + ((x + size) % size)) | 0]!;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nz = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) * 4;
      img.data[i] = (-dx * nz * 0.5 + 0.5) * 255;
      img.data[i + 1] = (dy * nz * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function paint(
  size: number,
  fn: (x: number, y: number, i: number) => [number, number, number],
  h = size,
) {
  const { c, ctx } = canvas(size, h);
  const img = ctx.createImageData(size, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const [r, g, b] = fn(x, y, i);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const clamp255 = (v: number) => Math.max(0, Math.min(255, v));

export type TextureSet = ReturnType<typeof createTextures>;

export function createTextures(anisotropy: number) {
  const S = 512;

  // ---------- glazed roof tiles: 8 tile columns × 8 courses per texture ----------
  // Alternating concave pan tiles and convex cover tiles (tongwa), each course
  // overlapping the one below. u runs along the eave, v runs up the slope.
  const cols = 8;
  const courses = 8;
  const tileNoise = fbmField(S, 8, 4, 11);
  const tileH = new Float32Array(S * S);
  const tileRnd = mulberry32(7);
  const tileTint = Array.from({ length: cols * courses }, () => tileRnd());
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = (x / S) * cols;
      const fu = u - Math.floor(u);
      const v = (y / S) * courses;
      const fv = v - Math.floor(v);
      // cover tile: raised half-cylinder over the middle 45% of each column
      const cu = Math.abs(fu - 0.5) / 0.23;
      const cover = cu < 1 ? Math.sqrt(1 - cu * cu) : 0;
      // pan tile trough between cover tiles
      const pan = -0.25 * Math.cos(fu * Math.PI * 2) * (cover > 0 ? 0 : 1);
      // course step: each tile's lower lip sits on the next course
      const lip = fv < 0.08 ? (0.08 - fv) / 0.08 : 0;
      tileH[y * S + x] = cover * 1.0 + pan * 0.35 + lip * 0.35 + tileNoise[y * S + x]! * 0.05;
    }
  }
  const roofColor = paint(S, (x, y, i) => {
    const u = Math.floor((x / S) * cols);
    const v = Math.floor((y / S) * courses);
    const fu = (x / S) * cols - u;
    const fv = (y / S) * courses - v;
    const tint = tileTint[v * cols + u]! - 0.5;
    const n = tileNoise[i]!;
    const cu = Math.abs(fu - 0.5) / 0.23;
    const onCover = cu < 1;
    // glaze thins at cover crests (lighter) and collects grime in pans (darker)
    const grime = onCover ? 0 : 0.18 + 0.12 * (1 - fv);
    const crest = onCover ? (1 - cu) * 0.12 : 0;
    const shade = 1 - grime + crest + (fv < 0.06 ? -0.25 : 0) + (n - 0.5) * 0.18;
    const r = (200 + tint * 24) * shade;
    const g = (146 + tint * 24 - grime * 34) * shade;
    const b = (50 + tint * 12) * shade;
    return [clamp255(r), clamp255(g), clamp255(b)];
  });
  const roofRough = paint(S, (x, _y, i) => {
    const fu = ((x / S) * cols) % 1;
    const onCover = Math.abs(fu - 0.5) < 0.23;
    const v = (onCover ? 70 : 150) + tileNoise[i]! * 60;
    return [v, v, v];
  });
  const roofNormal = normalFromHeight(tileH, S, 7);

  // ---------- oxide-red lime plaster with vertical rain streaks ----------
  const plN = fbmField(S, 6, 5, 21);
  const streak = makeNoise(64, 31);
  const plaster = paint(S, (x, y, i) => {
    const s = streak((x / S) * 64, (y / S) * 2) * 0.5 + streak((x / S) * 64, (y / S) * 6) * 0.5;
    const n = plN[i]!;
    const k = 0.82 + n * 0.3 - s * 0.12 * (y / S);
    return [clamp255(150 * k), clamp255(46 * k), clamp255(36 * k)];
  });
  const plasterBump = normalFromHeight(plN, S, 1.2);

  // ---------- lacquered column red (smoother, deeper) ----------
  const lacN = fbmField(S, 4, 4, 41);
  const lacquer = paint(S, (_x, _y, i) => {
    const k = 0.9 + lacN[i]! * 0.18;
    return [clamp255(138 * k), clamp255(28 * k), clamp255(22 * k)];
  });

  // ---------- Hanbaiyu white marble with block joints ----------
  const mN = fbmField(S, 5, 5, 51);
  const marble = paint(S, (x, y, i) => {
    const jx = x % 128 < 2 || y % 64 < 2;
    const k = (jx ? 0.8 : 1) * (0.9 + mN[i]! * 0.16);
    return [clamp255(210 * k), clamp255(204 * k), clamp255(190 * k)];
  });

  // ---------- grey floor bricks (courtyards), running bond ----------
  const bN = fbmField(S, 8, 4, 61);
  const bRnd = mulberry32(62);
  const brickTint = Array.from({ length: 16 * 32 }, () => bRnd());
  const bricksH = new Float32Array(S * S);
  const bricks = paint(S, (x, y, i) => {
    const row = Math.floor(y / 32);
    const off = row % 2 ? 32 : 0;
    const col = Math.floor((x + off) / 64) % 8;
    const joint = y % 32 < 2 || (x + off) % 64 < 2;
    bricksH[i] = joint ? 0 : 1;
    const t = brickTint[row * 16 + col]! - 0.5;
    const k = (joint ? 0.72 : 1) * (0.92 + bN[i]! * 0.14 + t * 0.12);
    return [clamp255(128 * k), clamp255(124 * k), clamp255(116 * k)];
  });
  const bricksNormal = normalFromHeight(bricksH, S, 1.5);

  // ---------- large-scale variation to break tiling on big planes ----------
  const { c: macro, ctx: mctx } = canvas(256);
  const macroN = fbmField(256, 4, 5, 71);
  const mimg = mctx.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 150 + (macroN[i]! - 0.5) * 140;
    mimg.data[i * 4] = mimg.data[i * 4 + 1] = mimg.data[i * 4 + 2] = clamp255(v);
    mimg.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(mimg, 0, 0);

  // ---------- lattice doors & windows (one bay per texture) ----------
  const door = canvas(256, 512);
  {
    const g = door.ctx;
    g.fillStyle = "#7d2019";
    g.fillRect(0, 0, 256, 512);
    g.fillStyle = "#5b1511";
    g.fillRect(0, 0, 256, 18);
    g.fillRect(0, 494, 256, 18);
    // four leaves
    for (let l = 0; l < 4; l++) {
      const x0 = 6 + l * 62;
      g.fillStyle = "#8a241c";
      g.fillRect(x0, 24, 56, 464);
      // upper lattice (ling hua): diagonal cross-hatch in gold-brown
      g.save();
      g.beginPath();
      g.rect(x0 + 5, 34, 46, 250);
      g.clip();
      g.strokeStyle = "#b8893a";
      g.lineWidth = 2;
      for (let k = -300; k < 300; k += 9) {
        g.beginPath();
        g.moveTo(x0 + k, 34);
        g.lineTo(x0 + k + 250, 284);
        g.stroke();
        g.beginPath();
        g.moveTo(x0 + k + 250, 34);
        g.lineTo(x0 + k, 284);
        g.stroke();
      }
      g.restore();
      g.fillStyle = "rgba(20,12,10,0.35)";
      g.fillRect(x0 + 5, 34, 46, 250);
      // lower panels
      g.fillStyle = "#6f1c16";
      g.fillRect(x0 + 8, 300, 40, 70);
      g.fillRect(x0 + 8, 390, 40, 90);
      g.strokeStyle = "#b8893a";
      g.lineWidth = 3;
      g.strokeRect(x0 + 8, 300, 40, 70);
    }
  }

  // ---------- painted brackets and beams (xuanzi caihua) ----------
  const beam = canvas(512, 128);
  {
    const g = beam.ctx;
    g.fillStyle = "#1f4a5a";
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = "#2c6a5e";
    g.fillRect(0, 70, 512, 58);
    // bracket clusters (dougong) as stacked blocks
    for (let k = 0; k < 8; k++) {
      const x = k * 64 + 32;
      g.fillStyle = "#2d7064";
      g.fillRect(x - 22, 6, 44, 14);
      g.fillStyle = "#1c4d63";
      g.fillRect(x - 16, 20, 32, 14);
      g.fillStyle = "#2d7064";
      g.fillRect(x - 26, 34, 52, 12);
      g.fillStyle = "#c79a3e";
      g.fillRect(x - 8, 46, 16, 20);
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(x - 26, 46, 52, 4);
    }
    // whirl medallions on the architrave
    for (let k = 0; k < 4; k++) {
      const cx = k * 128 + 64;
      g.strokeStyle = "#d7c9a2";
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(cx, 99, 40, 20, 0, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#c79a3e";
      g.beginPath();
      g.arc(cx, 99, 7, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#c79a3e";
    g.fillRect(0, 68, 512, 3);
  }

  // ---------- eave soffit: blue-green rafters with round ends ----------
  const soffit = canvas(256, 256);
  {
    const g = soffit.ctx;
    g.fillStyle = "#16303a";
    g.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 8; k++) {
      g.fillStyle = k % 2 ? "#1f5147" : "#1d4656";
      g.fillRect(k * 32 + 6, 0, 20, 256);
    }
  }

  // ---------- water ripples ----------
  const wH = fbmField(S, 8, 5, 91);
  const waterNormal = normalFromHeight(wH, S, 3);

  // ---------- city roofs (grey hutong tiles) ----------
  const hN = fbmField(256, 8, 4, 101);
  const greyTile = paint(256, (x, _y, i) => {
    const fu = ((x / 256) * 16) % 1;
    const k = (Math.abs(fu - 0.5) < 0.2 ? 1.05 : 0.85) * (0.9 + hN[i]! * 0.2);
    return [clamp255(96 * k), clamp255(96 * k), clamp255(98 * k)];
  });

  return {
    roofColor: toTexture(roofColor, true, anisotropy),
    roofRough: toTexture(roofRough, false, anisotropy),
    roofNormal: toTexture(roofNormal, false, anisotropy),
    plaster: toTexture(plaster, true, anisotropy),
    plasterNormal: toTexture(plasterBump, false, anisotropy),
    lacquer: toTexture(lacquer, true, anisotropy),
    marble: toTexture(marble, true, anisotropy),
    bricks: toTexture(bricks, true, anisotropy),
    bricksNormal: toTexture(bricksNormal, false, anisotropy),
    macro: toTexture(macro, false, anisotropy),
    door: toTexture(door.c, true, anisotropy),
    beam: toTexture(beam.c, true, anisotropy),
    soffit: toTexture(soffit.c, true, anisotropy),
    waterNormal: toTexture(waterNormal, false, anisotropy),
    greyTile: toTexture(greyTile, true, anisotropy),
  };
}
