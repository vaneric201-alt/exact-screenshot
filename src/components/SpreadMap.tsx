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
  return (
    <section id="lan-truyen" className="border-t border-border bg-[var(--paper-deep)]">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl sm:text-[2.5rem]">Bản đồ lan truyền</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bốn phát minh đi từ Trung Hoa ra thế giới</p>
        <div className="rule-brush mt-6" />

        <div className="paper-card mt-8 overflow-x-auto p-4">
          <svg viewBox="0 0 640 360" className="h-auto w-full min-w-[620px]">
            <path
              d="M60 150 C 120 110, 200 120, 260 140 C 330 165, 420 150, 500 160 C 545 166, 590 185, 600 230 C 585 285, 520 300, 470 285 C 400 265, 330 300, 260 290 C 190 280, 120 250, 70 215 Z"
              fill="color-mix(in oklab, var(--celadon) 18%, transparent)"
              stroke="color-mix(in oklab, var(--foreground) 25%, transparent)"
            />
            {routes.map((r) => (
              <path
                key={r.id}
                d={r.d}
                fill="none"
                stroke={r.color}
                strokeWidth="2.5"
                strokeDasharray="7 6"
                strokeLinecap="round"
              />
            ))}
            {cities.map((c) => (
              <g key={c.name}>
                <circle cx={c.x} cy={c.y} r="4" fill="var(--foreground)" />
                <text
                  x={c.x}
                  y={c.y - 9}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--foreground)"
                  fontFamily="var(--font-sans)"
                >
                  {c.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {routes.map((r) => (
            <li key={r.id} className="paper-card p-4">
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
