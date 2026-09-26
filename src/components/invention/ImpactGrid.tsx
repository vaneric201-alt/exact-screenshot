import type { Invention } from "@/data/inventions";

const scopes = [
  { key: "china", label: "Với Trung Hoa", mark: "中" },
  { key: "world", label: "Với thế giới", mark: "世" },
  { key: "vietnam", label: "Với Việt Nam", mark: "越" },
] as const;

/** Impact on China / the world / Vietnam as a 3-card grid, followed by the group's note. */
export function ImpactGrid({ impact, note }: { impact: Invention["impact"]; note: string }) {
  return (
    <>
      <ul data-reveal-stagger className="grid-12">
        {scopes.map((s) => (
          <li
            key={s.key}
            className="surface relative col-span-12 overflow-hidden border-t-4 border-t-gold p-s5 md:col-span-4"
          >
            <span
              aria-hidden
              className="han pointer-events-none absolute -right-1 -top-2 text-[4.5rem] leading-none text-foreground/[0.06]"
            >
              {s.mark}
            </span>
            <p className="font-display text-h4 font-bold text-bronze">{s.label}</p>
            <p className="mt-s2 text-small">{impact[s.key]}</p>
          </li>
        ))}
      </ul>
      <aside data-reveal className="mt-s5 rounded-lg border-l-4 border-celadon bg-accent p-s5">
        <p className="kicker text-accent-foreground">Nhận xét của nhóm</p>
        <p className="mt-s2">{note}</p>
      </aside>
    </>
  );
}
