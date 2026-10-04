/*
 * The global year counter. Scenes write the year; the counter renders it.
 * Writes go straight to the DOM so scrubbed animations never re-render React.
 */
type Mode = "corner" | "corner-lg" | "center" | "hidden";

type Listener = (year: number, mode: Mode, label?: string) => void;

let year = 2026;
let mode: Mode = "hidden";
let label: string | undefined;
const listeners = new Set<Listener>();

export function setYear(y: number, m?: Mode, l?: string) {
  year = y;
  if (m) mode = m;
  label = l;
  listeners.forEach((f) => f(year, mode, label));
}

export function setYearMode(m: Mode) {
  mode = m;
  listeners.forEach((f) => f(year, mode, label));
}

export function onYear(f: Listener) {
  listeners.add(f);
  f(year, mode, label);
  return () => {
    listeners.delete(f);
  };
}

export function formatYearLabel(y: number) {
  const r = Math.round(y);
  return r < 0 ? `${-r} TCN` : `${r}`;
}
