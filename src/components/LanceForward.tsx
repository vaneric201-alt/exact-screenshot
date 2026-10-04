import { useEffect, useMemo, useRef, useState } from "react";
import { rewind } from "../content/content";
import { imageCredits } from "../content/imageCredits";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { reducedMotion } from "../lib/motion";
import { setYear } from "../lib/year";
import { synth } from "../lib/audio";
import type { LanceShow } from "../three/finale/lanceShow";

/*
 * Fast-forward 1088 → 2026 (see three/finale/lanceShow.ts): a firework rocket
 * launches from the bottom of the screen and keeps climbing past the rewind
 * book's events after 1088 — each one a photograph and a year — while the
 * years run on in large figures; only at 2026 does it burst: today.
 */

// keep in step with FIRE_AT / FLIGHT_END in lanceShow.ts
const FIRE_AT = 0.07;
const FLIGHT_END = 0.92;

export function LanceForward() {
  const events = useMemo(
    () =>
      rewind.pages
        .filter((p) => p.year > 1088)
        .sort((a, b) => a.year - b.year)
        .map((p) => ({ year: p.year, label: p.label, image: p.image, alt: imageCredits[p.image]?.alt ?? p.imageAlt, blank: p.image === "rewind-2026" })),
    [],
  );
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const show = useRef<LanceShow | null>(null);
  const [, setCur] = useState(-1);
  const yearEl = useRef<HTMLParagraphElement>(null);
  const [fired, setFired] = useState(false);
  const [now, setNow] = useState(false);
  const [failed, setFailed] = useState(false);
  const still = reducedMotion();

  useEffect(() => {
    const el = track.current;
    const c = canvas.current;
    if (!el || !c || still) return;
    let dead = false;
    let visible = false;
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || show.current) return;
        near.disconnect();
        import("../three/finale/lanceShow")
          .then(({ createLanceShow }) => {
            if (dead) return;
            const s = createLanceShow(c, events, {
              onFire: () => synth("launch", 0.8),
              onBurst: () => {
                synth("boom", 0.9);
                window.setTimeout(() => synth("crackle", 0.7), 350);
              },
              onPass: (i) => {
                setCur(i);
                if (i >= 0) synth("pop", 0.25);
              },
            });
            show.current = s;
            if (import.meta.env.DEV) Object.assign(window, { __lance: s });
            s.resize();
            if (visible) s.start();
          })
          .catch(() => setFailed(true));
      },
      { rootMargin: "120% 0px" },
    );
    const vis = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (visible) show.current?.start();
      else show.current?.stop();
    });
    near.observe(el);
    vis.observe(el);
    const onResize = () => show.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      dead = true;
      near.disconnect();
      vis.disconnect();
      window.removeEventListener("resize", onResize);
      show.current?.dispose();
      show.current = null;
    };
  }, [still, events]);

  useTrack(
    track,
    (p) => {
      show.current?.setProgress(p);
      setFired((was) => (was === p >= FIRE_AT ? was : p >= FIRE_AT));
      setNow((was) => (was === p >= FLIGHT_END ? was : p >= FLIGHT_END));
      // the years run on with the arrow, one by one, in large figures
      const f = Math.min(1, Math.max(0, (p - FIRE_AT) / (FLIGHT_END - FIRE_AT)));
      if (yearEl.current) yearEl.current.textContent = `${Math.round(1088 + (2026 - 1088) * f)}`;
      if (p > 0 && p < 1) setYear(2026, "hidden");
    },
    [events],
  );

  useEffect(() => {
    const el = () => track.current;
    const step = (FLIGHT_END - FIRE_AT) / events.length;
    const offs = [
      register({ id: "lance-0", label: "Pháo hoa", getY: () => trackY(el(), 0.03), autoplay: 1.2 }),
      register({ id: "lance-fire", label: "Bay lên", getY: () => trackY(el(), FIRE_AT + 0.01) }),
      ...events.map((e, i) => register({ id: `lance-${e.year}`, label: e.label, getY: () => trackY(el(), FIRE_AT + (i + 1) * step) })),
    ];
    return () => offs.forEach((f) => f());
  }, [events]);

  if (still) {
    return (
      <section id="hoi-tu" className="lf lf--still" aria-label="Tua nhanh về hiện tại" data-audio="loud">
        <div className="lf__grid">
          {events.map((e) => (
            <figure key={e.year} className="lf__still">
              {!e.blank && <img src={`/img/${e.image}.webp`} alt={e.alt} loading="lazy" />}
              <figcaption>{e.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={track}
      id="hoi-tu"
      className="lf"
      style={{ height: `${events.length * 90 + 220}vh` }}
      data-cinematic
      data-audio="loud"
      aria-label="Một quả pháo hoa bay lên qua các năm, từ 1088 đến 2026"
      data-dragon="98,0;98,100"
    >
      <div className="lf__sticky">
        <canvas ref={canvas} className="lf__canvas" aria-hidden />
        {failed && <div className="lf__fallback" aria-hidden />}
        <p className={`lf__lead ${fired ? "" : "is-on"}`}>Châm ngòi: thời gian bay về hôm nay.</p>
        <p ref={yearEl} className={`lf__year ${fired ? "is-on" : ""} ${now ? "is-now" : ""}`} aria-hidden>
          1088
        </p>
        <p className={`lf__now ${now ? "is-on" : ""}`}>Hiện nay</p>
        <ol className="visually-hidden">
          {events.map((e) => (
            <li key={e.year}>
              {e.label}: {e.alt}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
