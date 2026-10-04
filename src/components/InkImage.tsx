import { useState } from "react";
import { imageCredits } from "../content/imageCredits";

/** Where to anchor the crop for images whose subject is off-centre. */
const FOCUS: Record<string, string> = {
  "rewind-1351": "50% 6%",
  "forward-caolun": "50% 25%",
  "rewind-xuanthu": "50% 100%",
  "compass-4": "50% 15%",
};

/**
 * An image slot. It loads /img/<name>.webp; until the group adds that file,
 * an ink-line placeholder with the file name keeps the layout presentable.
 */
export function InkImage({
  name,
  alt,
  ratio = "4 / 3",
  ai = false,
  caption,
  className = "",
  eager = false,
  hideCredit = false,
}: {
  name: string;
  alt: string;
  ratio?: string;
  /** Show "Minh họa tạo bằng AI" under a loaded image. */
  ai?: boolean;
  caption?: string;
  className?: string;
  eager?: boolean;
  /** Leave out the short licence line (the full list is in the Sources section). */
  hideCredit?: boolean;
}) {
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  // a documented archival image is never labelled as AI; it carries its licence instead
  const credit = imageCredits[name];
  const showAi = ai && !credit && state === "ok";
  const showCredit = credit && state === "ok" && !hideCredit;
  return (
    <figure className={`ink-image ${className}`} style={{ aspectRatio: ratio }}>
      {state !== "missing" && (
        <img
          src={`/img/${name}.webp`}
          alt={credit?.alt ?? alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setState("ok")}
          onError={() => setState("missing")}
          style={{ opacity: state === "ok" ? 1 : 0, objectPosition: FOCUS[name] }}
        />
      )}
      {state !== "ok" && (
        <div className="ink-image__placeholder" role="img" aria-label={alt}>
          <svg viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden>
            <path d="M3 4 C 30 2.5, 70 3.5, 97 3 L 96.5 71 C 70 72.5, 30 71.5, 3.5 72 Z" />
            <path d="M3 4 L 20 22 M97 3 L 80 22 M3.5 72 L 20 54 M96.5 71 L 80 54" className="thin" />
          </svg>
          <span className="ink-image__name">{alt}</span>
          <span className="ink-image__file">img/{name}.webp</span>
        </div>
      )}
      {(caption || showAi || showCredit) && (
        <figcaption>
          {caption}
          {showAi && <span className="ink-image__ai">Minh họa tạo bằng AI</span>}
          {showCredit && (
            <span className="ink-image__credit">
              {credit.artist} · {credit.license} · Wikimedia Commons
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
