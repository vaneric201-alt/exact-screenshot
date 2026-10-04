import { useEffect, useRef } from "react";
import type { EmblemId } from "../three/models/emblems";

/** A small turning 3D model of the invention, set beside a chapter title. */
export function InventionEmblem({ id, className = "", size = 360 }: { id: EmblemId; className?: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let off: (() => void) | undefined;
    let dead = false;
    // build only when the title is about to come on screen
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        near.disconnect();
        void import("../three/emblems/renderer").then(({ mountEmblem }) => {
          if (!dead) off = mountEmblem(c, id, size);
        });
      },
      { rootMargin: "150% 0px" },
    );
    near.observe(c);
    return () => {
      dead = true;
      near.disconnect();
      off?.();
    };
  }, [id, size]);
  return <canvas ref={ref} className={`emblem ${className}`} aria-hidden />;
}
