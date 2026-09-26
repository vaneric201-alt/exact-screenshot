import { Suspense, lazy, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useHydrated } from "@/hooks/use-hydrated";
import { chapterById } from "@/data/chapters";
import type { InventionId } from "@/data/pages";
import { SceneBoundary, hasWebGL } from "./HeroCanvas";

const InventionScene = lazy(() => import("./three/InventionScene"));

/**
 * Browser-only mount for one invention's 3D model, after hydration and fonts
 * (the models paint Han glyphs into textures). Without WebGL it shows the
 * invention's Han character instead.
 */
export function InventionCanvas({ kind }: { kind: InventionId }) {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const [ready, setReady] = useState<"wait" | "webgl" | "static">("wait");

  useEffect(() => {
    if (!hydrated) return;
    if (!hasWebGL()) {
      setReady("static");
      return;
    }
    let alive = true;
    const go = () => alive && setReady("webgl");
    const timeout = window.setTimeout(go, 1500);
    document.fonts?.ready.then(go, go);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [hydrated]);

  const fallback = (
    <div aria-hidden className="absolute inset-0 grid place-items-center">
      <span className="han text-[clamp(6rem,18vw,12rem)] leading-none text-gold/30">
        {chapterById(kind).han}
      </span>
    </div>
  );
  if (ready !== "webgl") return fallback;

  return (
    <SceneBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <div className="absolute inset-0 animate-[hero-fade_1.4s_ease-out_both]">
          <InventionScene kind={kind} animate={!reduce} />
        </div>
      </Suspense>
    </SceneBoundary>
  );
}
