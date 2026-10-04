import { useEffect, useMemo, useRef, useState } from "react";
import type { ChapterData, SpreadKey } from "../content/content";
import { play } from "../lib/audio";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { reducedMotion } from "../lib/motion";

/*
 * An ink map of Eurasia in the manner of an old chart (not geographically exact),
 * told as a journey while the reader scrolls: the chart pans toward each leg of
 * this chapter's route, the leg draws itself behind a travelling ink bead, the
 * place it reaches blooms with rings, and the list beside the map lights up
 * the stop with its date.
 */

/** Equirectangular projection of lon −12…150°, lat 0…62° onto a 1000 × 420 chart. */
const px = (lon: number, lat: number) => ({ x: ((lon + 12) / 162) * 1000, y: ((62 - lat) / 62) * 420 });

const NODES: Record<SpreadKey, { x: number; y: number; name: string; anchor?: "start" | "end"; dy?: number }> = {
  spain: { ...px(-0.5, 39), name: "Tây Ban Nha", anchor: "end" },
  italy: { ...px(12.9, 43.3), name: "Ý" },
  europe: { ...px(9, 50), name: "Châu Âu" },
  arab: { ...px(39.8, 21.4), name: "Ả Rập", anchor: "end" },
  baghdad: { ...px(44.4, 33.3), name: "Baghdad" },
  samarkand: { ...px(67, 39.6), name: "Samarkand" },
  mongol: { ...px(102.8, 47.2), name: "Mông Cổ" },
  china: { ...px(112.4, 34.6), name: "Trung Hoa", anchor: "end", dy: 6 },
  korea: { ...px(126.9, 37.5), name: "Triều Tiên", dy: -22 },
  japan: { ...px(135.8, 34.7), name: "Nhật Bản", dy: 30 },
  vietnam: { ...px(105.8, 21), name: "Việt Nam", anchor: "end" },
};

