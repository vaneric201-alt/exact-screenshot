import { useEffect, useState } from "react";
import { isPresenting, onPresentation, status } from "../lib/stops";

/** Bottom-left indicator in presentation mode: "12 / 48 · Giấy". */
export function PresentationHud() {
  const [s, setS] = useState({ on: false, index: 0, total: 0, label: "" });
  useEffect(
    () =>
      onPresentation(() => {
        const st = status();
        setS({ on: isPresenting(), ...st });
      }),
    [],
  );
  if (!s.on) return null;
  return (
    <div className="hud" role="status">
      <span className="hud__count">
        {s.index + 1} / {s.total}
      </span>
      {s.label && <span className="hud__label">{s.label}</span>}
      <span className="hud__keys">← → · Esc để thoát</span>
    </div>
  );
}
