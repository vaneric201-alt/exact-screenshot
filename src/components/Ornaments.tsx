/*
 * Traditional ornaments drawn as line work (currentColor), so each surface can
 * tint them: 回纹 key-fret corners and bands, 祥云 auspicious clouds, a round
 * 壽 medallion and a paper-cut rosette. All are decorative (aria-hidden).
 */

/** An L-shaped key-fret corner. Rotate with CSS for the other corners. */
export function CornerFret({ className = "" }: { className?: string }) {
  return (
    <svg className={`orn orn-corner ${className}`} viewBox="0 0 120 120" aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
        <path d="M4 116 V4 H116" />
        <path d="M13 116 V44 M44 13 H116" />
        {/* the 回 spiral at the corner */}
        <path d="M13 44 V13 H44 V38 H20 V20 H37 V31 H27" />
        {/* small returns at the ends of the inner lines */}
        <path d="M116 13 V24 H104 V19" />
        <path d="M13 116 H24 V104 H19" />
        {/* a second, smaller spiral half-way along each arm */}
        <path d="M70 13 V22 H82 V17" />
        <path d="M13 70 H22 V82 H17" />
      </g>
    </svg>
  );
}

/** A horizontal 回 key-pattern band; tiles to any width. */
export function KeyBand({ className = "" }: { className?: string }) {
  return <span className={`orn orn-band ${className}`} aria-hidden />;
}

/** A 祥云 auspicious cloud scroll. */
export function Cloud({ className = "" }: { className?: string }) {
  return (
    <svg className={`orn orn-cloud ${className}`} viewBox="0 0 160 70" aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 58 H132 C146 58 152 46 144 38 C136 30 124 34 124 42 C124 48 132 49 134 44" />
        <path d="M14 58 C4 58 2 44 12 40 C20 37 28 43 26 50 C25 54 20 54 19 51" />
        <path d="M30 44 C28 26 48 18 60 28 C64 12 90 8 98 26 C106 20 120 26 118 38" />
        <path d="M60 28 C68 30 70 42 62 44 C56 45 55 38 60 37" />
        <path d="M98 26 C92 34 96 44 104 42 C109 40 108 34 104 34" />
      </g>
    </svg>
  );
}

/** A round medallion with the character 壽 (long life). */
export function ShouMedallion({ className = "" }: { className?: string }) {
  return (
    <svg className={`orn orn-shou ${className}`} viewBox="0 0 100 100" aria-hidden focusable="false">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 4" />
      <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-han)" fontWeight="900" fontSize="48" fill="currentColor">
        壽
      </text>
    </svg>
  );
}

/** An eight-petal paper-cut rosette. */
export function PaperFlower({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg className={`orn orn-flower ${className}`} viewBox="-50 -50 100 100" aria-hidden focusable="false">
      <g fill="currentColor">
        {petals.map((a) => (
          <path key={a} transform={`rotate(${a})`} d="M0 -12 C10 -20 12 -36 0 -46 C-12 -36 -10 -20 0 -12 Z M0 -20 C4 -24 4 -32 0 -37 C-4 -32 -4 -24 0 -20 Z" fillRule="evenodd" />
        ))}
        <circle r="10" />
      </g>
      <circle r="5" fill="var(--orn-hole, #fff)" />
    </svg>
  );
}

/** A section divider: key-pattern band broken by a cloud. */
export function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`orn-divider ${className}`} aria-hidden>
      <KeyBand />
      <Cloud />
      <KeyBand />
    </div>
  );
}

/** Gold frets in the four corners of a red block, with a 壽 medallion at the foot. */
export function RedFrets() {
  return (
    <div className="red-frets" aria-hidden>
      <CornerFret />
      <CornerFret />
      <CornerFret />
      <CornerFret />
      <ShouMedallion />
    </div>
  );
}

/** Small frets in the corners of a book page. */
export function PageFrets() {
  return (
    <div className="page-frets" aria-hidden>
      <CornerFret />
      <CornerFret />
      <CornerFret />
      <CornerFret />
    </div>
  );
}
