import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";

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
  const [active, setActive] = useState("mo-dau");
  const navRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });
  const angle = useTransform(progress, [0, 1], [0, 360]);

  useEffect(() => {
    const onScroll = () => {
      let current = "mo-dau";
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

  // Keep the active item visible in the horizontally scrolling mobile nav.
  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: link.offsetLeft - nav.clientWidth / 2 + link.offsetWidth / 2 });
  }, [active]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex items-center gap-3">
          <Compass angle={angle} />
          <a href="#bia" className="font-display text-base font-bold leading-tight sm:text-lg">
            Trung Hoa cổ đại<span className="text-muted-foreground"> · Bốn phát minh</span>
          </a>
        </div>
        <nav
          ref={navRef}
          aria-label="Mục lục"
          className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 text-sm [scrollbar-width:none] lg:mx-0 lg:ml-auto lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it) => {
            const on = active === it.id;
            return (
              <a
                key={it.id}
                data-id={it.id}
                href={`#${it.id}`}
                aria-current={on ? "location" : undefined}
                className={`relative shrink-0 whitespace-nowrap rounded-[3px] px-2.5 py-1 transition-colors ${
                  on ? "text-primary-foreground" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[3px] bg-primary shadow-[0_4px_14px_-6px_var(--seal)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{it.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="absolute inset-x-0 -bottom-px h-[3px] origin-left bg-gradient-to-r from-primary via-[var(--gold)] to-primary"
      />
    </header>
  );
}

function Compass({ angle }: { angle: MotionValue<number> }) {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-bronze/60"
    >
      <motion.svg viewBox="0 0 32 32" className="h-6 w-6" style={{ rotate: angle }}>
        <polygon points="16,5 19,16 16,14 13,16" fill="var(--seal)" />
        <polygon points="16,27 13,16 16,18 19,16" fill="var(--bronze)" />
        <circle cx="16" cy="16" r="1.6" fill="var(--foreground)" />
      </motion.svg>
    </span>
  );
}
