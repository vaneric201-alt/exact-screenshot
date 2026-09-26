import { useRef } from "react";
import { motion } from "motion/react";
import { HeroCanvas } from "./HeroCanvas";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";

const chars = [
  { han: "紙", id: "giay", label: "Giấy" },
  { han: "指南", id: "laban", label: "La bàn" },
  { han: "火藥", id: "thuocsung", label: "Thuốc súng" },
  { han: "印", id: "in", label: "Kỹ thuật in" },
];

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.6 } },
};
const item = {
  hidden: { opacity: 0, y: 24, rotateX: -35 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { type: "spring", stiffness: 140, damping: 16 },
  },
} as const;

export function Cover() {
  const root = useRef<HTMLElement>(null);

  // Content drifts up and fades as the hero scrolls away.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.to("[data-hero-content]", {
          yPercent: -18,
          autoAlpha: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      id="bia"
      ref={root}
      className="hero-lacquer relative isolate flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden text-[var(--paper-deep)]"
    >
      <HeroCanvas />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--ink)_70%,transparent)_0%,transparent_60%)]"
      />

      <div
        data-hero-content
        className="relative z-10 mx-auto w-full max-w-5xl px-4 py-20 text-center sm:py-28"
      >
        <p className="eyebrow text-[var(--gold)]">Bài thuyết trình Lịch sử</p>
        <h1 className="animate-ink mx-auto mt-5 max-w-4xl text-[clamp(2.4rem,1.2rem+5vw,5rem)] leading-[1.05] text-balance text-[var(--background)] drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
          Trung Hoa cổ đại <span className="text-gold-sheen">–</span> Nền văn minh của sáng chế
        </h1>
        <div className="mx-auto mt-8 h-px max-w-xl bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-70" />

        <motion.ul
          variants={list}
          initial="hidden"
          animate="show"
          className="mt-10 grid grid-cols-2 gap-3 [perspective:800px] sm:flex sm:flex-wrap sm:items-stretch sm:justify-center sm:gap-5"
        >
          {chars.map((c) => (
            <motion.li key={c.id} variants={item}>
              <motion.a
                href={`#${c.id}`}
                whileHover={{ y: -6, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="group block rounded-md border border-[color-mix(in_oklab,var(--gold)_35%,transparent)] bg-[color-mix(in_oklab,var(--ink)_45%,transparent)] px-5 py-4 text-center backdrop-blur-sm transition-colors hover:border-[var(--gold)] hover:bg-[color-mix(in_oklab,var(--seal)_35%,transparent)] sm:min-w-36"
              >
                <span className="han block text-5xl text-[var(--background)] transition-colors group-hover:text-[var(--gold)] sm:text-6xl">
                  {c.han}
                </span>
                <span className="mt-1 block text-sm text-[color-mix(in_oklab,var(--background)_75%,transparent)] group-hover:text-[var(--background)]">
                  {c.label}
                </span>
              </motion.a>
            </motion.li>
          ))}
        </motion.ul>

        <p className="mt-10 text-sm text-[color-mix(in_oklab,var(--background)_70%,transparent)]">
          Nhóm 4 · Nguyễn Anh Dũng · Trần Minh Tuấn · Lê Gia Hưng · Đào Quang Anh · Môn Lịch sử
        </p>
      </div>

      <div
        aria-hidden
        className="absolute bottom-6 left-1/2 h-12 w-px -translate-x-1/2 overflow-hidden bg-[color-mix(in_oklab,var(--gold)_25%,transparent)]"
      >
        <span className="block h-1/2 w-full animate-[scroll-cue_1.8s_ease-in-out_infinite] bg-[var(--gold)]" />
      </div>
    </section>
  );
}
