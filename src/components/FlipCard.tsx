import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export function FlipCard({ front, back, hint }: { front: string; back: string; hint?: string }) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const frontBtn = useRef<HTMLButtonElement>(null);
  const backBtn = useRef<HTMLButtonElement>(null);

  const flip = (next: boolean) => {
    setOpen(next);
    // Move focus to the face that just turned towards the reader.
    requestAnimationFrame(() =>
      (next ? backBtn : frontBtn).current?.focus({ preventScroll: true }),
    );
  };

  return (
    <div className="h-full [perspective:1400px]">
      <motion.div
        className="grid h-full min-h-48 preserve-3d"
        initial={false}
        animate={{ rotateY: open ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 14, mass: 0.9 }}
      >
        {/* Front */}
        <motion.button
          ref={frontBtn}
          type="button"
          onClick={() => flip(true)}
          aria-expanded={open}
          inert={open}
          className="surface-raised group relative flex flex-col items-start justify-between overflow-hidden p-s5 text-left backface-hidden [grid-area:1/1]"
        >
          <span
            aria-hidden
            className="han pointer-events-none absolute -bottom-6 -right-2 text-[6rem] leading-none text-primary/10"
          >
            問
          </span>
          <span className="relative font-display text-h3 font-bold">{front}</span>
          <span className="relative mt-s5 inline-flex items-center gap-s2 text-small font-semibold text-primary">
            Bấm để lật thẻ →
          </span>
        </motion.button>

        {/* Back */}
        <div
          inert={!open}
          className="surface-raised flex flex-col border-t-4 border-t-primary p-s5 backface-hidden [grid-area:1/1] [transform:rotateY(180deg)]"
        >
          <span className="kicker text-muted-foreground">{front}</span>
          <p className="mt-s2 flex-1">{back}</p>
          <div className="mt-s4 flex flex-wrap items-center gap-s3 text-small">
            <button
              ref={backBtn}
              type="button"
              onClick={() => flip(false)}
              className="min-h-11 text-muted-foreground transition-colors hover:text-primary"
            >
              ← Lật lại
            </button>
            {hint && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowHint((v) => !v)}
                aria-expanded={showHint}
                className={`min-h-11 rounded-sm border border-primary px-s3 transition-colors ${
                  showHint ? "bg-primary text-primary-foreground" : "text-primary"
                }`}
              >
                Xem gợi ý
              </motion.button>
            )}
          </div>
          <AnimatePresence initial={false}>
            {hint && showHint && (
              <motion.div
                key="hint"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="mt-s3 rounded-md border-l-4 border-celadon bg-accent p-s3 text-small text-accent-foreground">
                  {hint}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
