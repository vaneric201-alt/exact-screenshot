import { useEffect, useRef, useState } from "react";
import { intro, meta, sgk } from "../content/content";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { reducedMotion, isMobile } from "../lib/motion";
import { setYearMode } from "../lib/year";
import { play } from "../lib/audio";
import type { Flyover } from "../three/forbiddenCityFlyover";
import { renderStars } from "./PrimarySource";
import { InkImage } from "./InkImage";
import { SHOTS, cutDip } from "../three/fc/shots";

// one slide per shot; the first waits until the title has lifted
const slideOpacity = (p: number, i: number) => {
  const s = SHOTS[i]!;
  const a = i === 0 ? Math.max(s.from, 0.085) : s.from + 0.004;
  const b = s.to - 0.004;
  const fade = 0.012;
  return Math.max(0, Math.min(1, (p - a) / fade, (b - p) / fade));
};

/*
 * Scene 1–2 · Hero: a walk through the Forbidden City at sunset, as ten
 * documentary shots (three/fc/shots.ts) joined by short dips to black. At
 * every new building its name appears, as in a travel film, and one slide of
 * the textbook's overview of Chinese civilisation (SGK Lịch sử 10, Bài 4 c)
 * comes up: bullet points with archival images. The title lifts in the first
 * 8%; from 93% a sheet of paper settles over the frame.
 */
