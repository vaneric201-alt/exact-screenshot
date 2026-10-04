/*
 * The Forbidden City walk-through as ten shots, one per building, in the
 * manner of a documentary: each shot is a slow, low camera move toward its
 * building; between shots the picture cuts through a short dip to black, so
 * the camera never has to fly through roofs or show the edges of the model.
 * The page shows one textbook slide per shot (content.ts `sgk.slides`).
 *
 * Positions in metres: x east, z south, y up (see fc/layout.ts).
 */

type V3 = [number, number, number];

export interface Shot {
  /** Scroll progress window of the hero track. */
  from: number;
  to: number;
  pos: [V3, V3];
  look: [V3, V3];
}

const RAW: { pos: [V3, V3]; look: [V3, V3]; w?: number }[] = [
  // 0 · Meridian Gate: down the imperial way as the central doors swing open
  { pos: [[0, 3.2, 700], [0, 2.4, 540]], look: [[0, 15, 470], [0, 13, 470]], w: 1.7 },
  // 1 · over the Golden Water bridges toward the Gate of Supreme Harmony
  { pos: [[-10, 9, 440], [-4, 6, 404]], look: [[0, 6, 360], [0, 11, 312]] },
  // 2 · along the terrace balustrade to the Hall of Supreme Harmony
  { pos: [[50, 9.9, 74], [33, 9.8, 76]], look: [[0, 18, 44], [0, 17, 46]] },
  // 3 · Hall of Middle Harmony, from the west side of the terrace
  { pos: [[-36, 9.8, 16], [-21, 9.8, 6]], look: [[0, 13, -18], [0, 12, -18]] },
  // 4 · Hall of Preserving Harmony, from the east
  { pos: [[34, 9.8, -40], [14, 9.8, -58]], look: [[0, 14, -82], [0, 13, -82]] },
  // 5 · down from the terrace: the Gate of Heavenly Purity
  { pos: [[26, 2.1, -142], [8, 2.1, -154]], look: [[0, 7, -178], [0, 6.5, -178]] },
  // 6 · through the gate, the Palace of Heavenly Purity on its raised way
  { pos: [[0, 3.8, -193], [-6, 3.7, -202]], look: [[0, 10, -226], [0, 9, -226]] },
  // 7 · the small square Hall of Union
  { pos: [[16, 3.6, -244], [9, 3.6, -250]], look: [[0, 7, -268], [0, 6.5, -268]] },
  // 8 · Palace of Earthly Tranquility
  { pos: [[-16, 3.6, -281], [-7, 3.6, -288]], look: [[0, 9, -310], [0, 8, -310]] },
  // 9 · into the Imperial Garden
  { pos: [[22, 2.1, -380], [8, 2.2, -393]], look: [[0, 6, -425], [0, 6.5, -425]] },
];

const START = 0;
const END = 0.93;
const total = RAW.reduce((s, r) => s + (r.w ?? 1), 0);
let acc = START;
export const SHOTS: Shot[] = RAW.map((r) => {
  const from = acc;
  acc += ((END - START) * (r.w ?? 1)) / total;
  return { from, to: acc, pos: r.pos, look: r.look };
});

/** Which shot is on at progress p, and how far through it (0–1). */
export function shotAt(p: number) {
  const idx = SHOTS.findIndex((s) => p < s.to);
  const k = idx < 0 ? SHOTS.length - 1 : idx;
  const s = SHOTS[k] ?? SHOTS[SHOTS.length - 1]!;
  return { i: k, t: Math.min(1, Math.max(0, (p - s.from) / (s.to - s.from))) };
}

/** Opacity of the black dip between shots (peaks at each cut). */
export function cutDip(p: number) {
  const w = 0.006;
  let d = 0;
  for (let i = 1; i < SHOTS.length; i++) d = Math.max(d, 1 - Math.abs(p - SHOTS[i]!.from) / w);
  return Math.max(0, d);
}