type LL = [number, number];
const toPath = (pts: LL[]) =>
  pts.map(([lo, la], i) => {
    const p = px(lo, la);
    return `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(" ") + " Z";

// Simplified coastlines (lon, lat), clipped to the chart.
const EURASIA: LL[] = [
  [5, 62], [5, 58.5], [8, 57], [10.5, 57.5], [10, 54.5], [8.5, 53.5], [4.5, 52.5], [1.5, 51], [-1.5, 49.5], [-4.5, 48.5],
  [-1.5, 46.5], [-1.8, 43.4], [-8, 43.5], [-9.3, 42.5], [-9, 38.7], [-8.8, 37], [-6, 36.2], [-2, 36.8], [0, 38.8], [0.3, 40],
  [3.2, 42], [3.5, 43.3], [6, 43.1], [7.5, 43.8], [10.2, 44], [12.3, 41.8], [15.6, 38.2], [16.5, 39.2], [18.5, 40.2], [16, 41.5],
  [13.5, 43.6], [12.3, 45.3], [13.7, 45.6], [15, 44.5], [19, 41.8], [20, 40], [21, 38], [22.5, 36.5], [23.5, 38], [23, 40.5],
  [26, 40.8], [26.5, 39.5], [27.3, 37], [30, 36.3], [36, 36.8], [35.8, 34], [34.5, 31.5], [32.3, 31.2], [29.9, 31.2], [25, 31.7],
  [20, 32], [19, 30.3], [15, 32.3], [11, 33.5], [10.2, 36.9], [3, 36.8], [-2, 35.1], [-5.9, 35.8], [-9.6, 30.4], [-12, 27],
  [-12, 0], [42, 0], [51, 11.8], [43.3, 12.5], [45, 12.8], [52, 15.5], [55, 17], [57.8, 19], [59.8, 22.5], [56.3, 26.3],
  [57, 25.7], [61.5, 25.1], [66.5, 25.4], [68.5, 23.5], [70, 21], [72.8, 19], [74.5, 15], [76.3, 9.8], [77.5, 8.1], [80, 9.8],
  [80.3, 13], [82.3, 16.5], [86.5, 20], [88.5, 21.7], [91.8, 22.3], [94.3, 16], [97.6, 16.5], [98.5, 10], [100.3, 6], [103.5, 1.3],
  [104.3, 1.5], [103.4, 4], [102.2, 6.2], [100.3, 8.5], [99.3, 10.5], [100.3, 13.5], [102, 12.5], [104.5, 10.5], [105, 8.6], [106.7, 10.2],
  [109.2, 11.8], [109.2, 13.8], [108.8, 15.5], [107, 17], [105.7, 19], [106.8, 20.8], [108, 21.5], [110.3, 20.3], [111, 21.5], [113.5, 22.2],
  [116.5, 23], [118.5, 24.5], [120, 26.5], [121.9, 29.9], [121.9, 31.2], [120.5, 33], [119.3, 34.8], [120.8, 36.5], [122.5, 37.3], [119, 37.3],
  [118, 38.5], [119.5, 39.8], [121.5, 40.9], [124.3, 39.9], [125.2, 37.8], [126.5, 34.5], [129.3, 35.2], [129.5, 36.5], [128.8, 38.5], [129.8, 40.9],
  [132, 43], [138, 46.5], [140.5, 50], [141.5, 53], [137, 54], [141, 58.5], [150, 59.5], [150, 62],
];
const ISLANDS: LL[][] = [
  [[-5.7, 50], [1.4, 51.2], [1.7, 52.6], [0, 53.5], [-1.5, 55], [-2, 56], [-3.5, 58.5], [-5, 58.5], [-5.5, 56], [-3, 54.8], [-3, 53.5], [-4.6, 52.8], [-5, 51.7], [-3, 51.4]],
  [[-6, 52], [-6, 54], [-8, 55.2], [-10, 54], [-10, 51.6], [-8, 51.6]],
  [[130, 31.3], [131.5, 31.5], [132, 33.8], [135, 33.5], [136.9, 34.3], [139.8, 35], [140.8, 35.7], [141, 38], [142, 39.6], [141.5, 41.4], [140, 40.5], [139.8, 38.3], [137, 37], [136, 36], [133, 35.5], [131, 34.4], [129.8, 33.3]],
  [[140, 41.5], [141.5, 42.6], [143.5, 42], [145.5, 43.3], [142, 45.4], [141.5, 43.5], [140.4, 43]],
  [[120.1, 23], [121, 21.9], [122, 25], [121.5, 25.3], [120.2, 24]],
  [[79.8, 6], [80, 9.8], [81.9, 7.5], [81, 6]],
  [[95.3, 5.6], [97.5, 5.2], [100, 2.5], [103.8, 0], [101, 0], [98, 2], [95.5, 4.5]],
  [[109.5, 1], [111, 1.5], [114, 4.6], [116, 6.9], [118.9, 5.3], [118, 1], [109.5, 0.5]],
];
const SEAS: LL[][] = [
  [[28, 41.3], [28.6, 43.5], [30.5, 46.5], [33, 46], [33.5, 44.5], [36.5, 45.3], [38.5, 47], [39.5, 47], [38, 45], [41.7, 41.6], [38, 40.9], [34, 42], [31, 41.1]],
  [[47, 44], [49.5, 46.3], [53, 46.9], [51.3, 44.5], [53.1, 42], [53.9, 40], [53.9, 37.3], [51, 36.8], [49, 38], [49.6, 40.3], [47.5, 42.5]],
  [[32.6, 29.9], [35.2, 24.5], [38.3, 18.5], [42.8, 12.6], [43.4, 12.8], [42.7, 15.5], [40.5, 20], [38.6, 22.5], [35.2, 28.2], [34.9, 29.5]],
  [[48, 30], [50, 30.2], [51.3, 28], [54.5, 26.6], [56.3, 27.2], [56.4, 26.2], [56, 24.8], [54.2, 24.2], [51.6, 24.5], [51, 26], [50, 26], [49.5, 27.2], [48.4, 28.5]],
];

function legPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - Math.min(70, Math.abs(b.x - a.x) * 0.18 + 12);
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

interface Leg {
  from: SpreadKey;
  to: SpreadKey;
  d: string;
}

const FULL = { x: 0, y: 0, w: 1000, h: 420 };

export function SpreadMap({ chapter }: { chapter: ChapterData }) {
  const track = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const legEls = useRef<(SVGPathElement | null)[]>([]);
  const bead = useRef<SVGGElement>(null);
  const still = reducedMotion();
  const route = chapter.spread.route;

  // each place is reached from the most plausible earlier stop on the route
  const legs = useMemo(() => {
    const PREFER: Partial<Record<SpreadKey, SpreadKey[]>> = {
      korea: ["china"],
      japan: ["korea", "china"],
      samarkand: ["china"],
      baghdad: ["samarkand", "china"],
      arab: ["mongol", "baghdad", "china"],
      spain: ["baghdad", "arab"],
      italy: ["spain", "arab"],
      europe: ["mongol", "arab", "china"],
      mongol: ["china"],
      vietnam: ["china"],
    };
    const seen = new Set<SpreadKey>();
    const out: Leg[] = [];
    route.forEach((r, i) => {
      if (i > 0) {
        const from = (PREFER[r.key] ?? ["china"]).find((k) => seen.has(k)) ?? "china";
        out.push({ from, to: r.key, d: legPath(NODES[from], NODES[r.key]) });
      }
      seen.add(r.key);
    });
    if (chapter.spread.reverse) out.push({ from: "vietnam", to: "china", d: legPath(NODES.vietnam, NODES.china) });
    return out;
  }, [route, chapter.spread.reverse]);

  /** How many places have been reached (0 = only the origin). */
  const [reached, setReached] = useState(still ? route.length : 0);
  const lastReached = useRef(0);
  const view = useRef({ ...FULL });

  useTrack(
    track,
    (p) => {
      if (still) return;
      // 8% of the track to settle on the chart, then one even share per leg, 10% to rest at the end
      const t = Math.max(0, Math.min(1, (p - 0.08) / 0.82)) * legs.length;
      const active = Math.min(legs.length - 1, Math.floor(t));
      let bx = NODES.china.x;
      let by = NODES.china.y;
      legs.forEach((_, i) => {
        const el = legEls.current[i];
        if (!el) return;
        const k = Math.max(0, Math.min(1, t - i));
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        el.style.strokeDashoffset = `${1 - e}`;
        if (i === active) {
          const pt = el.getPointAtLength(el.getTotalLength() * e);
          bx = pt.x;
          by = pt.y;
        }
      });
      if (bead.current) {
        bead.current.style.transform = `translate(${bx}px, ${by}px)`;
        bead.current.style.opacity = t > 0.02 && t < legs.length - 0.02 ? "1" : "0";
      }
      // the chart leans toward the bead: zoom in a little, keep the whole leg in view
      const zoom = 1 + 0.3 * Math.sin(Math.min(1, t / Math.max(1, legs.length)) * Math.PI) * (legs.length > 0 ? 1 : 0);
      const w = FULL.w / zoom;
      const h = FULL.h / zoom;
      const tx = Math.max(0, Math.min(FULL.w - w, bx - w / 2));
      const ty = Math.max(0, Math.min(FULL.h - h, by - h / 2));
      const v = view.current;
      v.x += (tx - v.x) * 0.35;
      v.y += (ty - v.y) * 0.35;
      v.w += (w - v.w) * 0.35;
      v.h += (h - v.h) * 0.35;
      svg.current?.setAttribute("viewBox", `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
      const n = Math.min(route.length, 1 + legs.filter((_, i) => t - i >= 0.97 && legs[i]!.to !== "china").length);
      if (n !== lastReached.current) {
        if (n > lastReached.current) play("stamp", 200);
        lastReached.current = n;
        setReached(n);
      }
    },
    [legs, route.length, still],
  );

  useEffect(() => {
    const el = () => track.current;
    const offs = [
      register({ id: `${chapter.id}-map-0`, label: `${chapter.title} · Lan truyền`, getY: () => trackY(el(), 0.05) }),
      ...legs.map((_, i) =>
        register({ id: `${chapter.id}-map-${i + 1}`, label: `${chapter.title} · ${route[i + 1]?.place ?? "Đi ngược về Trung Hoa"}`, getY: () => trackY(el(), 0.08 + (0.82 * (i + 1)) / legs.length) }),
      ),
    ];
    return () => offs.forEach((f) => f());
  }, [chapter, legs, route]);

  return (
    <section ref={track} className={`spread ${still ? "spread--still" : ""}`} style={{ height: still ? "auto" : `${100 + legs.length * 55}vh` }} aria-labelledby={`${chapter.id}-spread`} data-dragon="95,5;96,95">
      <div className="spread__sticky">
        <div className="spread__grid">
          <div className="map-card">
            <svg ref={svg} viewBox="0 0 1000 420" className="map__svg" role="img" aria-label={`Bản đồ lan truyền: ${route.map((r) => `${r.place} ${r.when}`).join(", ")}`}>
              <defs>
                <pattern id={`${chapter.id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                  <line x1="0" y1="0" x2="0" y2="7" className="map__hatch" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="1000" height="420" className="map__water" />
              <g className="map__land">
                <path d={toPath(EURASIA)} />
                {ISLANDS.map((d, i) => (
                  <path key={i} d={toPath(d)} />
                ))}
              </g>
              <g className="map__sea">
                {SEAS.map((d, i) => (
                  <path key={i} d={toPath(d)} />
                ))}
              </g>
              <g className="map__legs">
                {legs.map((l, i) => (
                  <g key={i}>
                    <path className="map__leg-shadow" d={l.d} />
                    <path
                      ref={(el) => {
                        legEls.current[i] = el;
                      }}
                      className={`map__leg ${l.to === "china" ? "map__reverse" : ""}`}
                      d={l.d}
                      pathLength={1}
                      style={still ? { strokeDashoffset: 0 } : undefined}
                    />
                    <path className="map__flow" d={l.d} style={{ opacity: still || reached > i + 1 || (l.to === "china" && reached >= route.length) ? 1 : 0 }} />
                  </g>
                ))}
              </g>
              <g ref={bead} className="map__bead" style={{ opacity: 0 }}>
                <circle r="16" className="map__bead-glow" />
                <circle r="6.5" />
              </g>
              <g className="map__nodes">
                {route.map((r, i) => {
                  const n = NODES[r.key];
                  const anchor = n.anchor ?? "start";
                  const dx = anchor === "end" ? -14 : 14;
                  const dy = n.dy ?? 0;
                  const on = i < reached;
                  return (
                    <g key={r.key + i} className={`map__node ${on ? "is-on" : ""} ${i === reached - 1 ? "is-new" : ""}`}>
                      <circle cx={n.x} cy={n.y} r="16" className="map__ring" />
                      <circle cx={n.x} cy={n.y} r="16" className="map__ring map__ring--2" />
                      <circle cx={n.x} cy={n.y} r={i === 0 ? 7.5 : 5.5} className="map__dot" />
                      <text x={n.x + dx} y={n.y - 8 + dy} textAnchor={anchor} className="map__place">
                        {r.place}
                      </text>
                      <text x={n.x + dx} y={n.y + 15 + dy} textAnchor={anchor} className="map__when">
                        {r.when}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
          <div className="spread__side">
            <h3 id={`${chapter.id}-spread`} className="h2">
              Lan truyền
            </h3>
            <ol className="spread__route">
              {route.map((r, i) => (
                <li key={r.key + i} className={i < reached ? (i === reached - 1 ? "is-current" : "is-on") : ""}>
                  <span className="spread__dot" aria-hidden />
                  <span className="spread__place">{r.place}</span>
                  <span className="spread__when">{r.when}</span>
                </li>
              ))}
            </ol>
            {(chapter.spread.vietnam || chapter.spread.reverse || chapter.spread.note) && (
              <div className="map__notes">
                {chapter.spread.vietnam && <p className="spread__vn">{chapter.spread.vietnam}</p>}
                {chapter.spread.reverse && <p className={`spread__vn ${reached >= route.length ? "is-on" : ""}`}>{chapter.spread.reverse}</p>}
                {chapter.spread.note && <p className="map__caveat">{chapter.spread.note}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
