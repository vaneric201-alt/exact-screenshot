import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { rewind, formatYear, type RewindPage } from "../content/content";
import { imageCredits } from "../content/imageCredits";
import { eraOf } from "../content/eras";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { isMobile, reducedMotion } from "../lib/motion";
import { setYear, setYearMode } from "../lib/year";
import { play } from "../lib/audio";
import { Seal } from "./Seal";
import { cornerKind } from "../content/cornerCuts";
import type { Book, SpreadContent } from "../three/book";

/*
 * The Great Rewind (design.md §8.3), as an open book in the middle of the
 * screen. Its pages turn back one by one — fast in the middle like a film on
 * fast-rewind, slowing for Qin, the Warring States and the Spring and Autumn
 * period — and stop on the bamboo slips. Then three pages turn forward to 105,
 * where the seal of Han lands. A silk timeline runs across the book; from the
 * four corners of the screen, four objects of the event on the open page
 * emerge — lifted out of their photographs, or torn from a page — and give
 * way to the next event's four as the pages turn.
 */

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface Seg {
  kind: "flip" | "hold" | "fwd" | "land";
  i: number;
  w: number;
}

function buildSegments(n: number) {
  const segs: Seg[] = [];
  for (let i = 0; i < n - 1; i++) {
    const slow = i >= n - 4;
    segs.push({ kind: "flip", i, w: i < 2 ? 1 : slow ? 1.8 : 0.55 });
  }
  segs.push({ kind: "hold", i: n - 1, w: 2.2 });
  for (let k = 0; k < rewind.forward.length; k++) segs.push({ kind: "fwd", i: k, w: 1.4 });
  segs.push({ kind: "land", i: 0, w: 1.6 });
  const total = segs.reduce((s, x) => s + x.w, 0);
  let acc = 0;
  const starts = segs.map((s) => {
    const a = acc;
    acc += s.w;
    return a / total;
  });
  return { segs, starts, total };
}

// the timeline ribbon: older years to the left, one even step per page so
// the crowded last two centuries stay readable; years between pages interpolate
const STEP = 150;
const TICK_YEARS = [...new Set([...rewind.pages, ...rewind.forward].map((p) => p.year))].sort((a, b) => a - b);
const xOf = (y: number) => {
  const ys = TICK_YEARS;
  if (y <= ys[0]!) return 0;
  for (let i = 1; i < ys.length; i++) {
    if (y <= ys[i]!) return (i - 1 + (y - ys[i - 1]!) / (ys[i]! - ys[i - 1]!)) * STEP;
  }
  return (ys.length - 1) * STEP;
};

/** The set of corner images for a page: corner-<key>-1…4 (scripts/images/corners.mjs). */
const FORWARD_KEYS: Record<string, string> = { "forward-qin": "fqin", "forward-xihan": "fxihan", "forward-caolun": "f105" };
const cornerKey = (p: RewindPage) => FORWARD_KEYS[p.image] ?? p.image.replace(/^rewind-/, "");

function toSpread(p: RewindPage): SpreadContent {
  const era = eraOf(p.year);
  const c = imageCredits[p.image];
  return {
    image: p.image,
    imageAlt: c?.alt ?? p.imageAlt,
    credit: c ? `${c.artist} · ${c.license} · Wikimedia Commons` : undefined,
    year: p.label,
    caption: p.caption,
    era: era.name,
    han: era.han,
    blank: p.image === "rewind-2026",
  };
}

