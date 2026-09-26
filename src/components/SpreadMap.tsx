import { useRef } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { SectionHeader } from "./SectionHeader";

const routes = [
  {
    id: "giay",
    label: "Giấy",
    color: "var(--foreground)",
    d: "M560 190 C 460 150, 330 150, 250 200 C 180 240, 130 250, 90 245",
    stops: ["Triều Tiên 610", "Samarkand 751", "Baghdad 793", "Tây Ban Nha 1150"],
  },
  {
    id: "laban",
    label: "La bàn",
    color: "var(--bronze)",
    d: "M570 230 C 480 300, 360 320, 250 290 C 180 270, 130 270, 95 275",
    stops: ["Đông Nam Á tk XII", "Ả Rập tk XII", "Châu Âu tk XIII"],
  },
  {
    id: "thuocsung",
    label: "Thuốc súng",
    color: "var(--seal)",
    d: "M565 210 C 470 210, 350 230, 255 245 C 185 255, 135 260, 100 260",
    stops: ["Mông Cổ tk XIII", "Ả Rập tk XIII", "Châu Âu tk XIV"],
  },
  {
    id: "in",
    label: "Kỹ thuật in",
    color: "var(--celadon)",
    d: "M575 170 C 500 120, 360 130, 260 175 C 190 205, 140 215, 100 215",
    stops: ["Triều Tiên tk VIII", "Nhật Bản tk VIII", "Châu Âu ~1450"],
  },
];

const cities = [
  { name: "Trường An", x: 560, y: 200 },
  { name: "Thăng Long", x: 545, y: 275 },
  { name: "Samarkand", x: 330, y: 200 },
  { name: "Baghdad", x: 245, y: 245 },
  { name: "Venice", x: 130, y: 205 },
];

export function SpreadMap() {
  const root = useRef<HTMLElement>(null);
  useScrollReveal(root);

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
    <section
      id="lan-truyen"
      ref={root}
      className="relative overflow-hidden border-t border-border bg-[var(--paper-deep)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <SectionHeader
          title="Bản đồ lan truyền"
          subtitle="Bốn phát minh đi từ Trung Hoa ra thế giới"
          ghost="路"
        />

        <div data-reveal="up" className="paper-card mt-10 overflow-x-auto p-4 sm:p-6">
          <svg data-map viewBox="0 0 640 360" className="h-auto w-full min-w-[620px]">
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

        <ul data-reveal-stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {routes.map((r) => (
            <li
              key={r.id}
              className="paper-card p-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="flex items-center gap-2 font-display font-bold">
                <span className="h-1 w-6 rounded" style={{ backgroundColor: r.color }} />
                {r.label}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{r.stops.join(" → ")}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
