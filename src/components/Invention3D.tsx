import { useEffect, useRef, useState } from "react";
import type { ChapterData } from "../content/content";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { reducedMotion } from "../lib/motion";
import type { LabelState, Stage } from "../three/stage/stage";
import type { InventionScene, Phase } from "../three/inventions/types";

/*
 * A scroll-driven 3D model of the invention on a museum plinth: its materials
 * with labels, how it is made, then how it evolved. The reader can drag to
 * turn the plinth. Labels are HTML (crisp, translatable, readable by screen
 * readers); leader lines point to the parts in 3D.
 */

const loaders: Record<ChapterData["id"], () => Promise<{ create: (s: Stage, c: ChapterData) => InventionScene }>> = {
  giay: () => import("../three/inventions/paper"),
  in: () => import("../three/inventions/printing"),
  thuocsung: () => import("../three/inventions/gunpowder"),
  laban: () => import("../three/inventions/compass"),
};

export function Invention3D({ chapter }: { chapter: ChapterData }) {
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labelBox = useRef<HTMLDivElement>(null);
  const lines = useRef<SVGSVGElement>(null);
  const stage = useRef<Stage | null>(null);
  const progress = useRef(0);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [labels, setLabels] = useState<{ id: string; text: string; sub?: string }[]>([]);
  const [phase, setPhase] = useState(0);
  const [failed, setFailed] = useState(false);
  const still = reducedMotion();

  // build when near, run only while visible
  useEffect(() => {
    const el = track.current;
    const c = canvas.current;
    if (!el || !c) return;
    let disposed = false;
    let visible = false;
    const onLabels = (ls: LabelState[]) => {
      const box = labelBox.current;
      const svg = lines.current;
      if (!box || !svg) return;
      const panel = box.parentElement?.querySelector<HTMLElement>(".inv3d__panel");
      const panelRight = panel && window.innerWidth >= 768 ? panel.offsetLeft + panel.offsetWidth : 0;
      ls.forEach((label, i) => {
        let l = label;
        const div = box.children[i] as HTMLElement | undefined;
        const line = svg.children[i] as SVGLineElement | undefined;
        if (!div || !line) return;
        // keep the label on screen: flip it to the other side of its anchor when it would overflow
        const bw = box.clientWidth;
        const lw = div.offsetWidth;
        // on wide screens nothing may cover the text panel on the left
        const minX = panelRight + 12;
        let side = l.side;
        let x = l.x;
        if (side === "right" && x + lw > bw - 12) {
          side = "left";
          x = l.ax - (l.x - l.ax);
        } else if (side === "left" && x - lw < minX) {
          side = "right";
          x = l.ax + (l.ax - l.x);
        }
        x = side === "left" ? Math.max(minX + lw, x) : Math.max(minX, Math.min(bw - 12 - lw, x));
        l = { ...l, x, side };
        div.style.opacity = `${l.opacity}`;
        div.style.transform = `translate(${l.x}px, ${l.y}px) translate(${l.side === "left" ? "-100%" : "0"}, -50%)`;
        div.dataset["side"] = l.side;
        line.setAttribute("x1", `${l.x}`);
        line.setAttribute("y1", `${l.y + 14}`);
        line.setAttribute("x2", `${l.ax}`);
        line.setAttribute("y2", `${l.ay}`);
        line.style.opacity = `${l.opacity}`;
      });
    };
    const build = async () => {
      try {
        const [{ createStage }, mod] = await Promise.all([import("../three/stage/stage"), loaders[chapter.id]()]);
        if (disposed) return;
        const s = createStage(c, { onLabels });
        const scene = mod.create(s, chapter);
        s.setModule(scene);
        stage.current = s;
        setPhases(scene.phases);
        setLabels(scene.labels.map((l) => ({ id: l.id, text: l.text, sub: l.sub })));
        s.resize();
        s.setProgress(still ? 1 : progress.current);
        if (visible && !still) s.start();
      } catch {
        setFailed(true);
      }
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && !stage.current) {
          near.disconnect();
          void build();
        }
      },
      { rootMargin: "120% 0px" },
    );
    const vis = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      if (still) return;
      if (visible) stage.current?.start();
      else stage.current?.stop();
    });
    near.observe(el);
    vis.observe(el);
    const onResize = () => stage.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      near.disconnect();
      vis.disconnect();
      window.removeEventListener("resize", onResize);
      stage.current?.dispose();
      stage.current = null;
    };
  }, [chapter, still]);

  useTrack(
    track,
    (p) => {
      progress.current = p;
      if (still) return;
      stage.current?.setProgress(p);
      const k = phases.findIndex((ph) => p >= ph.from && p < ph.to);
      if (k >= 0) setPhase((was) => (was === k ? was : k));
    },
    [phases, still],
  );

  // one presentation stop per phase
  useEffect(() => {
    const el = () => track.current;
    const offs = phases.map((ph, i) =>
      register({ id: `${chapter.id}-3d-${i}`, label: `${chapter.title} · ${ph.title}`, getY: () => trackY(el(), (ph.from + ph.to) / 2) }),
    );
    return () => offs.forEach((f) => f());
  }, [phases, chapter]);

  const ph = phases[phase];
  return (
    <section
      ref={track}
      className={`inv3d ${still ? "inv3d--still" : ""}`}
      aria-labelledby={`${chapter.id}-3d-title`}
      data-dragon="97,2;97,98"
    >
      <div className="inv3d__sticky">
        <canvas ref={canvas} className="inv3d__canvas" aria-hidden />
        <svg ref={lines} className="inv3d__lines" aria-hidden>
          {labels.map((l) => (
            <line key={l.id} />
          ))}
        </svg>
        <div ref={labelBox} className="inv3d__labels">
          {labels.map((l) => (
            <div key={l.id} className="inv3d__label">
              <strong>{l.text}</strong>
              {l.sub && <span>{l.sub}</span>}
            </div>
          ))}
        </div>
        <div className="inv3d__panel">
          <h3 id={`${chapter.id}-3d-title`} className="inv3d__kicker">
            Mô hình 3D · {chapter.title}
          </h3>
          {ph && (
            <div key={phase} className="inv3d__phase">
              <p className="inv3d__title">{ph.title}</p>
              <p className="inv3d__text">{ph.text}</p>
            </div>
          )}
          <ol className="inv3d__steps" aria-label="Các phần của mô hình">
            {phases.map((x, i) => (
              <li key={x.title} className={i === phase ? "is-on" : ""}>
                {x.title}
              </li>
            ))}
          </ol>
        </div>
        <p className="inv3d__hint" aria-hidden>
          Kéo để xoay mô hình
        </p>
        {failed && <p className="inv3d__fail">Máy này không hiển thị được mô hình 3D.</p>}
      </div>
    </section>
  );
}
