import { chapterHref } from "@/data/pages";
import { spread } from "@/data/spread";

const MIN = 0;
const MAX = 1500;
const ticks = [100, 500, 900, 1300];
const dynasties = ["Hán", "Đường", "Tống", "Minh"];
const pos = (year: number) => `${((year - MIN) / (MAX - MIN)) * 100}%`;

/**
 * When each invention appeared in China and when it spread abroad.
 * Top: one lane per invention on a shared year axis. Below: the same events as lists.
 */
export function Timeline() {
  return (
    <div>
      <div data-reveal className="surface p-s5">
        <div className="flex flex-wrap items-center justify-between gap-s3">
          <p className="kicker text-muted-foreground">Năm (Công nguyên)</p>
          <Legend />
        </div>
        <p className="mt-s2 text-caption text-muted-foreground">{dynasties.join(" → ")}</p>

        <div className="mt-s5 space-y-s4" role="list">
          {spread.map((s) => {
            const years = s.events.map((e) => e.year);
            const from = Math.min(...years);
            const to = Math.max(...years);
            return (
              <div
                key={s.id}
                role="listitem"
                className="grid grid-cols-[5.5rem_1fr] items-center gap-s3 sm:grid-cols-[7rem_1fr]"
              >
                <a href={chapterHref(s.id)} className="text-small font-semibold hover:text-primary">
                  {s.label}
                </a>
                <div
                  className="relative h-6"
                  role="img"
                  aria-label={`${s.label}: ${s.events.map((e) => `${e.when} ${e.label}`).join("; ")}`}
                >
                  <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                  <div
                    data-draw
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
                    style={{
                      left: pos(from),
                      width: `calc(${pos(to)} - ${pos(from)})`,
                      background: `color-mix(in oklab, ${s.color} 45%, transparent)`,
                    }}
                  />
                  {s.events.map((e) => (
                    <span
                      key={e.label + e.when}
                      title={`${e.when} · ${e.label}`}
                      className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                        e.kind === "origin"
                          ? "border-primary bg-primary"
                          : "border-foreground/70 bg-card"
                      }`}
                      style={{ left: pos(e.year) }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div
          aria-hidden
          className="mt-s3 grid grid-cols-[5.5rem_1fr] gap-s3 sm:grid-cols-[7rem_1fr]"
        >
          <span />
          <div className="relative h-5 border-t border-border">
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute top-1 -translate-x-1/2 text-caption text-muted-foreground tabular-nums"
                style={{ left: pos(t) }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ol data-reveal-stagger className="grid-12 mt-s5">
        {spread.map((s) => (
          <li key={s.id} className="surface col-span-12 p-s5 sm:col-span-6 lg:col-span-3">
            <p className="flex items-center gap-s2 font-display text-h4 font-bold">
              <span
                aria-hidden
                className="h-1 w-6 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </p>
            <ol className="mt-s3 space-y-s2 border-l border-border pl-s4">
              {[...s.events]
                .sort((a, b) => a.year - b.year)
                .map((e) => (
                  <li key={e.label + e.when} className="relative text-small">
                    <span
                      aria-hidden
                      className={`absolute -left-[calc(var(--spacing-s4)+0.3125rem)] top-[0.55em] h-2.5 w-2.5 rounded-full border-2 ${
                        e.kind === "origin"
                          ? "border-primary bg-primary"
                          : "border-foreground/70 bg-card"
                      }`}
                    />
                    <span className="font-semibold tabular-nums">{e.when}</span>
                    <span className="sr-only">
                      {e.kind === "origin" ? " (xuất hiện)" : " (lan truyền)"}
                    </span>
                    {" · "}
                    {e.label}
                  </li>
                ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Legend() {
  return (
    <p className="flex flex-wrap items-center gap-s4 text-caption text-muted-foreground">
      <span className="inline-flex items-center gap-s2">
        <span aria-hidden className="h-3 w-3 rounded-full border-2 border-primary bg-primary" />
        Xuất hiện ở Trung Hoa
      </span>
      <span className="inline-flex items-center gap-s2">
        <span aria-hidden className="h-3 w-3 rounded-full border-2 border-foreground/70 bg-card" />
        Lan truyền ra ngoài
      </span>
    </p>
  );
}
