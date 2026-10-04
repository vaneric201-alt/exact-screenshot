import { useEffect } from "react";
import type { RefObject } from "react";
import { ScrollTrigger } from "./motion";

/**
 * Scroll progress (0–1) through a tall "track" whose child is position:sticky.
 * CSS sticky does the pinning, so there are no pin-spacers and the dragon's
 * waypoints stay where the layout puts them.
 */
export function useTrack(ref: RefObject<HTMLElement | null>, onProgress: (p: number) => void, deps: unknown[] = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => onProgress(self.progress),
      onRefresh: (self) => onProgress(self.progress),
    });
    return () => st.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Document Y at which a track reaches progress p (for presentation stops). */
export function trackY(el: HTMLElement | null, p: number) {
  if (!el) return 0;
  const top = el.getBoundingClientRect().top + window.scrollY;
  return top + (el.offsetHeight - window.innerHeight) * p;
}
