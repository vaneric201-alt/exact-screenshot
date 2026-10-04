import { useEffect, useState } from "react";
import { IconClose, IconMenu, IconMute, IconPresent, IconSound } from "./Icons";
import { isMuted, onMuted, setMuted } from "../lib/audio";
import { isPresenting, onPresentation, setPresentation } from "../lib/stops";
import { scrollToY } from "../lib/motion";

const items = [
  { id: "mo-dau", label: "Mở đầu" },
  { id: "giay", label: "Giấy" },
  { id: "in", label: "Kỹ thuật in" },
  { id: "thuocsung", label: "Thuốc súng" },
  { id: "laban", label: "La bàn" },
  { id: "hoi-tu", label: "Hội tụ" },
  { id: "cau-do", label: "Câu đố" },
  { id: "nguon", label: "Nguồn" },
];

export function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  scrollToY(el.getBoundingClientRect().top + window.scrollY, 1.4);
}

export function Nav() {
  const [active, setActive] = useState("mo-dau");
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(false);
  const [muted, setM] = useState(isMuted());
  const [presenting, setP] = useState(isPresenting());

  useEffect(() => onMuted(setM), []);
  useEffect(() => onPresentation(() => setP(isPresenting())), []);

  useEffect(() => {
    let near = false;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = window.innerHeight * 0.45;
      let current = items[0]!.id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= mid) current = it.id;
      }
      setActive(current);
      const cinematic = Array.from(document.querySelectorAll("[data-cinematic]")).some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
      setHidden(cinematic && !near);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const onMove = (e: PointerEvent) => {
      const n = e.clientY < 90;
      if (n !== near) {
        near = n;
        onScroll();
      }
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const go = (id: string) => {
    setOpen(false);
    jumpTo(id);
  };

  return (
    <header className={`nav ${hidden && !open ? "nav--hidden" : ""}`}>
      <a
        className="nav__title"
        href="#mo-dau"
        onClick={(e) => {
          e.preventDefault();
          go("mo-dau");
        }}
      >
        Trung Hoa cổ đại
      </a>
      <nav aria-label="Các phần" className={`nav__links ${open ? "nav__links--open" : ""}`}>
        <ol>
          {items.map((it) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={active === it.id ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(it.id);
                }}
              >
                {active === it.id && <span className="nav__seal" aria-hidden />}
                {it.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="nav__tools">
        <button type="button" className="icon-btn" onClick={() => setMuted(!muted)} aria-label={muted ? "Bật âm thanh (M)" : "Tắt âm thanh (M)"}>
          {muted ? <IconMute /> : <IconSound />}
        </button>
        <button
          type="button"
          className={`icon-btn ${presenting ? "icon-btn--on" : ""}`}
          onClick={() => setPresentation(!presenting)}
          aria-pressed={presenting}
          aria-label="Chế độ thuyết trình (P)"
        >
          <IconPresent />
        </button>
        <button type="button" className="icon-btn nav__burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Đóng menu" : "Mở menu"}>
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>
    </header>
  );
}
