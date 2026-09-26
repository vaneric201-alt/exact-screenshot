import { useRef } from "react";
import { motion } from "motion/react";
import { HeroCanvas } from "./HeroCanvas";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { chapters, chapterNum } from "@/data/chapters";
import { chapterHref, pageByNum } from "@/data/pages";

const inventionIds = ["giay", "laban", "thuocsung", "in"];
const tiles = chapters.filter((c) => inventionIds.includes(c.id));

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
} as const;

export function Cover() {
  const root = useRef<HTMLElement>(null);

  // The title block eases up and fades as the hero scrolls away.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.to("[data-hero-content]", {
          yPercent: -12,
          autoAlpha: 0.2,
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
      aria-labelledby="bia-title"
      className="hero-lacquer relative isolate flex min-h-[calc(100svh-var(--topbar-h))] items-center overflow-hidden text-on-dark lg:min-h-svh"
    >
      <HeroCanvas />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,color-mix(in_oklab,var(--ink)_75%,transparent)_0%,transparent_65%)]"
      />

      <div className="page relative z-10 py-section">
        <div className="grid-12">
          <div data-hero-content className="col-span-12 lg:col-span-7">
            <p className="kicker text-gold">Bài thuyết trình Lịch sử</p>
            <h1
              id="bia-title"
              className="animate-ink mt-s4 text-display text-on-dark drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
            >
              Trung Hoa cổ đại <span className="text-gold">–</span> Nền văn minh của sáng chế
            </h1>
            <div className="mt-s5 h-px max-w-md bg-gradient-to-r from-gold to-transparent" />
            <p className="mt-s5 text-small text-on-dark-muted">
              Nhóm 4 · Nguyễn Anh Dũng · Trần Minh Tuấn · Lê Gia Hưng · Đào Quang Anh · Môn Lịch sử
            </p>

            <motion.ol
              variants={list}
              initial="hidden"
              animate="show"
              aria-label="Bốn phát minh"
              className="mt-s6 grid max-w-xl grid-cols-2 gap-s3 sm:grid-cols-4"
            >
              {tiles.map((c) => (
                <motion.li key={c.id} variants={item}>
                  <a
                    href={chapterHref(c.id)}
                    className="surface-dark group flex h-full flex-col p-s4 transition-colors duration-[var(--dur-base)] hover:border-gold hover:bg-seal/40"
                  >
                    <span className="text-caption tabular-nums text-gold">{chapterNum(c.num)}</span>
                    <span aria-hidden className="han mt-s1 text-h1 leading-none text-on-dark">
                      {c.han}
                    </span>
                    <span className="mt-s2 text-small text-on-dark-muted group-hover:text-on-dark">
                      {c.label}
                    </span>
                    <span className="mt-s1 text-caption text-gold/80">
                      Trang {c.page} · {pageByNum(c.page).presenter.split(" ").slice(-2).join(" ")}
                    </span>
                  </a>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute bottom-s5 left-1/2 h-12 w-px -translate-x-1/2 overflow-hidden bg-gold/25"
      >
        <span className="block h-1/2 w-full animate-[scroll-cue_1.8s_ease-in-out_infinite] bg-gold" />
      </div>
    </section>
  );
}
