import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, isMobile, reducedMotion } from "../lib/motion";
import { play } from "../lib/audio";

/*
 * One gold dragon runs down the whole page (design.md §7), drawn after the
 * dragons of the Lý dynasty (Đại Việt, 11th–12th c.): a long, slender,
 * serpentine body in even waves that tapers to a fine tail; a band of
 * ladder-like belly scales along one side and small scales on the back; thin
 * flame streamers trailing from the body and the elbows; long legs with curved
 * talons; a head with a rising flame mane, a curled snout and a long tongue
 * that holds up a flaming pearl.
 *
 * The body is drawn as the reader scrolls; the head always rides the tip.
 * Waypoints come from elements with data-dragon="x,y[;x,y…]" — x in % of the
 * page width, y in % of that element's height. They are joined with a
 * Catmull-Rom spline, then given the regular Lý undulation.
 * Legs grow at [data-dragon-claw]; the eye is dotted at [data-dragon-eye].
 */

interface Pt {
  x: number;
  y: number;
}

interface Body {
  /** Polyline samples along the body: position and arc length. */
  xs: Float32Array;
  ys: Float32Array;
  ss: Float32Array;
  /** Running maximum of ys, for a monotonic y → length lookup. */
  maxY: Float32Array;
  total: number;
  /** The full-width body, from the end of the tail taper to the head. */
  d: string;
  /** The tapering tail as a filled outline. */
  tail: string;
}

/** Length of the tapering tail, in px. */
const TAIL = 420;
/** Half width of the gold body (the dark outline adds 2 px). */
const HALF = 10.5;

/** Catmull-Rom through the waypoints, sampled every ~6 px, with a regular sine undulation. */
function buildBody(pts: Pt[], amp: number, wave: number, taper: number): Body | null {
  if (pts.length < 2) return null;
  const raw: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    const n = Math.max(4, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 6));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      raw.push({
        x: u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x,
        y: u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y,
      });
    }
  }
  const m = raw.length;
  const s0 = new Float32Array(m);
  for (let i = 1; i < m; i++) s0[i] = s0[i - 1]! + Math.hypot(raw[i]!.x - raw[i - 1]!.x, raw[i]!.y - raw[i - 1]!.y);
  const len0 = s0[m - 1]!;
  // offset along the normal: even waves, fading in at the tail and out at the head
  const xs = new Float32Array(m);
  const ys = new Float32Array(m);
  for (let i = 0; i < m; i++) {
    const [tx, ty] = tangent(raw, i);
    const s = s0[i]!;
    const env = smooth(Math.min(s, len0 - s) / 320);
    const off = amp * env * Math.sin((s / wave) * Math.PI * 2);
    xs[i] = raw[i]!.x - ty * off;
    ys[i] = raw[i]!.y + tx * off;
  }
  const ss = new Float32Array(m);
  const maxY = new Float32Array(m);
  let top = -Infinity;
  for (let i = 0; i < m; i++) {
    if (i > 0) ss[i] = ss[i - 1]! + Math.hypot(xs[i]! - xs[i - 1]!, ys[i]! - ys[i - 1]!);
    top = Math.max(top, ys[i]!);
    maxY[i] = top;
  }
  const total = ss[m - 1]!;
  // the body stroke starts where the tail taper ends
  let d = "";
  for (let i = 0; i < m; i++) {
    if (ss[i]! < taper && i < m - 2) continue;
    d += `${d ? "L" : "M"}${xs[i]!.toFixed(1)} ${ys[i]!.toFixed(1)}`;
  }
  // tail: a filled outline narrowing to a point
  const pts2 = { x: xs, y: ys };
  const upper: string[] = [];
  const lower: string[] = [];
  for (let i = 0; i < m && ss[i]! <= taper + 6; i++) {
    const [tx, ty] = tangent2(pts2, i);
    const u = ss[i]! / taper;
    const hw = 0.6 + (HALF + 0.9) * Math.pow(Math.min(1, u), 0.7);
    upper.push(`${(xs[i]! - ty * hw).toFixed(1)} ${(ys[i]! + tx * hw).toFixed(1)}`);
    lower.push(`${(xs[i]! + ty * hw).toFixed(1)} ${(ys[i]! - tx * hw).toFixed(1)}`);
  }
  const tail = upper.length > 2 ? `M${upper.join("L")}L${lower.reverse().join("L")}Z` : "";
  return { xs, ys, ss, maxY, total, d, tail };
}

