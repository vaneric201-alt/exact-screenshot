import { useEffect, useRef, useState } from "react";
import { finale } from "../content/content";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { reducedMotion } from "../lib/motion";
import { setYear, setYearMode } from "../lib/year";
import { synth } from "../lib/audio";
import type { ModernShow as Show } from "../three/finale/modernShow";
import {
  AIR_BEATS,
  circleStep,
  montageQ,
  montageRect,
  ORDER,
  PH,
} from "../three/finale/modernPhases";

/*
 * The four inventions today, in 3D (see three/finale/modernShow.ts; timings in
 * modernPhases.ts). The page adds the words: the name under each modern heir
 * as the ring turns, a card of facts for each pair, the parade's hardware, the
 * PL-15's card while the camera rides beside it, the captions of the two
 * simulations, the white flash of the explosion, and the labels of the
 * closing montage, which hands over to the conclusion on paper.
 */

type Stage = "circle" | "pairs" | "parade" | "air" | "flight" | "montage";
const stageAt = (p: number): Stage =>
  p < PH.circle[1]
    ? "circle"
    : p < PH.parade[0]
      ? "pairs"
      : p < PH.air[0]
        ? "parade"
        : p < PH.air[1]
          ? "air"
          : p < PH.montage[0]
            ? "flight"
            : "montage";
