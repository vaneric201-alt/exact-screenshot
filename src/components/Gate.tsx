import { useEffect, useRef, useState } from "react";
import { intro } from "../content/content";
import { unlockAudio, play } from "../lib/audio";
import { stopWheel, reducedMotion } from "../lib/motion";
import { CornerFret } from "./Ornaments";

/** Scene 0 · "Mở cuộn": a seal on blank paper. Clicking unlocks sound and starts the hero. */
export function Gate({ onOpen, ready }: { onOpen: () => void; ready: boolean }) {
  const [phase, setPhase] = useState<"idle" | "stamping" | "gone">("idle");
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("gated");
    stopWheel(true);
    return () => document.documentElement.classList.remove("gated");
  }, []);

  useEffect(() => {
    if (ready) btn.current?.focus({ preventScroll: true });
  }, [ready]);

  const open = (withSound: boolean) => {
    if (phase !== "idle" || !ready) return;
    unlockAudio(withSound);
    play("stamp");
    setPhase("stamping");
    const delay = reducedMotion() ? 0 : 650;
    window.setTimeout(() => {
      setPhase("gone");
      document.documentElement.classList.remove("gated");
      stopWheel(false);
      window.scrollTo(0, 0);
      onOpen();
    }, delay);
  };

  if (phase === "gone") return null;
  return (
    <div className={`gate gate--${phase} ${ready ? "is-ready" : "is-loading"}`} role="dialog" aria-modal="true" aria-labelledby="gate-title" aria-busy={!ready}>
      <CornerFret className="gate__corner gate__corner--tl" />
      <CornerFret className="gate__corner gate__corner--tr" />
      <CornerFret className="gate__corner gate__corner--bl" />
      <CornerFret className="gate__corner gate__corner--br" />
      <button ref={btn} type="button" className="gate__open" onClick={() => open(true)} disabled={!ready}>
        <span className="gate__seal" aria-hidden>
          <span>開</span>
        </span>
        <span id="gate-title" className="gate__label">
          {ready ? intro.gate.label : intro.gate.loading}
        </span>
      </button>
      <p className="gate__note">{intro.gate.note}</p>
      <button type="button" className="gate__silent" onClick={() => open(false)} disabled={!ready}>
        {intro.gate.silent}
      </button>
    </div>
  );
}
