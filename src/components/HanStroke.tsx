/**
 * Han character drawn as an ink outline, then filled (animation driven by
 * useScrollReveal via the data-han-stroke hook). Without motion it renders filled.
 */
export function HanStroke({ han, className = "" }: { han: string; className?: string }) {
  const w = 100 * [...han].length;
  return (
    <svg
      aria-hidden
      data-han-stroke
      viewBox={`0 0 ${w} 100`}
      className={`overflow-visible ${className}`}
      style={{ aspectRatio: `${w} / 100` }}
    >
      <text
        x={w / 2}
        y="54"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="86"
        className="han"
        fill="currentColor"
        stroke="var(--seal)"
        strokeWidth="1.4"
        strokeDasharray="900"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {han}
      </text>
    </svg>
  );
}