const inAir = (p: number, a: number, b: number) => {
  const k = (p - PH.air[0]) / (PH.air[1] - PH.air[0]);
  return k >= a && k < b;
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const FLIGHT_BURST = PH.flight[0] + (PH.flight[1] - PH.flight[0]) * 0.82;
const byId = (id: string) => finale.modern.find((m) => m.id === id)!;

export function ModernShow() {
  const track = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const centre = useRef<HTMLDivElement>(null);
  const show = useRef<Show | null>(null);
  const [stage, setStage] = useState<Stage>("circle");
  const [pair, setPair] = useState(-1);
  const [lit, setLit] = useState({ i: -1, all: false });
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  const still = reducedMotion();

  useEffect(() => {
    const el = track.current;
    const c = canvas.current;
    if (!el || !c || still) return;
    let dead = false;
    let visible = false;
    // words that must sit exactly on the 3D follow the progress the picture is drawn at
    const onFrame = (p: number) => {
      const s = circleStep(p);
      const i = p < PH.circle[1] && s.f > 0.15 ? s.lit : -1;
      setLit((was) =>
        was.i === i && was.all === s.all ? was : { i, all: s.all },
      );
      if (p >= PH.montage[0] - 0.01) {
        const q = montageQ(p);
        cells.current.forEach((cell, n) => {
          if (!cell) return;
          const r = montageRect(n, q);
          cell.style.left = `${r.x * 100}%`;
          cell.style.top = `${r.y * 100}%`;
          cell.style.width = `${r.w * 100}%`;
          cell.style.height = `${r.h * 100}%`;
        });
        if (centre.current)
          centre.current.style.opacity = `${clamp01((q - 0.55) / 0.35)}`;
      }
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || show.current) return;
        near.disconnect();
        import("../three/finale/modernShow")
          .then(({ createModernShow }) => {
            if (dead) return;
            const s = createModernShow(c, {
              onFrame,
              onLaunch: () => synth("launch", 0.9),
              onBurst: () => synth("boom", 1),
              onAirFire: () => synth("launch", 0.6),
              onAirHit: () => synth("boom", 0.7),
            });
            show.current = s;
            if (import.meta.env.DEV) Object.assign(window, { __modern: s });
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
    const st = stageAt(p);
    setStage((was) => (was === st ? was : st));
    const i = PH.pairs.findIndex(
      (s) => p >= s.from + 0.012 && p < s.to - 0.006,
    );
    setPair((was) => (was === i ? was : i));
    const z = inAir(p, AIR_BEATS.zoom[0] + 0.02, AIR_BEATS.zoom[1]);
    setZoom((was) => (was === z ? was : z));
    if (p > 0 && p < 1) {
      setYear(2026, "corner");
      if (p > PH.montage[0]) setYearMode("hidden");
    }
    // the explosion whites the screen out, then the white clears onto the montage
    if (flash.current) {
      const up = clamp01((p - FLIGHT_BURST) / 0.02);
      const down = clamp01((p - (PH.montage[0] + 0.004)) / 0.03);
      flash.current.style.opacity = `${up * (1 - down)}`;
    }
    // and the montage fades into the conclusion's paper
    if (paper.current)
      paper.current.style.opacity = `${clamp01((p - 0.975) / 0.022)}`;
  });

  useEffect(() => {
    const el = () => track.current;
    const at = (a: number) => () => trackY(el(), a);
    const air = (k: number) => PH.air[0] + (PH.air[1] - PH.air[0]) * k;
    const flight = (k: number) =>
      PH.flight[0] + (PH.flight[1] - PH.flight[0]) * k;
    const montage = (k: number) =>
      PH.montage[0] + (PH.montage[1] - PH.montage[0]) * k;
    const offs = [
      register({
        id: "modern-0",
        label: "Hôm nay",
        getY: at(0.004),
        autoplay: 1.5,
      }),
      register({
        id: "modern-ring",
        label: "Bốn phát minh hôm nay",
        getY: at(PH.circle[1] - 0.003),
      }),
      ...PH.pairs.map((s) =>
        register({
          id: `modern-${s.id}`,
          label: byId(s.id).ancient,
          getY: at(s.from + (s.to - s.from) * 0.62),
        }),
      ),
      register({
        id: "modern-parade",
        label: "Duyệt binh",
        getY: at(PH.parade[0] + (PH.parade[1] - PH.parade[0]) * 0.55),
      }),
      register({
        id: "modern-air",
        label: "Hẻm núi",
        getY: at(air(0.3)),
        autoplay: 2,
      }),
      register({ id: "modern-pl15", label: "PL-15", getY: at(air(0.62)) }),
      register({
        id: "modern-hit",
        label: "Trúng mục tiêu",
        getY: at(air(0.9)),
      }),
      register({
        id: "modern-flight",
        label: "Tên lửa",
        getY: at(flight(0.5)),
        autoplay: 2.5,
      }),
      register({
        id: "modern-montage",
        label: "Từ cổ đại đến hôm nay",
        getY: at(montage(0.25)),
      }),
      register({
        id: "modern-corners",
        label: "Bốn góc",
        getY: at(montage(0.8)),
      }),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  if (still) {
    return (
      <section className="ms ms--still" aria-labelledby="ms-title">
        <h2 id="ms-title" className="h2">
          {finale.convergence}
        </h2>
        <ul className="ms__list">
          {finale.modern.map((m) => (
            <li key={m.id}>
              <strong>
                {m.ancient} → {m.today}
              </strong>
              <p>{m.note}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const curPair = pair >= 0 ? byId(PH.pairs[pair]!.id) : undefined;
  const litItem = lit.i >= 0 && !lit.all ? byId(ORDER[lit.i]!) : undefined;

  return (
    <section
      ref={track}
      className="ms"
      data-cinematic
      data-audio="loud"
      aria-labelledby="ms-title"
      data-dragon="97,0;97,100"
    >
      <div className="ms__sticky">
        <canvas ref={canvas} className="ms__canvas" aria-hidden />
        {failed && <div className="ms__fallback" aria-hidden />}

        {/* the ring */}
        <p
          id="ms-title"
          className={`ms__intro ${stage === "circle" ? "is-on" : ""} ${lit.all ? "is-all" : ""}`}
        >
          {finale.convergence}
        </p>
        <div
          className={`ms__ring ${stage === "circle" && lit.i >= 0 ? "is-on" : ""}`}
          aria-hidden
        >
          <p className="ms__ringfrom">
            {litItem ? `${litItem.ancient} →` : ""}
          </p>
          <p className="ms__ringname">{litItem?.today ?? ""}</p>
        </div>
        <ol
          className={`ms__dots ${stage === "circle" && lit.i >= 0 ? "is-on" : ""}`}
          aria-hidden
        >
          {ORDER.map((id, n) => (
            <li
              key={id}
              className={
                lit.all || n === lit.i ? "is-lit" : n < lit.i ? "is-seen" : ""
              }
            >
              {byId(id).ancient}
            </li>
          ))}
        </ol>

        {/* the pairs */}
        {PH.pairs.map((s) => {
          const m = byId(s.id);
          const on = curPair?.id === m.id;
          return (
            <div
              key={m.id}
              className={`ms__caption ${on ? "is-on" : ""}`}
              aria-hidden={!on}
            >
              <p className="ms__from">{m.ancient}</p>
              <h3 className="ms__to">{m.today}</h3>
              <p className="ms__note">{m.note}</p>
              <ul className="ms__facts">
                {m.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* gunpowder: the parade */}
        <div
          className={`ms__weapons ${stage === "parade" ? "is-big" : ""} ${stage === "flight" ? "is-corner" : ""}`}
        >
          <p className="ms__wtitle">{finale.weapons.title}</p>
          <ul>
            {finale.weapons.items.map((w) => (
              <li key={w.name}>
                <strong>{w.name}</strong>
                <span>{w.note}</span>
              </li>
            ))}
          </ul>
          <p className="ms__wcaption">{finale.weapons.caption}</p>
        </div>

        {/* the canyon */}
        <div className={`ms__air ${zoom ? "is-on" : ""}`} aria-hidden={!zoom}>
          <p className="ms__airtag">Tên lửa không đối không</p>
          <h3 className="ms__airtitle">{finale.weapons.air.title}</h3>
          <ul>
            {finale.weapons.air.points.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <p className={`ms__aircap ${stage === "air" ? "is-on" : ""}`}>
          {finale.weapons.air.caption}
        </p>

        <p className={`ms__flight ${stage === "flight" ? "is-on" : ""}`}>
          {finale.weapons.flight}
        </p>
        <div ref={flash} className="ms__flash" aria-hidden />

        {/* the montage */}
        <div className={`ms__montage ${stage === "montage" ? "is-on" : ""}`}>
          {ORDER.map((id, n) => {
            const m = byId(id);
            return (
              <div
                key={id}
                ref={(e) => {
                  cells.current[n] = e;
                }}
                className={`ms__cell ms__cell--${n}`}
              >
                <p className="ms__celllabel">
                  <span>{m.ancient}</span>
                  <span aria-hidden> → </span>
                  <strong>{m.today}</strong>
                </p>
              </div>
            );
          })}
          <div ref={centre} className="ms__centre">
            <p className="ms__centrekicker">Bốn phát minh</p>
            <h2 className="ms__centretitle">{finale.montage}</h2>
            <p className="ms__centresub">Giấy · In · La bàn · Thuốc súng</p>
          </div>
        </div>
        <div ref={paper} className="ms__paper" aria-hidden />
      </div>
    </section>
  );
}
