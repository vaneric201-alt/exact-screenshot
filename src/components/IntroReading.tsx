import { useEffect, useRef, useState } from "react";
import { intro } from "../content/content";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { isMobile, reducedMotion } from "../lib/motion";
import { RedFrets } from "./Ornaments";
import { jumpTo } from "./Nav";

/* Page 1 reading scenes: two rivers, the dynasty ribbon, Bacon, and the call to rewind. */

export function IntroReading() {
  return (
    <div data-chapter-name="Mở đầu" data-audio="soft">
      <Civilization />
      <DynastyRibbon />
      <BaconQuote />
      <RewindCall />
    </div>
  );
}

// ---------- a scroll painting of five frames, moving sideways as you scroll down ----------

function Civilization() {
  const track = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [flat, setFlat] = useState(false);
  useEffect(() => setFlat(isMobile() || reducedMotion()), []);

  useTrack(
    track,
    (p) => {
      const s = strip.current;
      if (!s || flat) return;
      const max = s.scrollWidth - window.innerWidth;
      s.style.transform = `translateX(${-max * p}px)`;
    },
    [flat],
  );

  useEffect(() => {
    if (flat) return;
    const offs = intro.civilization.panels.map((_, i) =>
      register({ id: `civ-${i}`, label: intro.civilization.title, getY: () => trackY(track.current, i / (intro.civilization.panels.length - 1)) }),
    );
    return () => offs.forEach((f) => f());
  }, [flat]);

  return (
    <section ref={track} className={`civ ${flat ? "civ--flat" : ""}`} aria-labelledby="civ-title" data-dragon="93,2;95,98">
      <div className="civ__sticky">
        <div ref={strip} className="civ__strip">
          <header className="civ__head">
            <h2 id="civ-title" className="h2">
              {intro.civilization.title}
            </h2>
            <p className="lead">{intro.civilization.lead}</p>
          </header>
          {intro.civilization.panels.map((p) => (
            <article key={p.title} className="civ__frame">
              <span className="civ__han" aria-hidden>
                {p.han}
              </span>
              <h3 className="h3">{p.title}</h3>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- the dynasty ribbon, segments proportional to real years ----------

const MIN = -1600;
const MAX = 1912;
const pos = (y: number) => ((y - MIN) / (MAX - MIN)) * 100;

function DynastyRibbon() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="scene ribbon era-bg era-bg--qingming" data-stop="Dải triều đại" aria-labelledby="ribbon-title" data-dragon="94,10;95,90">
      <div className="scene__inner">
        <h2 id="ribbon-title" className="h2">
          {intro.dynasties.title}
        </h2>
        <div className="ribbon__scroll">
          <div className="ribbon__rod" role="list">
            {intro.dynasties.items.map((d, i) => (
              <div
                key={d.name}
                role="listitem"
                className={`ribbon__seg ${i % 2 ? "ribbon__seg--alt" : ""}`}
                style={{ left: `${pos(d.from)}%`, width: `${Math.max(0.6, pos(d.to) - pos(d.from))}%` }}
              >
                <span className="ribbon__name">{d.name}</span>
                <span className="ribbon__years">{d.label}</span>
              </div>
            ))}
            {intro.dynasties.marks.map((m, i) => (
              <div key={m.year} className={`ribbon__mark ${i % 2 ? "ribbon__mark--low" : ""}`} style={{ left: `${pos(m.year)}%` }}>
                <button
                  type="button"
                  className="ribbon__dot"
                  aria-describedby={`mark-${m.year}`}
                  onMouseEnter={() => setOpen(i)}
                  onMouseLeave={() => setOpen(null)}
                  onFocus={() => setOpen(i)}
                  onBlur={() => setOpen(null)}
                  onClick={() => jumpTo(m.target)}
                  aria-label={`${m.year} — ${m.label}`}
                />
                <span className="ribbon__year">{m.year}</span>
                <span id={`mark-${m.year}`} role="tooltip" className={`ribbon__tip ${open === i ? "is-open" : ""}`}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ul className="ribbon__legend">
          {intro.dynasties.marks.map((m) => (
            <li key={m.year}>
              <strong>{m.year}</strong> {m.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BaconQuote() {
  return (
    <section className="scene quote era-bg era-bg--qingming" data-stop="Câu trích" aria-label="Câu trích của Francis Bacon" data-dragon="94,10;93,90">
      <div className="scene__inner">
        <figure className="book-page">
          <blockquote>{intro.quote.text}</blockquote>
          <figcaption>
            — <cite>{intro.quote.cite}</cite>
          </figcaption>
        </figure>
        <p className="quote__note">{intro.quote.note}</p>
      </div>
    </section>
  );
}

function RewindCall() {
  return (
    <section className="rewind-call" data-stop="Tua ngược thời gian" data-dragon="92,20;50,70">
      <p className="rewind-call__line">{intro.transition.line}</p>
      <div className="rewind-call__red">
        <RedFrets />
        <p className="rewind-call__cta">{intro.transition.cta}</p>
      </div>
    </section>
  );
}
