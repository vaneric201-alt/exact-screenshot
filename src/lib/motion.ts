import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isMobile = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

let lenis: Lenis | null = null;

/** Smooth scrolling (Lenis) driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function startSmoothScroll() {
  if (lenis || reducedMotion()) return lenis;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis() {
  return lenis;
}

/** Scroll to a document Y, smoothly when possible. */
export function scrollToY(y: number, duration = 1.2, linear = false) {
  if (lenis) {
    lenis.scrollTo(y, {
      duration,
      lock: true,
      ...(linear ? { easing: (t: number) => t } : {}),
    });
  } else {
    window.scrollTo({ top: y, behavior: reducedMotion() ? "auto" : "smooth" });
  }
}

export function stopWheel(stop: boolean) {
  if (!lenis) return;
  if (stop) lenis.stop();
  else lenis.start();
}
