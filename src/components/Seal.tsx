import { useEffect, useRef } from "react";
import { play } from "../lib/audio";
import { reducedMotion } from "../lib/motion";

/**
 * The vermilion seal: square, carved-negative characters in paper colour,
 * roughened edge (filter #seal-rough in App). It "stamps" (1.6 → 1 with a
 * small shake) when it enters the frame, or on demand via `stampNow`.
 */
export function Seal({
  han,
  size = "md",
  stamp = "view",
  stampNow = false,
  className = "",
}: {
  han: string;
  size?: "sm" | "md" | "lg";
  stamp?: "view" | "none";
  stampNow?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || stamp === "none" || reducedMotion()) return;
    el.classList.add("seal--armed");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.add("seal--stamped");
          play("stamp", 150);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stamp]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !stampNow || reducedMotion()) return;
    el.classList.remove("seal--stamped");
    void el.offsetWidth;
    el.classList.add("seal--armed", "seal--stamped");
    play("stamp", 150);
  }, [stampNow]);

  const chars = [...han];
  return (
    <span ref={ref} aria-hidden className={`seal seal--${size} ${chars.length > 1 ? "seal--multi" : ""} ${className}`}>
      <span className="seal__ink">
        {chars.map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </span>
    </span>
  );
}
