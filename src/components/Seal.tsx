import { useEffect, useRef, useState } from "react";

export function Seal({ han, size = "md" }: { han: string; size?: "sm" | "md" | "lg" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStamped(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dim =
    size === "lg"
      ? "h-24 w-24 text-3xl"
      : size === "sm"
        ? "h-10 w-10 text-base"
        : "h-16 w-16 text-xl";

  return (
    <div
      ref={ref}
      aria-hidden
      className={`${dim} ${stamped ? "animate-seal" : "opacity-0"} grid shrink-0 place-items-center rounded-sm bg-seal text-seal-foreground han leading-none tracking-tight`}
      style={{
        boxShadow: "inset 0 0 0 2px color-mix(in oklab, var(--background) 55%, transparent)",
      }}
    >
      <span className="px-1 text-center">{han}</span>
    </div>
  );
}
