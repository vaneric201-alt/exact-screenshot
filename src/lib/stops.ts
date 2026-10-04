import { scrollToY, stopWheel } from "./motion";

/*
 * Presentation mode (design.md §10). Stops come from two places:
 *  - any element with data-stop (its top edge, minus the nav),
 *  - scenes that register points inside pinned sections (register()).
 * Arrow keys / Space / PageUp-Down step between stops; clickers send PageUp/Down.
 */
export interface Stop {
  id: string;
  label: string;
  getY: () => number;
  /** Seconds: scroll to the *next* stop over this duration (auto-played scenes). */
  autoplay?: number;
}

const registered = new Map<string, Stop>();
let active = false;
let index = 0;
const listeners = new Set<() => void>();

export function register(stop: Stop) {
  registered.set(stop.id, stop);
  return () => {
    registered.delete(stop.id);
  };
}

function chapterName(el: Element | null) {
  return (el?.closest("[data-chapter-name]") as HTMLElement | null)?.dataset["chapterName"] ?? "";
}

export function allStops(): Stop[] {
  const dom: Stop[] = Array.from(document.querySelectorAll<HTMLElement>("[data-stop]")).map((el, i) => ({
    id: el.id || `stop-${i}`,
    label: el.dataset["stop"] || chapterName(el),
    getY: () => el.getBoundingClientRect().top + window.scrollY - (el.dataset["stopOffset"] ? Number(el.dataset["stopOffset"]) : 0),
    ...(el.dataset["stopAutoplay"] ? { autoplay: Number(el.dataset["stopAutoplay"]) } : {}),
  }));
  return [...dom, ...registered.values()].sort((a, b) => a.getY() - b.getY());
}

function nearestIndex(stops: Stop[]) {
  const y = window.scrollY + 4;
  let best = 0;
  stops.forEach((s, i) => {
    if (s.getY() <= y) best = i;
  });
  return best;
}

export function go(delta: number) {
  const stops = allStops();
  if (!stops.length) return;
  const cur = nearestIndex(stops);
  const from = stops[cur]!;
  const target = Math.max(0, Math.min(stops.length - 1, cur + delta));
  const to = stops[target]!;
  index = target;
  const duration = delta > 0 && from.autoplay ? from.autoplay : 1.2;
  scrollToY(Math.max(0, to.getY()), duration, Boolean(delta > 0 && from.autoplay));
  listeners.forEach((f) => f());
}

export function setPresentation(on: boolean) {
  active = on;
  stopWheel(false);
  document.documentElement.classList.toggle("presenting", on);
  if (on) index = nearestIndex(allStops());
  listeners.forEach((f) => f());
}

export function isPresenting() {
  return active;
}

export function status() {
  const stops = allStops();
  const i = active ? nearestIndex(stops) : index;
  return { index: i, total: stops.length, label: stops[i]?.label ?? "" };
}

export function onPresentation(f: () => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}

export function installKeys() {
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key === "p" || e.key === "P") {
      setPresentation(!active);
      return;
    }
    if (!active) return;
    // Space/Enter on a focused control belongs to that control (flip cards, quiz)
    if (t && (t.tagName === "BUTTON" || t.tagName === "A") && (e.key === " " || e.key === "Enter")) return;
    if (e.key === "Escape") {
      setPresentation(false);
      return;
    }
    const next = ["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key);
    const prev = ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key);
    if (next || prev) {
      e.preventDefault();
      go(next ? 1 : -1);
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (active) e.preventDefault();
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("wheel", onWheel, { passive: false });
  const tick = window.setInterval(() => active && listeners.forEach((f) => f()), 600);
  return () => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("wheel", onWheel);
    window.clearInterval(tick);
  };
}
