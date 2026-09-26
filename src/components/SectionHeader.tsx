import type { ReactNode } from "react";

/** Common heading block: eyebrow, title, subtitle, animated brush rule and a ghost Han glyph. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  ghost,
  light,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  ghost?: string;
  light?: boolean;
}) {
  return (
    <header className="relative">
      {ghost && (
        <span
          aria-hidden
          data-parallax="18"
          className={`han pointer-events-none absolute -top-10 right-0 select-none text-[clamp(6rem,4rem+10vw,12rem)] leading-none ${
            light ? "text-[var(--background)]/[0.06]" : "text-foreground/[0.05]"
          }`}
        >
          {ghost}
        </span>
      )}
      {eyebrow && (
        <p data-reveal="up" className="eyebrow text-primary">
          {eyebrow}
        </p>
      )}
      <h2 data-reveal="up" className="section-title mt-2">
        {title}
      </h2>
      {subtitle && (
        <p data-reveal="up" className="mt-2 text-sm text-muted-foreground">
          {subtitle}
        </p>
      )}
      <div data-draw className="rule-brush mt-6" />
    </header>
  );
}
