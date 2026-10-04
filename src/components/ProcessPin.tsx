import { useEffect, useMemo, useRef, useState } from "react";
import type { ChapterData } from "../content/content";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { isMobile, reducedMotion } from "../lib/motion";
import { InkImage } from "./InkImage";

/** Real woodcuts of papermaking are only five plates; spread them over nine steps. */
const PAPER_PLATES = [1, 1, 2, 2, 2, 3, 4, 5, 5];

interface Flat {
  part?: string;
  partIndex: number;
  name: string;
  desc: string;
  image: string;
  n: number;
  of: number;
}

/**
 * The process, pinned while it plays (design.md §9.2): the illustration of the
 * current step spreads in like ink, the list on the right marks where we are.
 * Each step is a presentation stop. On phones it becomes plain blocks.
 */
export function ProcessPin({ chapter }: { chapter: ChapterData }) {
  const track = useRef<HTMLElement>(null);
  const [cur, setCur] = useState(0);
  const [flat, setFlat] = useState(false);
  useEffect(() => setFlat(isMobile() || reducedMotion()), []);

  const steps: Flat[] = useMemo(() => {
    const out: Flat[] = [];
    chapter.process.parts.forEach((part, pi) => {
      part.steps.forEach((s, k) => {
        const plate = part.prefix === "tgkw-paper" ? (PAPER_PLATES[k] ?? k + 1) : k + 1;
        out.push({
          ...(part.title !== undefined && { part: part.title }),
          partIndex: pi,
          name: s.name,
          desc: s.desc,
          image: `${part.prefix}-${plate}`,
          n: k + 1,
          of: part.steps.length,
        });
      });
    });
    return out;
  }, [chapter]);

  useTrack(
    track,
    (p) => {
      if (flat) return;
      const i = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
      setCur((c) => (c === i ? c : i));
    },
    [flat, steps.length],
  );

  useEffect(() => {
    if (flat) return;
    const offs = steps.map((s, i) =>
      register({ id: `${chapter.id}-step-${i}`, label: `${chapter.title} · ${s.name}`, getY: () => trackY(track.current, (i + 0.5) / steps.length) }),
    );
    return () => offs.forEach((f) => f());
  }, [flat, steps, chapter]);

  const images = useMemo(() => Array.from(new Set(steps.map((s) => s.image))), [steps]);
  const now = steps[cur]!;

  if (flat) {
    return (
      <section className="scene process process--flat" aria-labelledby={`${chapter.id}-process`}>
        <div className="scene__inner">
          <h3 id={`${chapter.id}-process`} className="h2">
            Quy trình
          </h3>
          {chapter.process.note && <p className="process__note">{chapter.process.note}</p>}
          <ol className="process__blocks">
            {steps.map((s, i) => (
              <li key={i} data-stop={`${chapter.title} · ${s.name}`}>
                {s.part && s.n === 1 && <p className="process__part">{s.part}</p>}
                <InkImage name={s.image} alt={s.name} ratio="4 / 3" ai />
                <p className="process__num">
                  Bước {s.n}/{s.of}
                </p>
                <h4 className="h3">{s.name}</h4>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={track}
      className="process"
      style={{ height: `${steps.length * 60 + 100}vh` }}
      aria-labelledby={`${chapter.id}-process`}
      data-dragon="95,2;96,98"
    >
      <div className="process__sticky">
        <div className="process__stage">
          <div className="process__imgs">
            {images.map((img) => (
              <div key={img} className={`process__img ${img === now.image ? "is-current" : ""}`}>
                <InkImage name={img} alt={img === now.image ? now.name : ""} ratio="4 / 3" ai />
              </div>
            ))}
          </div>
          <p className="process__count">
            {now.part && <span className="process__part">{now.part}</span>}
            Bước {now.n}/{now.of}
          </p>
        </div>
        <div className="process__side">
          <h3 id={`${chapter.id}-process`} className="h3 process__title">
            Quy trình
          </h3>
          {chapter.process.note && <p className="process__note">{chapter.process.note}</p>}
          <ol className="process__list">
            {steps.map((s, i) => (
              <li key={i} className={`${i === cur ? "is-current" : ""} ${s.n === 1 && s.part ? "is-part-start" : ""}`} aria-current={i === cur ? "step" : undefined}>
                {s.n === 1 && s.part && <span className="process__part-label">{s.part}</span>}
                <span className="process__n">{s.n}</span>
                <span className="process__name">{s.name}</span>
              </li>
            ))}
          </ol>
          <p className="process__desc" aria-live="polite">
            {now.desc}
          </p>
        </div>
      </div>
    </section>
  );
}
