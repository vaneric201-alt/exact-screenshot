import type { RefObject } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

/** One reveal pattern for the whole page: fade + rise, same distance, duration and easing. */
export const REVEAL = { y: 24, duration: 0.7, ease: "power3.out", stagger: 0.08, start: "top 88%" };

/**
 * Scroll-driven reveals for a chapter, opted in with data attributes:
 * - data-reveal          → the element fades and rises in once
 * - data-reveal-stagger  → its children do the same, one after another
 * - data-draw            → a horizontal rule grows from the left
 * - data-han-stroke      → a HanStroke glyph is traced, then filled
 * Nothing runs when the user prefers reduced motion, so content stays static and visible.
 */
export function useScrollReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const once = (trigger: Element) => ({ trigger, start: REVEAL.start, once: true });

        gsap.utils.toArray<HTMLElement>("[data-reveal]", root).forEach((el) => {
          gsap.from(el, {
            autoAlpha: 0,
            y: REVEAL.y,
            duration: REVEAL.duration,
            ease: REVEAL.ease,
            scrollTrigger: once(el),
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]", root).forEach((el) => {
          gsap.from(el.children, {
            autoAlpha: 0,
            y: REVEAL.y,
            duration: REVEAL.duration,
            ease: REVEAL.ease,
            stagger: REVEAL.stagger,
            scrollTrigger: once(el),
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-draw]", root).forEach((el) => {
          gsap.from(el, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1,
            ease: "power2.inOut",
            scrollTrigger: once(el),
          });
        });

        gsap.utils.toArray<SVGTextElement>("[data-han-stroke] text", root).forEach((el) => {
          gsap
            .timeline({ scrollTrigger: once(el) })
            .fromTo(
              el,
              { strokeDashoffset: 900, fillOpacity: 0 },
              { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" },
            )
            .to(el, { fillOpacity: 1, duration: 0.6, ease: "power1.out" }, "-=0.5");
        });
      });
      return () => mm.revert();
    },
    { scope },
  );
}
