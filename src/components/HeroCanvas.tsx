import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { useHydrated } from "@/hooks/use-hydrated";

const HeroScene = lazy(() => import("./three/HeroScene"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Mounts the WebGL hero only in the browser, after hydration and once fonts are ready
 * (the scene paints Han glyphs into canvas textures). Falls back to a static
 * illustration without WebGL, and freezes the scene for reduced-motion users.
 */
export function HeroCanvas() {
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

  const fallback = <StaticHero />;
  if (ready !== "webgl") return fallback;

  return (
    <SceneBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <div className="absolute inset-0 animate-[hero-fade_1.4s_ease-out_both]">
          <HeroScene animate={!reduce} />
        </div>
      </Suspense>
    </SceneBoundary>
  );
}

function StaticHero() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--gold)_0%,transparent_65%)] opacity-25 blur-2xl" />
      <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--seal)_0%,transparent_65%)] opacity-40 blur-2xl" />
      <svg
        className="absolute -right-10 -top-6 h-56 w-56 text-[var(--gold)] opacity-20"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M10 60c0-8 6-12 12-10 2-9 12-12 18-6 5-7 16-5 18 4 9-1 14 6 12 13" />
        <path d="M22 76c0-6 5-9 10-7 2-7 10-9 14-4 4-5 13-4 14 4 7-1 11 5 9 10" />
        <circle cx="70" cy="30" r="14" />
      </svg>
    </div>
  );
}
