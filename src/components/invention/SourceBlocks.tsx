import type { Invention } from "@/data/inventions";

/** Primary source: the quote, where it comes from, and the group's reading of it. */
export function PrimarySource({ primary }: { primary: Invention["primary"] }) {
  return (
    <div data-reveal>
      <figure className="surface-sunken relative overflow-hidden p-s5">
        <span
          aria-hidden
          className="absolute -top-4 left-2 font-display text-[6rem] leading-none text-primary/15"
        >
          “
        </span>
        <blockquote className="relative font-display text-lead italic">
          “{primary.quote}”
        </blockquote>
        <figcaption className="mt-s3 text-small text-muted-foreground">
          — {primary.source}
        </figcaption>
      </figure>
      <p className="mt-s4 text-small">{primary.reading}</p>
    </div>
  );
}

/** Secondary sources as a numbered reference list. */
export function SecondarySources({ items }: { items: string[] }) {
  return (
    <ol data-reveal-stagger className="surface divide-y divide-border">
      {items.map((s, i) => (
        <li key={s} className="flex gap-s3 p-s4 text-small">
          <span className="font-semibold text-primary tabular-nums">{i + 1}.</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}
