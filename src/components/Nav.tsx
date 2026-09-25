import { useEffect, useState } from "react";

const items = [
  { id: "mo-dau", label: "Mở đầu" },
  { id: "giay", label: "Giấy" },
  { id: "laban", label: "La bàn" },
  { id: "thuocsung", label: "Thuốc súng" },
  { id: "in", label: "Kỹ thuật in" },
  { id: "lan-truyen", label: "Lan truyền" },
  { id: "cau-do", label: "Câu đố" },
  { id: "ket-luan", label: "Kết luận" },
  { id: "nguon", label: "Nguồn" },
];

export function Nav() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("mo-dau");

  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      let current = items[0].id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= 140) current = it.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/92 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <Compass angle={progress * 360} />
          <a href="#bia" className="font-display text-base font-bold leading-tight sm:text-lg">
            Trung Hoa cổ đại<span className="text-muted-foreground"> · Bốn phát minh</span>
          </a>
        </div>
        <nav className="ml-auto flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          {items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className={`rounded-[3px] px-2 py-1 transition-colors hover:text-primary ${
                active === it.id
                  ? "bg-primary text-primary-foreground hover:text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {it.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Compass({ angle }: { angle: number }) {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-bronze/60"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6" style={{ transform: `rotate(${angle}deg)` }}>
        <polygon points="16,5 19,16 16,14 13,16" fill="var(--seal)" />
        <polygon points="16,27 13,16 16,18 19,16" fill="var(--bronze)" />
        <circle cx="16" cy="16" r="1.6" fill="var(--foreground)" />
      </svg>
    </span>
  );
}
