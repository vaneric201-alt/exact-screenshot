const chars = [
  { han: "紙", id: "giay", label: "Giấy" },
  { han: "指南", id: "laban", label: "La bàn" },
  { han: "火藥", id: "thuocsung", label: "Thuốc súng" },
  { han: "印", id: "in", label: "Kỹ thuật in" },
];

export function Cover() {
  return (
    <section id="bia" className="relative overflow-hidden border-b border-border">
      <CloudPattern />
      <div className="relative mx-auto max-w-5xl px-4 py-14 text-center sm:py-20">
        <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Bài thuyết trình Lịch sử</p>
        <h1 className="animate-ink mt-4 text-4xl leading-tight sm:text-6xl">
          Trung Hoa cổ đại <span className="text-primary">–</span> Nền văn minh của sáng chế
        </h1>
        <div className="rule-brush mx-auto mt-8 max-w-xl" />
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-10">
          {chars.map((c) => (
            <li key={c.id}>
              <a href={`#${c.id}`} className="group block text-center">
                <span className="han block text-5xl transition-colors group-hover:text-primary sm:text-7xl">
                  {c.han}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground group-hover:text-primary">
                  {c.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted-foreground">
          Nhóm 4 · Nguyễn Anh Dũng · Trần Minh Tuấn · Lê Gia Hưng · Đào Quang Anh · Môn Lịch sử
        </p>
      </div>
    </section>
  );
}

function CloudPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -right-10 -top-6 h-56 w-56 text-bronze opacity-[0.12]"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path d="M10 60c0-8 6-12 12-10 2-9 12-12 18-6 5-7 16-5 18 4 9-1 14 6 12 13" />
      <path d="M22 76c0-6 5-9 10-7 2-7 10-9 14-4 4-5 13-4 14 4 7-1 11 5 9 10" />
      <circle cx="70" cy="30" r="14" />
    </svg>
  );
}
