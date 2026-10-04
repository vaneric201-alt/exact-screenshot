import { useEffect, useRef } from "react";
import { formatYearLabel, onYear } from "../lib/year";

/** Global year counter: small in the top-right corner, large in the centre during time jumps. */
export function YearCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      onYear((y, mode, label) => {
        const el = ref.current;
        if (!el || !num.current) return;
        el.dataset["mode"] = mode;
        num.current.textContent = label ?? formatYearLabel(y);
      }),
    [],
  );
  return (
    <div ref={ref} className="year-counter" data-mode="hidden" aria-hidden>
      <span ref={num}>2026</span>
    </div>
  );
}
