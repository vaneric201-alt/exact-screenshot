/*
 * Where each part of the "four inventions today" sequence sits on its scroll
 * track (0–1). Kept apart from modernShow.ts so the page can read it without
 * loading three.js.
 */

export const PH = {
  /** The four modern heirs appear one by one on a turning ring. */
  circle: [0, 0.075] as const,
  pairs: [
    { id: "giay" as const, from: 0.075, to: 0.17 },
    { id: "in" as const, from: 0.17, to: 0.265 },
    { id: "laban" as const, from: 0.265, to: 0.36 },
  ],
  /** Gunpowder: the parade line-up. */
  parade: [0.36, 0.47] as const,
  /** The canyon run and the air-to-air missile (see airScene.ts for the beats inside it). */
  air: [0.47, 0.68] as const,
  /** The night globe and the ballistic arc; its flash whites out the screen near the end. */
  flight: [0.68, 0.86] as const,
  /** All four, ancient → modern, one in each corner of the screen. */
  montage: [0.86, 1] as const,
};

/** Beats inside the air scene, as a fraction of PH.air (mirrors AIR in airScene.ts). */
export const AIR_BEATS = { release: 0.42, zoom: [0.5, 0.78] as const, hit: 0.8 };

/** Which modern heir is lit during the circle intro (0–3), and whether all four are shown together. */
export function circleStep(p: number) {
  const k = Math.min(1, Math.max(0, (p - PH.circle[0]) / (PH.circle[1] - PH.circle[0])));
  const f = k * 4.6;
  return { f, lit: Math.min(3, Math.floor(f)), all: f >= 4 };
}

export const ORDER = ["giay", "in", "laban", "thuocsung"] as const;

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** How far the montage has moved from a 2×2 grid (0) to four small corner frames (1). */
export function montageQ(p: number) {
  const k = (p - PH.montage[0]) / (PH.montage[1] - PH.montage[0]);
  return smooth((k - 0.38) / 0.3);
}

/**
 * Frame i of the montage (0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right)
 * as fractions of the screen, measured from the top-left corner.
 */
export function montageRect(i: number, q: number) {
  const m = 0.014;
  const full = 0.5 - m * 1.5;
  const w = full + (0.3 - full) * q;
  const h = full + (0.33 - full) * q;
  const x = i % 2 ? 1 - m - w : m;
  const y = i > 1 ? 1 - m - h : m;
  return { x, y, w, h };
}