export function HeroFlyover({ opened, onReady }: { opened: boolean; onReady?: () => void }) {
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const places = useRef<(HTMLElement | null)[]>([]);
  const dip = useRef<HTMLDivElement>(null);
  const fly = useRef<Flyover | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // build the 3D scene (lazy chunk)
  useEffect(() => {
    let disposed = false;
    const c = canvas.current;
    if (!c) return;
    const lowPower = isMobile();
    import("../three/forbiddenCityFlyover")
      .then(({ createForbiddenCityFlyover }) => {
        if (disposed) return;
        let slow = 0;
        let gong = false;
        const f = createForbiddenCityFlyover(c, {
          // a gong as the Meridian Gate's doors begin to open (once per pass)
          onGate: (open) => {
            if (open > 0.05 && !gong) {
              gong = true;
              play("gate", 2000);
            } else if (open < 0.03) gong = false;
          },
          quality: lowPower ? "medium" : "high",
          shadows: !lowPower,
          onFrame: (fps) => {
            // degrade gracefully on weaker machines (design.md §8.1)
            if (fps < 50) slow++;
            else slow = Math.max(0, slow - 1);
            if (slow === 3) f.setQuality("medium");
            if (slow === 6) f.setQuality("low");
          },
        });
        fly.current = f;
        if (reducedMotion()) f.renderFrame(1);
        else {
          // behind the gate: a slow bird's-eye orbit over the whole city
          f.setAerial(1);
          f.renderFrame(0);
          f.start();
        }
        setReady(true);
        onReady?.();
      })
      .catch(() => {
        setFailed(true);
        onReady?.();
      });
    const onResize = () => fly.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      fly.current?.dispose();
      fly.current = null;
    };
  }, []);

  // start after the gate
  useEffect(() => {
    if (!opened || !ready || !fly.current || reducedMotion()) return;
    fly.current.start();
    // swoop down from the bird's-eye view to the Meridian Gate
    fly.current.intro(3.6);
    title.current?.classList.add("is-inked");
  }, [opened, ready]);

  // render only while the hero is on screen
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!fly.current || reducedMotion()) return;
      if (e?.isIntersecting) fly.current.start();
      else fly.current.stop();
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useTrack(track, (p) => {
    fly.current?.setProgress(p);
    const t = Math.min(1, p / 0.075);
    if (title.current) {
      title.current.style.opacity = `${1 - t}`;
      title.current.style.transform = `translateY(${-t * 12}vh)`;
    }
    if (hint.current) hint.current.style.opacity = `${1 - Math.min(1, p / 0.04)}`;
    // the ink dragon waits until the title has lifted, so it never scrawls over it
    document.documentElement.classList.toggle("hero-titled", p < 0.1);
    if (paper.current) paper.current.style.opacity = `${Math.max(0, (p - 0.93) / 0.07)}`;
    cards.current.forEach((el, i) => {
      if (!el) return;
      const o = reducedMotion() ? 1 : slideOpacity(p, i);
      el.style.opacity = `${o}`;
      el.style.transform = `translateX(${(1 - o) * -3}vw)`;
      el.style.visibility = o > 0.001 ? "visible" : "hidden";
    });
    // the building's name rides in with its shot
    places.current.forEach((el, i) => {
      if (!el) return;
      const s = SHOTS[i]!;
      const o = Math.max(0, Math.min(1, (p - s.from - 0.003) / 0.008, (s.to - 0.003 - p) / 0.008)) * (i === 0 ? Math.min(1, Math.max(0, (p - 0.06) / 0.02)) : 1);
      el.style.opacity = `${o}`;
    });
    if (dip.current) dip.current.style.opacity = `${cutDip(p)}`;
    setYearMode("hidden");
  });

  useEffect(() => {
    const el = () => track.current;
    const offs = [
      register({ id: "hero-0", label: "Mở đầu", getY: () => trackY(el(), 0) }),
      ...sgk.slides.map((c, i) =>
        register({ id: `hero-sgk-${i}`, label: `${c.place.vi} · ${c.sub ?? c.heading}`, getY: () => trackY(el(), SHOTS[i]!.from + (SHOTS[i]!.to - SHOTS[i]!.from) * 0.55) }),
      ),
      register({ id: "hero-end", label: "Toàn cảnh", getY: () => trackY(el(), 0.92) }),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => fly.current?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const still = reducedMotion();
  return (
    <section
      ref={track}
      id="mo-dau"
      className={`hero-track ${still ? "hero-track--still" : ""}`}
      data-cinematic
      data-audio="loud"
      data-chapter-name="Mở đầu"
      data-dragon="98,3;97,50;98,97"
    >
      <div className="hero-sticky">
        <canvas ref={canvas} className={`hero-canvas ${ready ? "is-ready" : ""}`} aria-hidden />
        {failed && <div className="hero-fallback" aria-hidden />}
        <div ref={title} className="hero-title">
          <h1>
            <span className="hero-title__main">{meta.title}</span>
            <span className="hero-title__sub">{meta.subtitle}</span>
          </h1>
          <p className="hero-title__group">{meta.groupLine}</p>
        </div>
        <p ref={hint} className="hero-hint">
          {intro.hero.scrollHint}
          <span aria-hidden className="hero-hint__line" />
        </p>
        <div className={`sgk ${still ? "sgk--still" : ""}`} aria-label={sgk.title}>
          {sgk.slides.map((c, i) => (
            <article
              key={i}
              ref={(el) => {
                cards.current[i] = el;
              }}
              className={`sgk__slide ${c.images.length ? "" : "sgk__slide--text"}`}
              aria-labelledby={`sgk-${i}`}
            >
              <div className="sgk__body">
                <p className="sgk__kicker">{sgk.kicker}</p>
                <h2 id={`sgk-${i}`} className="sgk__heading">
                  {c.heading}
                </h2>
                {c.sub && <p className="sgk__sub">{c.sub}</p>}
                <ul className="sgk__bullets">
                  {c.bullets.map((t) => (
                    <li key={t}>{renderStars(t)}</li>
                  ))}
                </ul>
                {c.source && (
                  <blockquote className="sgk__source">
                    <p>
                      <strong>{c.source.label}.</strong> {c.source.text}
                    </p>
                    <footer>({renderStars(c.source.cite)})</footer>
                  </blockquote>
                )}
                <p className="sgk__count" aria-hidden>
                  {i + 1} / {sgk.slides.length}
                </p>
              </div>
              {c.images.length > 0 && (
                <div className={`sgk__media sgk__media--${Math.min(3, c.images.length)}`}>
                  {c.images.map((im) => (
                    <InkImage key={im.name} name={im.name} alt={im.caption} caption={im.caption} ratio={c.images.length > 1 ? "4 / 3" : "16 / 10"} hideCredit className={im.sgk ? "sgk__img--book" : ""} />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="place" aria-hidden>
          {sgk.slides.map((c, i) => (
            <p
              key={c.place.en}
              ref={(el) => {
                places.current[i] = el;
              }}
              className="place__name"
            >
              <span className="place__han" lang="zh-Hant">
                【{c.place.han}】
              </span>
              <span className="place__vi">{c.place.vi}</span>
              <span className="place__en">{c.place.en}</span>
            </p>
          ))}
        </div>
        <div ref={dip} className="hero-dip" aria-hidden />
        <p className="hero-caption">{intro.hero.caption}</p>
        <div ref={paper} className="hero-paper" aria-hidden />
      </div>
    </section>
  );
}