function tangent(raw: Pt[], i: number): [number, number] {
  const a = raw[Math.max(0, i - 1)]!;
  const b = raw[Math.min(raw.length - 1, i + 1)]!;
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return [(b.x - a.x) / l, (b.y - a.y) / l];
}

function tangent2(p: { x: Float32Array; y: Float32Array }, i: number): [number, number] {
  const a = Math.max(0, i - 1);
  const b = Math.min(p.x.length - 1, i + 1);
  const dx = p.x[b]! - p.x[a]!;
  const dy = p.y[b]! - p.y[a]!;
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

function smooth(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function search(arr: Float32Array, v: number) {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid]! < v) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Arc length at which the drawn body first reaches page position y. */
function lengthAtY(b: Body, y: number) {
  return b.ss[search(b.maxY, y)]!;
}

function pointAt(b: Body, L: number) {
  const i = Math.max(1, search(b.ss, L));
  const j = Math.max(0, i - 3);
  const k = Math.min(b.xs.length - 1, i + 3);
  const angle = (Math.atan2(b.ys[k]! - b.ys[j]!, b.xs[k]! - b.xs[j]!) * 180) / Math.PI;
  return { x: b.xs[i]!, y: b.ys[i]!, angle };
}

/** Sub-polyline from arc length `from` to `to`, one vertex every `every` px (for markers). */
function slice(b: Body, from: number, to: number, every: number) {
  const out: string[] = [];
  let next = from;
  for (let i = search(b.ss, from); i < b.xs.length && b.ss[i]! <= to; i++) {
    if (b.ss[i]! < next) continue;
    out.push(`${b.xs[i]!.toFixed(1)} ${b.ys[i]!.toFixed(1)}`);
    next = b.ss[i]! + every;
  }
  return out.length > 2 ? `M${out.join("L")}` : "";
}

/** Scales are drawn in chunks, so only the chunk at the tip is rebuilt while scrolling. */
const CHUNK = 900;
/** A flame streamer trails from the back every so often. */
const WISP_EVERY = 520;

export function Dragon() {
  const svg = useRef<SVGSVGElement>(null);
  const layers = useRef<(SVGPathElement | null)[]>([]);
  const head = useRef<SVGGElement>(null);
  const tailEl = useRef<SVGGElement>(null);
  const bellyEls = useRef<(SVGPathElement | null)[]>([]);
  const backEls = useRef<(SVGPathElement | null)[]>([]);
  const [body, setBody] = useState<Body | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [legs, setLegs] = useState<number[]>([]);
  const [hasEye, setHasEye] = useState(false);
  const mobile = typeof window !== "undefined" && isMobile();

  // ---------- measure waypoints and build the body ----------
  useEffect(() => {
    const build = () => {
      const w = document.documentElement.clientWidth;
      const h = document.documentElement.scrollHeight;
      const mob = isMobile();
      const pts: Pt[] = [];
      document.querySelectorAll<HTMLElement>("[data-dragon]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        (el.dataset["dragon"] ?? "").split(";").forEach((pair) => {
          const [px, py] = pair.split(",").map(Number);
          if (px === undefined || py === undefined || Number.isNaN(px) || Number.isNaN(py)) return;
          pts.push(mob ? { x: 14, y: top + (r.height * py) / 100 } : { x: (w * px) / 100, y: top + (r.height * py) / 100 });
        });
      });
      pts.sort((a, b) => a.y - b.y);
      const legYs: number[] = [];
      if (!mob) {
        document.querySelectorAll<HTMLElement>("[data-dragon-claw]").forEach((el) => {
          const r = el.getBoundingClientRect();
          const [, py] = (el.dataset["dragonClaw"] ?? "92,50").split(",").map(Number);
          legYs.push(r.top + window.scrollY + (r.height * (py ?? 50)) / 100);
        });
      }
      const e = document.querySelector<HTMLElement>("[data-dragon-eye]");
      if (e && !mob) {
        // arrive level, so the head's own eye lands on the marked spot
        const r = e.getBoundingClientRect();
        const ex = r.left + r.width / 2;
        const ey = r.top + window.scrollY + r.height / 2;
        pts.push({ x: ex - 250, y: ey + 28.7 }, { x: ex - 67, y: ey + 28.7 });
      }
      const b = buildBody(pts, mob ? 5 : 24, mob ? 150 : 320, mob ? 0 : TAIL);
      setSize({ w, h });
      setBody(b);
      setLegs(b ? legYs.map((y) => lengthAtY(b, y)) : []);
      setHasEye(!!e && !mob);
    };
    const debounced = () => {
      window.clearTimeout(t);
      t = window.setTimeout(build, 200);
    };
    let t = 0;
    build();
    ScrollTrigger.addEventListener("refresh", debounced);
    window.addEventListener("resize", debounced);
    const ro = new ResizeObserver(debounced);
    ro.observe(document.body);
    return () => {
      ScrollTrigger.removeEventListener("refresh", debounced);
      window.removeEventListener("resize", debounced);
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  const chunks = body ? Math.ceil(body.total / CHUNK) : 0;
  const wisps = body && !mobile ? Array.from({ length: Math.max(0, Math.floor((body.total - 900) / WISP_EVERY)) }, (_, i) => 600 + i * WISP_EVERY) : [];

  // ---------- draw by scroll ----------
  useEffect(() => {
    if (!body) return;
    const total = body.total;
    const taper = mobile ? 0 : TAIL;
    const bodyLen = total - taper;
    const strokes = layers.current.filter(Boolean) as SVGPathElement[];
    strokes.forEach((p) => (p.style.strokeDasharray = `${bodyLen} ${bodyLen + 10}`));
    const bellyStep = mobile ? 0 : 6;
    const backStep = mobile ? 0 : 11;
    const fill = (i: number, upTo: number) => {
      const from = Math.max(i * CHUNK, taper);
      const to = Math.min(upTo, i * CHUNK + CHUNK);
      const be = bellyEls.current[i];
      const ba = backEls.current[i];
      if (be && bellyStep) be.setAttribute("d", to > from ? slice(body, from, to, bellyStep) : "");
      if (ba && backStep) ba.setAttribute("d", to > from ? slice(body, from, to, backStep) : "");
    };
    const place = (els: SVGGElement[], at: number[]) =>
      els.forEach((el, i) => {
        const p = pointAt(body, at[i] ?? 0);
        el.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${p.angle})`);
      });
    const legEls = Array.from(svg.current?.querySelectorAll<SVGGElement>(".ly-leg") ?? []);
    const wispEls = Array.from(svg.current?.querySelectorAll<SVGGElement>(".ly-wisp") ?? []);
    place(legEls, legs);
    place(wispEls, wisps);
    if (reducedMotion()) {
      strokes.forEach((p) => (p.style.strokeDashoffset = "0"));
      for (let i = 0; i < chunks; i++) fill(i, total);
      [...legEls, ...wispEls].forEach((el) => el.classList.add("is-on"));
      return;
    }
    let shown = -1;
    let filledTo = 0; // chunks below this index are complete
    let eyeDone = false;
    const tick = () => {
      const target = lengthAtY(body, window.scrollY + window.innerHeight * 0.62);
      const before = shown;
      shown = shown < 0 ? target : shown + (target - shown) * 0.12;
      if (Math.abs(target - shown) < 0.5) shown = target;
      if (shown === before) return;
      strokes.forEach((p) => (p.style.strokeDashoffset = `${bodyLen - Math.max(0, shown - taper)}`));
      // scales: complete chunks once, rebuild only the one at the tip
      const tip = Math.min(chunks - 1, Math.floor(shown / CHUNK));
      if (tip < filledTo) {
        for (let i = tip; i < Math.min(chunks, filledTo + 1); i++) fill(i, 0);
        filledTo = tip;
      }
      while (filledTo < tip) fill(filledTo++, total);
      fill(tip, shown);
      if (head.current) {
        const p = pointAt(body, Math.max(1, shown));
        head.current.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${p.angle})`);
        head.current.style.opacity = shown > 40 ? "1" : "0";
      }
      tailEl.current?.classList.toggle("is-on", shown > taper * 0.6);
      legEls.forEach((el, i) => el.classList.toggle("is-on", shown >= (legs[i] ?? Infinity)));
      wispEls.forEach((el, i) => el.classList.toggle("is-on", shown >= (wisps[i] ?? Infinity) + 30));
      if (hasEye && !eyeDone && shown >= total - 2) {
        eyeDone = true;
        head.current?.classList.add("is-dotted");
        play("stamp");
      } else if (eyeDone && shown < total - 60) {
        eyeDone = false;
        head.current?.classList.remove("is-dotted");
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
    // wisps derive from body
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, legs, hasEye, chunks, mobile]);

  return (
    <svg
      ref={svg}
      className={`dragon ${mobile ? "dragon--mobile" : ""} ${reducedMotion() ? "dragon--still" : ""}`}
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="ly-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7e3a3" />
          <stop offset="0.45" stopColor="#d6a84d" />
          <stop offset="1" stopColor="#9a6c22" />
        </linearGradient>
        <radialGradient id="ly-pearl" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="0.6" stopColor="#f3dfae" />
          <stop offset="1" stopColor="#b8903a" />
        </radialGradient>
        {/* belly: a pale band on one side, crossed by ladder-like scales */}
        <marker id="ly-belly" markerUnits="userSpaceOnUse" markerWidth="30" markerHeight="30" refX="15" refY="15" orient="auto" viewBox="0 0 30 30">
          <path className="ly-belly-band" d="M10.5 17.5 H19.5 V25 H10.5 Z" />
          <path className="ly-belly-line" d="M10 17.5 H20 M15 17.5 V25.3" />
        </marker>
        {/* small overlapping scales on the back */}
        <marker id="ly-back" markerUnits="userSpaceOnUse" markerWidth="30" markerHeight="30" refX="15" refY="15" orient="auto" viewBox="0 0 30 30">
          <path className="ly-back-scale" d="M10 6 Q 15 7 15.8 11.5 M12 9.5 Q 15.8 10.4 16.4 13.6" />
        </marker>
      </defs>
      {/* the tapering tail */}
      {!mobile && (
        <g ref={tailEl} className="ly-tail">
          <path className="ly-fill ly-tail-poly" d={body?.tail} />
        </g>
      )}
      {/* soft cast shadow, dark outline, gold body, lit back line */}
      <path ref={(el) => void (layers.current[0] = el)} d={body?.d} className="dragon__shadow" transform="translate(5 8)" />
      <path ref={(el) => void (layers.current[1] = el)} d={body?.d} className="dragon__outline" />
      <path ref={(el) => void (layers.current[2] = el)} d={body?.d} className="dragon__body" />
      <path ref={(el) => void (layers.current[3] = el)} d={body?.d} className="dragon__sheen" transform="translate(-1 -2.2)" />
      {Array.from({ length: chunks }, (_, i) => (
        <path key={`b${i}`} ref={(el) => void (bellyEls.current[i] = el)} className="dragon__marks" markerMid="url(#ly-belly)" />
      ))}
      {Array.from({ length: chunks }, (_, i) => (
        <path key={`k${i}`} ref={(el) => void (backEls.current[i] = el)} className="dragon__marks" markerMid="url(#ly-back)" />
      ))}
      {wisps.map((_, i) => (
        <g key={i} className="ly-wisp">
          <g transform={i % 3 === 2 ? "scale(0.8 1)" : undefined}>
            <Wisp />
          </g>
        </g>
      ))}
      {legs.map((_, i) => (
        <g key={i} className="ly-leg">
          <Leg />
        </g>
      ))}
      {!mobile && (
        <g ref={head} className="dragon__head">
          <LyHead />
        </g>
      )}
    </svg>
  );
}

/**
 * Lý-style head in profile, facing +x, origin on the neck: a mane of flames
 * rising and streaming back, a curled snout, an open mouth whose long tongue
 * curls up to hold a flaming pearl. The eye is left empty until the end.
 */
function LyHead() {
  return (
    <g className="ly-head" transform="scale(1.4)">
      {/* flame mane: tongues rising from the crown and streaming back */}
      <path className="ly-fill" d="M22 -22 C 6 -40 -16 -40 -30 -48 C -42 -55 -60 -57 -74 -51 C -83 -47 -88 -38 -85 -30 C -81 -38 -73 -41 -67 -37 C -61 -33 -63 -27 -69 -25 C -57 -22 -47 -31 -36 -31 C -20 -31 2 -25 22 -22 Z" />
      <path className="ly-fill" d="M26 -25 C 24 -46 12 -62 -6 -74 C 3 -62 3 -53 -3 -47 C -10 -59 -24 -66 -40 -64 C -27 -56 -21 -45 -19 -35 C -8 -31 9 -27 26 -25 Z" />
      <path className="ly-fill" d="M34 -28 C 38 -46 34 -62 22 -76 C 34 -70 42 -58 44 -46 C 48 -58 58 -64 70 -64 C 58 -56 52 -44 50 -30 Z" />
      <path className="ly-fill" d="M16 -17 C 2 -28 -18 -26 -34 -30 C -48 -33 -62 -30 -70 -22 C -76 -16 -76 -8 -72 -4 C -72 -12 -66 -16 -60 -14 C -55 -12 -56 -7 -61 -5 C -50 -4 -44 -13 -34 -15 C -18 -18 0 -16 16 -17 Z" />
      <path className="ly-fill" d="M10 -12 C -6 -14 -22 -10 -34 -2 C -44 4 -50 12 -48 20 C -44 12 -38 9 -33 11 C -28 13 -30 18 -34 20 C -24 18 -20 8 -12 4 C -4 0 4 -6 10 -12 Z" />
      <path className="ly-line" d="M12 -25 C -8 -34 -30 -40 -56 -46 M18 -28 C 12 -44 2 -56 -8 -64 M40 -32 C 40 -44 36 -56 28 -66 M6 -19 C -12 -22 -32 -22 -52 -22 M2 -13 C -12 -10 -24 -4 -32 4" />
      {/* beard */}
      <path className="ly-fill" d="M30 12 C 22 26 8 34 -10 40 C -22 44 -34 43 -42 36 C -34 38 -26 36 -20 31 C -29 32 -36 28 -39 22 C -30 26 -19 24 -8 18 C 6 12 18 10 30 12 Z" />
      {/* whiskers: long S-curves trailing from the snout */}
      <path className="ly-line" d="M88 -4 C 80 14 60 26 40 30 C 20 34 2 44 -6 58 C -10 66 -20 70 -28 66" style={{ strokeWidth: 1.7 }} />
      <path className="ly-line" d="M84 -20 C 76 -36 60 -46 44 -52 C 30 -57 22 -66 24 -76 C 26 -82 34 -82 36 -76" style={{ strokeWidth: 1.5 }} />
      {/* lower jaw, hinged at the cheek */}
      <path className="ly-fill" d="M20 4 C 40 6 70 12 92 17 C 101 19 103 25 96 27 C 90 28 84 25 78 25 C 58 23 36 18 16 12 Z" />
      <path className="ly-line" d="M96 27 C 101 31 99 37 92 37" />
      {/* mouth */}
      <path className="ly-mouth" d="M44 -2 L 84 -4 C 90 2 92 10 92 17 C 74 12 58 6 44 -2 Z" />
      <path className="ly-tooth" d="M56 -3 l2 6 l2 -6 Z M67 -4 l2 6.5 l2 -6.5 Z M79 -4 l1.8 8 l1.8 -8 Z M64 12 l2 -6 l2 6 Z M76 15 l2 -7 l2 7 Z" />
      {/* the long tongue curling up to the pearl */}
      <path className="ly-tongue" d="M54 5 C 78 12 100 10 114 -2 C 124 -11 132 -12 138 -8 C 143 -5 146 -10 144 -16" />
      {/* skull and upper jaw */}
      <path className="ly-fill" d="M-8 -10 C 0 -20 12 -26 24 -27 C 32 -28 36 -33 44 -32 C 52 -31 55 -25 61 -23 C 71 -20 82 -19 94 -19 C 101 -19 105 -14 103 -9 C 99 -5 90 -4 82 -4 L 44 -2 C 30 1 14 4 -6 8 C -12 4 -12 -4 -8 -10 Z" />
      <path className="ly-line" d="M62 -16 C 72 -14 82 -14 92 -14 M-2 0 C 10 -2 22 -4 34 -4" />
      {/* the Lý snout: the upper lip drawn up into a tall curl */}
      <path className="ly-fill" d="M90 -19 C 99 -27 105 -40 101 -52 C 98 -63 85 -66 80 -57 C 76 -49 84 -42 90 -47 C 94 -51 90 -56 86 -54 C 97 -50 97 -35 84 -21 Z" />
      <circle className="ly-line" cx="97" cy="-13" r="2.6" />
      {/* cheek swirl, brow flame, fierce eye */}
      <path className="ly-line" d="M20 -11 C 24 -18 33 -16 31 -9 C 29 -4 22 -6 24 -11" />
      <path className="ly-fill" d="M32 -28 C 36 -41 50 -47 64 -43 C 55 -40 51 -35 49 -29 Z" />
      <path className="ly-eye" d="M36 -20 C 40 -27 52 -27 58 -21 C 52 -15 42 -15 36 -20 Z" />
      <circle className="ly-pupil" cx="48" cy="-20.5" r="3.3" />
      <path className="ly-line thick" d="M35 -21 C 40 -29 53 -29 59 -21" />
      {/* the flaming pearl on the tip of the tongue */}
      <g transform="translate(145 -26)">
        <path className="ly-flame" d="M-9 -2 C -15 -10 -12 -20 -4 -24 C -7 -16 -4 -12 0 -12 C 4 -12 7 -16 4 -24 C 12 -20 15 -10 9 -2 M0 -12 C -3 -20 1 -28 0 -36 C 5 -28 5 -20 2 -12" />
        <circle className="ly-pearl" r="8.5" />
        <path className="ly-line" d="M-4 -3 C -2 -6 2 -6 4 -3" />
      </g>
    </g>
  );
}

/** A long Lý leg: thigh and forearm, a flame streamer from the elbow, four curved talons. Hangs on the +y side. */
function Leg() {
  return (
    <g className="ly-leg-art" transform="translate(0 4) scale(1.55)">
      <path className="ly-fill" d="M-6 30 C -20 34 -34 46 -40 62 C -44 72 -40 80 -32 82 C -38 74 -36 66 -30 60 C -24 52 -14 44 -4 38 Z" />
      <path className="ly-line" d="M-10 36 C -22 44 -30 54 -34 66" />
      <path className="ly-limb-outline" d="M0 6 C -6 16 -8 26 -4 32 C 0 40 8 48 16 52" />
      <path className="ly-limb" d="M0 6 C -6 16 -8 26 -4 32 C 0 40 8 48 16 52" />
      <path className="ly-limb-line" d="M-1 12 l3 1 M-4 20 l3 1 M-4 28 l3 0 M1 38 l2 -2 M7 44 l2 -2" />
      <path className="ly-claw" d="M16 52 C 24 49 31 53 33 60 M16 52 C 24 54 29 60 29 68 M16 52 C 21 58 21 65 18 71 M16 52 C 11 56 7 59 4 60" />
    </g>
  );
}

/** A thin flame streamer rising from the back and trailing behind. */
function Wisp() {
  return (
    <g className="ly-wisp-art" transform="translate(0 -4) scale(1.45)">
      <path className="ly-fill" d="M3 -7 C -10 -22 -30 -26 -46 -40 C -58 -50 -62 -64 -54 -76 C -54 -62 -46 -54 -36 -50 C -48 -60 -46 -72 -38 -80 C -38 -66 -28 -56 -14 -46 C -4 -38 3 -24 7 -8 Z" />
      <path className="ly-line" d="M2 -12 C -10 -26 -24 -34 -38 -46" />
    </g>
  );
}
