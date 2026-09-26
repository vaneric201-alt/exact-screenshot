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
        className="grid h-full min-h-44 preserve-3d"
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
          whileHover={{ y: -3 }}
          className="paper-card group relative flex flex-col items-start justify-between overflow-hidden p-5 text-left backface-hidden [grid-area:1/1] sm:p-6"
        >
          <span
            aria-hidden
            className="han pointer-events-none absolute -bottom-6 -right-2 text-8xl leading-none text-primary/10 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
          >
            問
          </span>
          <span className="relative font-display text-lg font-bold">{front}</span>
          <span className="relative mt-6 inline-flex items-center gap-2 text-sm text-primary">
            Bấm để lật thẻ →
          </span>
        </motion.button>

        {/* Back */}
        <div
          inert={!open}
          className="paper-card flex flex-col border-t-2 border-t-primary p-5 backface-hidden [grid-area:1/1] [transform:rotateY(180deg)] sm:p-6"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{front}</span>
          <p className="mt-2 flex-1">{back}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <button
              ref={backBtn}
              type="button"
              onClick={() => flip(false)}
              className="text-muted-foreground hover:text-primary"
            >
              ← Lật lại
            </button>
            {hint && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setShowHint((v) => !v)}
                aria-expanded={showHint}
                className={`rounded-[3px] border border-primary px-2 py-1 transition-colors ${
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
                <p className="mt-3 border-l-2 border-celadon bg-accent p-3 text-sm text-accent-foreground">
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
