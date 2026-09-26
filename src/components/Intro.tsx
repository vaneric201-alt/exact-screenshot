import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { gsap, useGSAP, MOTION_OK } from "@/lib/gsap";
import { SectionHeader } from "./SectionHeader";
import { TiltCard } from "./TiltCard";

const marks = [
  { year: "105", label: "Thái Luân cải tiến giấy", pos: 8 },
  { year: "868", label: "Kinh Kim Cương – bản in sớm nhất", pos: 42 },
  { year: "1044", label: "Vũ kinh tổng yếu – công thức thuốc súng", pos: 66 },
  { year: "1088", label: "Mộng Khê bút đàm – kim chỉ nam & chữ rời", pos: 78 },
];

const dynasties = ["Hán", "Đường", "Tống", "Minh"];

export function Intro() {
  const [hover, setHover] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  useScrollReveal(root);

  // Timeline: the brush line sweeps across, then the year markers drop in.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ scrollTrigger: { trigger: "[data-timeline]", start: "top 80%", once: true } })
          .from("[data-timeline-line]", {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1.4,
            ease: "power2.inOut",
          })
          .from(
            "[data-timeline-mark]",
            { autoAlpha: 0, y: -24, duration: 0.6, ease: "back.out(2)", stagger: 0.18 },
            "-=0.9",
          )
          .from(
            "[data-timeline-dynasty]",
            { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.1 },
            "-=0.8",
          );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="mo-dau" ref={root} className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <SectionHeader title="Mở đầu" subtitle="Phụ trách: Nguyễn Anh Dũng" ghost="始" />

        <div className="mt-10 grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div data-reveal-stagger className="space-y-4 text-[1.05rem]">
            <p>
              Trong hơn một nghìn năm, Trung Hoa là một trong những trung tâm kỹ thuật lớn nhất thế
              giới. Bốn phát minh thường được nhắc tới nhiều nhất là <strong>giấy</strong>,{" "}
              <strong>la bàn</strong>, <strong>thuốc súng</strong> và <strong>kỹ thuật in</strong>.
            </p>
            <p>
              Điều đáng chú ý không nằm ở việc ai làm ra trước, mà ở chỗ cả bốn đều là những công cụ
              nền: chúng thay đổi cách con người ghi nhớ, đi lại, chiến đấu và truyền bá tri thức.
            </p>
            <p>
              Bài của nhóm đi theo bốn phần đều nhau, mỗi phần gồm giới thiệu, ý nghĩa, nguồn tư
              liệu kèm phần phản tư khi dùng AI, và một câu hỏi tương tác.
            </p>
          </div>

          <div data-reveal="scale">
            <TiltCard>
              <figure className="paper-card relative overflow-hidden p-6 sm:p-8">
                <span className="han absolute right-4 top-2 text-6xl text-muted-foreground/20">
                  言
                </span>
                <blockquote className="font-display text-lg italic leading-relaxed sm:text-xl">
                  “Ba phát minh này đã làm thay đổi bộ mặt và tình trạng của toàn thế giới: thứ nhất
                  là nghề in, thứ hai là thuốc súng, thứ ba là la bàn.”
                </blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  — Francis Bacon, <em>Novum Organum</em>, 1620
                </figcaption>
              </figure>
            </TiltCard>
          </div>
        </div>

        <div className="mt-20" data-timeline>
          <h3 data-reveal="left" className="text-2xl">
            Dòng thời gian
          </h3>
          <div className="relative mt-12 pb-20">
            <div
              data-timeline-line
              className="h-[3px] rounded-full bg-gradient-to-r from-transparent via-foreground/50 to-transparent"
            />
            <div className="mt-4 flex justify-between text-sm text-muted-foreground">
              {dynasties.map((d) => (
                <span key={d} data-timeline-dynasty className="font-display">
                  {d}
                </span>
              ))}
            </div>
            {marks.map((m) => (
              <button
                key={m.year}
                type="button"
                data-timeline-mark
                className="group absolute top-0 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${m.pos}%` }}
                onMouseEnter={() => setHover(m.year)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(m.year)}
                onBlur={() => setHover(null)}
              >
                <span className="relative mx-auto block h-4 w-4 rounded-full bg-primary ring-4 ring-background transition-transform duration-300 group-hover:scale-125 group-focus-visible:scale-125">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 motion-reduce:hidden" />
                </span>
                <span className="mt-2 block font-display text-sm font-bold text-primary">
                  {m.year}
                </span>
                <AnimatePresence>
                  {hover === m.year && (
                    <motion.span
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-1/2 top-full z-10 mt-2 w-48 paper-card p-2 text-xs leading-snug"
                      style={{ x: "-50%" }}
                    >
                      {m.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
