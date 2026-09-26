import { useRef } from "react";
import { spread } from "@/data/spread";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { Chapter } from "./layout/Chapter";

const routes = spread;

const cities = [
  { name: "Trường An", x: 560, y: 200 },
  { name: "Thăng Long", x: 545, y: 275 },
  { name: "Samarkand", x: 330, y: 200 },
  { name: "Baghdad", x: 245, y: 245 },
  { name: "Venice", x: 130, y: 205 },
];

export function SpreadMap() {
  const root = useRef<HTMLDivElement>(null);

  // Routes are drawn from Trường An westwards as the map scrolls through the viewport,
  // each led by a glowing head. The dashed look is kept by revealing it through a mask.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "[data-map]", start: "top 75%", end: "bottom 45%", scrub: 0.8 },
        });
        tl.from("[data-land]", {
          autoAlpha: 0,
          scale: 0.96,
          transformOrigin: "50% 50%",
          duration: 0.4,
        });
        tl.from(
          "[data-city]",
          { autoAlpha: 0, scale: 0, transformOrigin: "50% 50%", duration: 0.25, stagger: 0.08 },
          0.1,
        );
        routes.forEach((r, i) => {
          const mask = root.current?.querySelector<SVGPathElement>(`[data-route-mask="${r.id}"]`);
          const path = root.current?.querySelector<SVGPathElement>(`[data-route="${r.id}"]`);
          const head = root.current?.querySelector<SVGGElement>(`[data-route-head="${r.id}"]`);
          if (!mask || !path || !head) return;
          const len = path.getTotalLength();
          const state = { p: 0 };
          const place = () => {
            const pt = path.getPointAtLength(state.p * len);
            head.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
          };
          place();
          tl.fromTo(
            mask,
            { strokeDasharray: `${len + 1} ${len + 1}`, strokeDashoffset: len + 1 },
            { strokeDashoffset: 0, duration: 1, ease: "none" },
            0.3 + i * 0.15,
          );
          tl.fromTo(
            state,
            { p: 0 },
            { p: 1, duration: 1, ease: "none", onUpdate: place },
            0.3 + i * 0.15,
          );
          tl.fromTo(head, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.3 + i * 0.15);
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <Chapter id="lan-truyen" tagline="Bốn phát minh đi từ Trung Hoa ra thế giới" tone="deep">
      <div ref={root} className="mt-block">
        <div data-reveal className="surface-raised overflow-x-auto p-s4 sm:p-s5">
          <svg data-map viewBox="0 0 640 360" className="h-auto w-full min-w-[560px]">
            <defs>
              {routes.map((r) => (
                <mask key={r.id} id={`route-mask-${r.id}`} maskUnits="userSpaceOnUse">
                  <path
                    data-route-mask={r.id}
                    d={r.d}
                    fill="none"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="butt"
                  />
                </mask>
              ))}
              <filter id="route-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <path
              data-land
              d="M60 150 C 120 110, 200 120, 260 140 C 330 165, 420 150, 500 160 C 545 166, 590 185, 600 230 C 585 285, 520 300, 470 285 C 400 265, 330 300, 260 290 C 190 280, 120 250, 70 215 Z"
              fill="color-mix(in oklab, var(--celadon) 18%, transparent)"
              stroke="color-mix(in oklab, var(--foreground) 25%, transparent)"
            />
            {routes.map((r) => (
              <g key={r.id}>
                <path
                  data-route={r.id}
                  d={r.d}
                  fill="none"
                  stroke={r.color}
                  strokeWidth="2.5"
                  strokeDasharray="7 6"
                  strokeLinecap="round"
                  mask={`url(#route-mask-${r.id})`}
                />
                <g data-route-head={r.id} style={{ visibility: "hidden" }}>
                  <circle r="7" fill={r.color} opacity="0.45" filter="url(#route-glow)" />
                  <circle r="3.5" fill={r.color} />
                </g>
              </g>
            ))}
            {cities.map((c) => (
              <g key={c.name} data-city>
                <circle cx={c.x} cy={c.y} r="4" fill="var(--foreground)" />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="8"
                  fill="none"
                  stroke="var(--foreground)"
                  strokeOpacity="0.25"
                />
                <text
                  x={c.x}
                  y={c.y - 12}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--foreground)"
                  fontFamily="var(--font-sans)"
                  fontWeight="600"
                >
                  {c.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <ul data-reveal-stagger className="grid-12 mt-s5">
          {routes.map((r) => (
            <li key={r.id} className="surface col-span-12 p-s5 sm:col-span-6 lg:col-span-3">
              <p className="flex items-center gap-s2 font-display text-h4 font-bold">
                <span
                  aria-hidden
                  className="h-1 w-6 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                {r.label}
              </p>
              <p className="mt-s2 text-small text-muted-foreground">{r.stops.join(" → ")}</p>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}
