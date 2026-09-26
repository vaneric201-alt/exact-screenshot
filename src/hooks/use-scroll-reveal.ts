import type { RefObject } from "react";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

/**
 * Scroll-driven reveals for a section, opted in with data attributes:
 * - data-reveal="up" | "left" | "right" | "scale"  → fade + move in once
 * - data-reveal-stagger                            → children reveal one after another
 * - data-parallax="12"                              → yPercent drift while crossing the viewport
 * - data-draw                                       → horizontal rule grows from the left
 * Nothing runs when the user prefers reduced motion, so content stays static and visible.
 */
export function useScrollReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]", root).forEach((el) => {
          const kind = el.dataset["reveal"];
          const from: gsap.TweenVars = { autoAlpha: 0 };
          if (kind === "left") from.x = -48;
          else if (kind === "right") from.x = 48;
          else if (kind === "scale") from.scale = 0.92;
          else from.y = 40;
          gsap.from(el, {
            ...from,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal-stagger]", root).forEach((el) => {
          gsap.from(el.children, {
            autoAlpha: 0,
            y: 28,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-draw]", root).forEach((el) => {
          gsap.from(el, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1.2,
            ease: "power2.inOut",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-parallax]", root).forEach((el) => {
          const amount = Number(el.dataset["parallax"]) || 10;
          gsap.fromTo(
            el,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        gsap.utils.toArray<SVGTextElement>("[data-han-stroke] text", root).forEach((el) => {
          gsap
            .timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } })
            .fromTo(
              el,
              { strokeDashoffset: 900, fillOpacity: 0 },
              { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" },
            )
            .to(el, { fillOpacity: 1, duration: 0.8, ease: "power1.out" }, "-=0.6");
        });
      });
      return () => mm.revert();
    },
    { scope },
  );
}