export function GreatRewind() {
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const nowYear = useRef<HTMLSpanElement>(null);
  const stopLine = useRef<HTMLParagraphElement>(null);
  const book = useRef<Book | null>(null);
  const pending = useRef<[number, number, "back" | "forward"]>([0, 0, "back"]);
  const [mobile, setMobile] = useState(false);
  const [landed, setLanded] = useState(false);
  const [event, setEvent] = useState(cornerKey(rewind.pages[0]!));
  const eventTimer = useRef(0);
  const still = reducedMotion();
  useEffect(() => setMobile(isMobile()), []);

  const pages: RewindPage[] = useMemo(() => (mobile ? rewind.pages.filter((p) => p.mobile) : rewind.pages), [mobile]);
  const all = useMemo(() => [...pages, ...rewind.forward], [pages]);
  const plan = useMemo(() => buildSegments(pages.length), [pages.length]);
  const lastFlip = useRef(-1);

  // build the book when the section comes near
  useEffect(() => {
    const el = track.current;
    const c = canvas.current;
    if (!el || !c || still) return;
    let disposed = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || book.current) return;
        io.disconnect();
        void import("../three/book").then(({ createBook }) => {
          if (disposed) return;
          const b = createBook(c, all.map(toSpread));
          book.current = b;
          b.resize();
          b.show(...pending.current);
        });
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    const onResize = () => book.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      io.disconnect();
      window.removeEventListener("resize", onResize);
      book.current?.dispose();
      book.current = null;
    };
  }, [all, still]);

  useTrack(
    track,
    (p) => {
      if (still) return;
      const { segs, starts, total } = plan;
      const n = pages.length;
      let k = segs.length - 1;
      for (let s = 0; s < segs.length; s++)
        if (p < (starts[s + 1] ?? 1.0001)) {
          k = s;
          break;
        }
      const seg = segs[k]!;
      const local = Math.min(1, Math.max(0, (p - starts[k]!) / (seg.w / total)));

      // the book
      let state: [number, number, "back" | "forward"];
      if (seg.kind === "flip") state = [seg.i, local, "back"];
      else if (seg.kind === "hold") state = [n - 1, 0, "back"];
      else if (seg.kind === "fwd") state = [n - 1 + seg.i, Math.min(1, local * 1.4), "forward"];
      else state = [n - 1 + rewind.forward.length, 0, "forward"];
      pending.current = state;
      book.current?.show(...state);
      const turning = state[1] > 0.04 && state[1] < 0.96 ? state[0] * 2 + (state[2] === "forward" ? 1 : 0) : -1;
      if (turning >= 0 && turning !== lastFlip.current) play("paper");
      lastFlip.current = turning;

      // the year under the ribbon's centre
      let y = pages[0]!.year;
      let label: string | undefined;
      if (seg.kind === "flip") {
        const a = pages[seg.i]!;
        const b = pages[seg.i + 1]!;
        const t = easeOut(local);
        y = a.year + (b.year - a.year) * t;
        label = t < 0.02 ? a.label : t > 0.98 ? b.label : undefined;
      } else if (seg.kind === "hold") {
        y = pages[n - 1]!.year;
        label = pages[n - 1]!.label;
      } else {
        const j = seg.kind === "fwd" ? seg.i : rewind.forward.length - 1;
        const from = j === 0 ? pages[n - 1]!.year : rewind.forward[j - 1]!.year;
        const to = rewind.forward[j]!.year;
        const t = seg.kind === "fwd" ? easeOut(Math.min(1, local * 1.4)) : 1;
        y = from + (to - from) * t;
        label = t > 0.98 ? rewind.forward[j]!.label : undefined;
      }
      if (strip.current) strip.current.style.transform = `translateX(${-xOf(y)}px)`;
      if (nowYear.current) nowYear.current.textContent = label ?? formatYear(Math.round(y));
      // the big corner counter stays hidden here: the ribbon carries the year
      if (p >= 1) setYear(105, "corner");
      else setYearMode("hidden");

      // the corners follow the open page, once it has settled for a moment
      // (while pages fly past they would only flicker)
      const shownIndex = Math.min(all.length - 1, state[0] + (state[1] > 0.5 ? 1 : 0));
      const next = cornerKey(all[shownIndex]!);
      window.clearTimeout(eventTimer.current);
      eventTimer.current = window.setTimeout(() => setEvent((was) => (was === next ? was : next)), 180);
      preloadCorners(all[Math.min(all.length - 1, shownIndex + 1)]!);

      if (stopLine.current) stopLine.current.style.opacity = seg.kind === "hold" ? `${Math.min(1, local * 3)}` : "0";
      const isLanded = seg.kind === "land";
      setLanded((was) => (was === isLanded ? was : isLanded));
    },
    [plan, pages, all, still],
  );

  // stops: start (auto-plays the turning), the bamboo slips, the landing at 105
  useEffect(() => {
    const el = () => track.current;
    const holdAt = plan.starts[pages.length - 1] ?? 0.7;
    const fwdAt = plan.starts[pages.length] ?? 0.8;
    const offs = [
      register({ id: "rewind-start", label: "Đại tua ngược", getY: () => trackY(el(), 0), autoplay: 14 }),
      register({ id: "rewind-hold", label: "Thẻ tre", getY: () => trackY(el(), holdAt + (fwdAt - holdAt) * 0.4), autoplay: 5 }),
      register({ id: "rewind-land", label: "Năm 105", getY: () => trackY(el(), 0.985) }),
    ];
    return () => offs.forEach((f) => f());
  }, [plan, pages.length]);

  useEffect(() => () => setYearMode("hidden"), []);

  const ticks = useMemo(() => {
    const years = new Map<number, string>();
    for (const p of [...rewind.pages, ...rewind.forward]) years.set(p.year, p.label);
    return [...years.entries()].sort((a, b) => a[0] - b[0]);
  }, []);
  return (
    <section
      ref={track}
      id="giay"
      className={`rewind ${mobile ? "rewind--mobile" : ""} ${still ? "rewind--still" : ""}`}
      data-cinematic
      data-audio="loud"
      data-chapter-name="Giấy"
      aria-label="Đại tua ngược: lật trang về quá khứ"
      data-dragon="50,0;47,50;53,100"
    >
      <div className="rewind__sticky">
        {!still && <EventCorners event={event} />}
        <canvas ref={canvas} className="rewind__book3d" aria-hidden />
        {!still && (
          <div className="rewind__ribbon" aria-hidden>
            <div ref={strip} className="rewind__strip">
              {TICK_YEARS.slice(1).map((y, i) => (
                <span key={`m${y}`} className="rewind__tick rewind__tick--minor" style={{ left: (i + 0.5) * STEP }} />
              ))}
              {ticks.map(([y, label]) => (
                <span key={y} className="rewind__tick" style={{ left: xOf(y) }}>
                  <span className="rewind__tick-label">{label}</span>
                </span>
              ))}
            </div>
            <div className="rewind__now">
              <span ref={nowYear}>2026</span>
            </div>
          </div>
        )}
        <p ref={stopLine} className="rewind__stopline">
          {rewind.stopLine}
        </p>
        <div className={`rewind__land ${landed ? "is-on" : ""}`} aria-hidden={!landed}>
          <Seal han="漢" size="lg" stamp="none" stampNow={landed} />
        </div>
        {/* the book is drawn on a canvas; this is its text for screen readers */}
        <ol className="visually-hidden">
          {all.map((pg) => (
            <li key={pg.image + pg.label}>
              {pg.label}: {pg.caption}
            </li>
          ))}
        </ol>
      </div>
      {still && (
        <ol className="rewind__list">
          {all.map((pg) => (
            <li key={pg.image + pg.label}>
              <strong>{pg.label}</strong> {pg.caption}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const preloaded = new Set<string>();
function preloadCorners(p: RewindPage) {
  const key = cornerKey(p);
  if (preloaded.has(key)) return;
  preloaded.add(key);
  for (let k = 1; k <= 4; k++) {
    const img = new Image();
    img.decoding = "async";
    img.src = `/img/cut/corner-${key}-${k}.webp`;
  }
}

/**
 * Four objects of the event in the corners of the screen, without frames:
 * each emerges from its corner; when the page turns they sink back and the
 * next event's four come out.
 */
function EventCorners({ event }: { event: string }) {
  const [sets, setSets] = useState<{ cur: string; prev: string | null }>({ cur: event, prev: null });
  useEffect(() => {
    if (event === sets.cur) return;
    setSets({ cur: event, prev: sets.cur });
    const t = window.setTimeout(() => setSets((s) => ({ ...s, prev: null })), 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return (
    <div className="rw-corners" aria-hidden>
      {sets.prev && <CornerSet key={`p-${sets.prev}`} event={sets.prev} leaving />}
      <CornerSet key={sets.cur} event={sets.cur} />
    </div>
  );
}

function CornerSet({ event, leaving = false }: { event: string; leaving?: boolean }) {
  return (
    <>
      {[1, 2, 3, 4].map((k) => {
        const name = `corner-${event}-${k}`;
        const c = imageCredits[name];
        const kind = cornerKind[name] ?? "paper";
        return (
          <figure key={k} className={`rw-corner rw-corner--${k} rw-corner--${kind} ${leaving ? "is-leaving" : ""}`} style={{ "--i": k - 1 } as CSSProperties}>
            <img src={`/img/cut/${name}.webp`} alt="" decoding="async" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
            {c && (
              <figcaption>
                <span className="rw-corner__alt">{c.alt}</span>
                <span className="rw-corner__credit">
                  {c.artist} · {c.license}
                </span>
              </figcaption>
            )}
          </figure>
        );
      })}
    </>
  );
}
