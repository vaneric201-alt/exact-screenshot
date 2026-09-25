import { useState } from "react";

export function FlipCard({
  front,
  back,
  hint,
}: {
  front: string;
  back: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="paper-card flex min-h-40 flex-col p-5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-start justify-between text-left"
        >
          <span className="font-display text-lg font-bold">{front}</span>
          <span className="mt-6 text-sm text-primary">Bấm để lật thẻ →</span>
        </button>
      ) : (
        <div className="flex flex-1 flex-col">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{front}</span>
          <p className="mt-2 flex-1">{back}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-primary">
              ← Lật lại
            </button>
            {hint && (
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="rounded-[3px] border border-primary px-2 py-1 text-primary"
              >
                Xem gợi ý
              </button>
            )}
          </div>
          {hint && showHint && (
            <p className="mt-3 border-l-2 border-celadon bg-accent p-3 text-sm text-accent-foreground">{hint}</p>
          )}
        </div>
      )}
    </div>
  );
}
