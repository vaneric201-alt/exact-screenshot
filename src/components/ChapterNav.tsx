import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { chapters, chapterNum } from "@/data/chapters";

/** Reading line: a chapter becomes active once its top passes 35% of the viewport. */
const LINE = 0.35;

function useChapterProgress() {
  const [active, setActive] = useState<string | null>(null);
  const local = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * LINE;
      let current: string | null = null;
      let rect: DOMRect | null = null;
      for (const c of chapters) {
        const r = document.getElementById(c.id)?.getBoundingClientRect();
        if (r && r.top <= line) {
          current = c.id;
          rect = r;
        }
      }
      setActive(current);
      local.set(rect ? Math.min(1, Math.max(0, (line - rect.top) / rect.height)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [local]);

  return { active, local };
}

/**
 * Sticky chapter navigator: a side rail on desktop, a compact top bar with a
 * drop-down chapter list on mobile. Both highlight the active chapter and show progress.
 */
export function ChapterNav() {
  const { active, local } = useChapterProgress();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  const angle = useTransform(progress, [0, 1], [0, 360]);

  return (
    <>
      <SideRail active={active} local={local} progress={progress} angle={angle} />
      <TopBar active={active} progress={progress} angle={angle} />
    </>
  );
}

type NavProps = {
  active: string | null;
  progress: MotionValue<number>;
  angle: MotionValue<number>;
};

function Brand({ angle }: { angle: MotionValue<number> }) {
  return (
    <a href="#bia" className="flex min-w-0 items-center gap-s3">
      <Compass angle={angle} />
      <span className="min-w-0 font-display font-bold leading-tight">
        Trung Hoa cổ đại
        <span className="block text-caption font-normal text-muted-foreground">Bốn phát minh</span>
      </span>
    </a>
  );
}

function SideRail({ active, local, progress, angle }: NavProps & { local: MotionValue<number> }) {
  const pct = useTransform(progress, (v) => `${Math.round(v * 100)}%`);
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-rail flex-col border-r border-border bg-background/95 backdrop-blur-md lg:flex">
      <div className="border-b border-border px-s5 py-s4">
        <Brand angle={angle} />
      </div>
      <nav aria-label="Mục lục" className="flex-1 overflow-y-auto px-s3 py-s4">
        <ol className="space-y-s1">
          {chapters.map((c) => {
            const on = active === c.id;
            return (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={on ? "location" : undefined}
                  className={`relative grid grid-cols-[2rem_1fr] items-baseline gap-s2 rounded-md px-s3 py-s2 text-small transition-colors duration-[var(--dur-base)] ${
                    on
                      ? "bg-card font-semibold text-foreground shadow-e1"
                      : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="rail-active"
                      aria-hidden
                      className="absolute inset-y-s2 left-0 w-[3px] rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  )}
                  <span className={`tabular-nums ${on ? "text-primary" : ""}`}>
                    {chapterNum(c.num)}
                  </span>
                  <span>
                    {c.label}
                    {on && (
                      <span
                        aria-hidden
                        className="mt-s1 block h-0.5 overflow-hidden rounded-full bg-border"
                      >
                        <motion.span
                          className="block h-full origin-left bg-primary"
                          style={{ scaleX: local }}
                        />
                      </span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="border-t border-border px-s5 py-s4">
        <p className="flex items-center justify-between text-caption text-muted-foreground">
          <span>Tiến độ</span>
          <motion.span className="tabular-nums">{pct}</motion.span>
        </p>
        <div aria-hidden className="mt-s2 h-1 overflow-hidden rounded-full bg-border">
          <motion.div
            style={{ scaleX: progress }}
            className="h-full origin-left bg-gradient-to-r from-primary to-gold"
          />
        </div>
      </div>
    </aside>
  );
}

function TopBar({ active, progress, angle }: NavProps) {
  const [open, setOpen] = useState(false);
  const current = chapters.find((c) => c.id === active);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 h-topbar border-b border-border bg-background/90 backdrop-blur-md lg:hidden">
      <div className="page flex h-full items-center gap-s3">
        {current ? (
          <a href="#bia" className="flex min-w-0 flex-1 items-center gap-s3">
            <Compass angle={angle} />
            <span className="min-w-0 truncate font-display font-bold">
              <span className="tabular-nums text-primary">{chapterNum(current.num)}</span>{" "}
              {current.label}
            </span>
          </a>
        ) : (
          <div className="min-w-0 flex-1">
            <Brand angle={angle} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="chapter-menu"
          className="inline-flex min-h-11 shrink-0 items-center gap-s2 rounded-md border border-border bg-card px-s3 text-small font-semibold"
        >
          Mục lục
          <motion.span aria-hidden animate={{ rotate: open ? 180 : 0 }}>
            ▾
          </motion.span>
        </button>
      </div>
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="absolute inset-x-0 -bottom-px h-[3px] origin-left bg-gradient-to-r from-primary via-gold to-primary"
      />
      <AnimatePresence>
        {open && (
          <motion.nav
            id="chapter-menu"
            aria-label="Mục lục"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full max-h-[70svh] overflow-y-auto border-b border-border bg-background shadow-e3"
          >
            <ol className="page grid grid-cols-2 gap-s2 py-s4">
              {chapters.map((c) => {
                const on = active === c.id;
                return (
                  <li key={c.id}>
                    <a
                      href={`#${c.id}`}
                      onClick={() => setOpen(false)}
                      aria-current={on ? "location" : undefined}
                      className={`flex min-h-11 items-center gap-s2 rounded-md border px-s3 text-small ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card"
                      }`}
                    >
                      <span className={`tabular-nums ${on ? "" : "text-primary"}`}>
                        {chapterNum(c.num)}
                      </span>
                      {c.label}
                    </a>
                  </li>
                );
              })}
            </ol>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Compass({ angle }: { angle: MotionValue<number> }) {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-bronze/60"
    >
      <motion.svg viewBox="0 0 32 32" className="h-6 w-6" style={{ rotate: angle }}>
        <polygon points="16,5 19,16 16,14 13,16" fill="var(--seal)" />
        <polygon points="16,27 13,16 16,18 19,16" fill="var(--bronze)" />
        <circle cx="16" cy="16" r="1.6" fill="var(--foreground)" />
      </motion.svg>
    </span>
  );
}
