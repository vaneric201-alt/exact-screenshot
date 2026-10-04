import { useEffect, useRef, useState } from "react";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { reducedMotion } from "../lib/motion";
import { setYear } from "../lib/year";
import { synth } from "../lib/audio";
import type { IgniteShow } from "../three/finale/igniteShow";

/*
 * After the conclusion (see three/finale/igniteShow.ts): the camera closes in
 * on a person lighting a firework, it climbs and bursts over the palace roofs,
 * the sky keeps bursting — and the page says thank you.
 */

// keep in step with IG in igniteShow.ts
const IG = { light: 0.3, launch: 0.44, burst: 0.6 };

export function Ignite({ caption, thanks }: { caption: string; thanks: string }) {
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const show = useRef<IgniteShow | null>(null);
  const [stage, setStage] = useState<"before" | "lit" | "sky" | "thanks">("before");
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
        import("../three/finale/igniteShow")
          .then(({ createIgniteShow }) => {
            if (dead) return;
            const s = createIgniteShow(c, {
              onLight: () => synth("crackle", 0.4),
              onLaunch: () => synth("launch", 0.8),
              onBurst: () => {
                synth("boom", 0.9);
                window.setTimeout(() => synth("crackle", 0.8), 300);
              },
              onShell: (big) => {
                if (!big) synth("pop", 0.5);
              },
            });
            show.current = s;
            if (import.meta.env.DEV) Object.assign(window, { __ignite: s });
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
  }, [still]);

  useTrack(track, (p) => {
    show.current?.setProgress(p);
    const st = p < IG.light ? "before" : p < IG.burst ? "lit" : p < IG.burst + 0.12 ? "sky" : "thanks";
    setStage((was) => (was === st ? was : st));
    if (p > 0 && p < 1) setYear(2026, "hidden");
  });

  useEffect(() => {
    const el = () => track.current;
    const offs = [
      register({ id: "ignite-0", label: "Pháo hoa", getY: () => trackY(el(), 0.05), autoplay: 1.5 }),
      register({ id: "ignite-light", label: "Châm ngòi", getY: () => trackY(el(), IG.light + 0.02), autoplay: 1.5 }),
      register({ id: "ignite-burst", label: "Pháo nổ", getY: () => trackY(el(), IG.burst + 0.02) }),
      register({ id: "ignite-thanks", label: "Cảm ơn", getY: () => trackY(el(), 0.86) }),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  if (still) {
    return (
      <section className="ig ig--still" aria-label={caption}>
        <p className="ig__thanks is-on">{thanks}</p>
      </section>
    );
  }

  return (
    <section ref={track} className="ig" data-cinematic data-audio="loud" aria-label={caption} data-dragon="98,0;98,100">
      <div className="ig__sticky">
        <canvas ref={canvas} className="ig__canvas" aria-hidden />
        {failed && <div className="ig__fallback" aria-hidden />}
        <p className={`ig__caption ${stage === "before" || stage === "lit" ? "is-on" : ""}`}>{caption}</p>
        <p className={`ig__thanks ${stage === "thanks" ? "is-on" : ""}`}>{thanks}</p>
      </div>
    </section>
  );
}
