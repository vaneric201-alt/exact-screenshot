/* Brush-weight line icons, drawn in one stroke style (currentColor). */
type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconSound = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z" />
    <path d="M15.6 8.8c1 .9 1.5 2 1.5 3.2s-.5 2.3-1.5 3.2M18.2 6.4c1.6 1.5 2.4 3.4 2.4 5.6s-.8 4.1-2.4 5.6" />
  </svg>
);
export const IconMute = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z" />
    <path d="M16 9.5l4.6 5M20.6 9.5 16 14.5" />
  </svg>
);
export const IconPresent = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3.5 4.5h17M4.8 4.6v9.6c0 .7.5 1.2 1.2 1.2h12c.7 0 1.2-.5 1.2-1.2V4.6M12 15.5v3.4M8.6 20.3l3.4-1.4 3.4 1.4" />
    <path d="M10.2 8.2v4l3.4-2z" />
  </svg>
);
export const IconMenu = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 7.2c5.2-.6 10.6-.5 16 0M4 12.1c5.3.4 10.7.3 16 0M4 16.9c5.2-.5 10.6-.4 16 .1" />
  </svg>
);
export const IconClose = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M6 6.2c4 3.6 8 7.5 12 11.6M18 6c-4.2 3.9-8.1 7.9-11.9 12" />
  </svg>
);
export const IconCheck = ({ className }: P) => (
  <svg {...base} strokeWidth={2.6} className={className}>
    <path d="M4.5 12.8c1.6 1.2 3 2.7 4.3 4.6 2.6-4.6 6-8.7 10.7-12" />
  </svg>
);
export const IconRedo = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M19.2 12a7.2 7.2 0 1 1-2.1-5.1M19.6 4.4v4.4h-4.4" />
  </svg>
);
export const IconPrev = ({ className }: P) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M14.8 5.4c-2.4 2.1-4.6 4.3-6.6 6.6 2 2.3 4.2 4.5 6.6 6.6" />
  </svg>
);
export const IconNext = ({ className }: P) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M9.2 5.4c2.4 2.1 4.6 4.3 6.6 6.6-2 2.3-4.2 4.5-6.6 6.6" />
  </svg>
);
export const IconUp = ({ className }: P) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M5.4 14.8c2.1-2.4 4.3-4.6 6.6-6.6 2.3 2 4.5 4.2 6.6 6.6" />
  </svg>
);
export const IconDown = ({ className }: P) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="M5.4 9.2c2.1 2.4 4.3 4.6 6.6 6.6 2.3-2 4.5-4.2 6.6-6.6" />
  </svg>
);
