import { useRef } from "react";
import type { Invention } from "@/data/inventions";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Seal } from "./Seal";
import { FlipCard } from "./FlipCard";
import { HanStroke } from "./HanStroke";
import { TiltCard } from "./TiltCard";

export function InventionSection({ data, index }: { data: Invention; index: number }) {
  const root = useRef<HTMLElement>(null);
  useScrollReveal(root);

  return (
    <section
      id={data.id}
      ref={root}
      className={`relative overflow-hidden border-t border-border ${
        index % 2 === 0 ? "bg-[var(--paper-deep)]/60" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <header className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-5">
            <Seal han={data.han} size="lg" />
            <div className="min-w-0 flex-1">
              <p data-reveal="up" className="eyebrow text-muted-foreground">
                Phần {index} · Phụ trách: {data.owner}
              </p>
              <h2 data-reveal="up" className="section-title mt-2">
                {data.name}
              </h2>
              <p data-reveal="up" className="mt-2 max-w-2xl text-lg text-muted-foreground">
                {data.tagline}
              </p>
            </div>
          </div>
          <div data-parallax="14" className="hidden justify-self-end md:block">
            <HanStroke han={data.han} className="h-36 text-foreground lg:h-44" />
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute -top-6 right-0 font-display text-[7rem] leading-none font-bold text-foreground/[0.04] md:hidden"
          >
            {String(index).padStart(2, "0")}
          </span>
        </header>
        <div data-draw className="rule-brush mt-8" />

        {/* ① Giới thiệu */}
        <Block num="①" title="Giới thiệu">
          <div className="grid items-start gap-10 md:grid-cols-2">
            <ul data-reveal-stagger className="space-y-4">
              {data.intro.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rotate-45 bg-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div data-reveal="right">
              <TiltCard>
                <figure className="paper-card p-3">
                  <div className="overflow-hidden">
                    <img
                      src={data.image}
                      alt={data.name}
                      loading="lazy"
                      width={1024}
                      height={640}
                      data-parallax="6"
                      className="w-full scale-[1.14]"
                    />
                  </div>
                  <figcaption className="mt-2 text-xs text-muted-foreground">
                    {data.imageCaption}
                  </figcaption>
                </figure>
              </TiltCard>
            </div>
          </div>
        </Block>

        {/* ② Ý nghĩa */}
        <Block num="②" title="Ý nghĩa & ảnh hưởng">
          <div data-reveal-stagger className="grid gap-5 md:grid-cols-3">
            <Cell label="Với Trung Hoa" text={data.impact.china} />
            <Cell label="Với thế giới" text={data.impact.world} />
            <Cell label="Với Việt Nam" text={data.impact.vietnam} />
          </div>
          <div data-reveal="up" className="mt-6 border-l-4 border-celadon bg-accent p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground">
              Nhận xét của nhóm
            </p>
            <p className="mt-2">{data.groupNote}</p>
          </div>
        </Block>

        {/* ③ Nguồn & phản tư AI */}
        <Block num="③" title="Nguồn & phản tư AI">
          <div className="grid gap-10 lg:grid-cols-2">
            <div data-reveal="left">
              <h4 className="font-display text-lg">Nguồn sơ cấp</h4>
              <figure
                className="paper-card relative mt-3 overflow-hidden p-5 sm:p-6"
                style={{ backgroundColor: "var(--paper-deep)" }}
              >
                <span
                  aria-hidden
                  className="absolute -left-1 -top-6 font-display text-8xl leading-none text-primary/15"
                >
                  “
                </span>
                <blockquote className="relative font-display italic leading-relaxed">
                  “{data.primary.quote}”
                </blockquote>
                <figcaption className="mt-3 text-sm text-muted-foreground">
                  — {data.primary.source}
                </figcaption>
              </figure>
              <p className="mt-3 text-[0.95rem]">{data.primary.reading}</p>

              <h4 className="mt-8 font-display text-lg">Nguồn thứ cấp</h4>
              <ul className="mt-2 space-y-1 text-[0.95rem] text-muted-foreground">
                {data.secondary.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>

            <div data-reveal="right">
              <h4 className="font-display text-lg">Phản tư khi dùng AI</h4>
              <div data-reveal-stagger className="paper-card mt-3 space-y-3 p-4">
                <Bubble role="Câu lệnh 1">{data.ai.prompt1}</Bubble>
                <Bubble role="AI trả lời" muted>
                  <Struck text={data.ai.answer1} wrong={data.ai.wrong} />
                </Bubble>
                <Bubble role="Câu lệnh 2">{data.ai.prompt2}</Bubble>
                <Bubble role="AI trả lời (đã sửa)" muted>
                  {data.ai.answer2}
                </Bubble>
                <p className="border-t border-border pt-3 text-sm text-bronze">
                  ✓ {data.ai.verified}
                </p>
              </div>
            </div>
          </div>
        </Block>

        {/* ④ Câu hỏi tương tác */}
        <Block num="④" title="Câu hỏi tương tác">
          <div data-reveal-stagger className="grid gap-5 md:grid-cols-2">
            <FlipCard front={data.askTeacher.front} back={data.askTeacher.back} />
            <FlipCard
              front={data.askClass.front}
              back={data.askClass.back}
              hint={data.askClass.hint}
            />
          </div>
        </Block>
      </div>
    </section>
  );
}

function Block({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-16">
      <h3 data-reveal="left" className="flex items-center gap-3 text-2xl">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-lg text-primary-foreground shadow-[0_6px_16px_-6px_var(--seal)]">
          {num}
        </span>
        {title}
      </h3>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Cell({ label, text }: { label: string; text: string }) {
  return (
    <TiltCard max={6} className="h-full">
      <div className="paper-card h-full border-t-2 border-t-[var(--gold)] p-5 sm:p-6">
        <p className="font-display text-base font-bold text-bronze">{label}</p>
        <p className="mt-2 text-[0.98rem]">{text}</p>
      </div>
    </TiltCard>
  );
}

function Bubble({
  role,
  children,
  muted,
}: {
  role: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-[4px] p-3 ${muted ? "ml-4 bg-muted sm:ml-8" : "mr-4 bg-secondary sm:mr-8"}`}
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{role}</p>
      <p className="mt-1 text-[0.95rem]">{children}</p>
    </div>
  );
}

function Struck({ text, wrong }: { text: string; wrong: string }) {
  const i = text.indexOf(wrong);
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary line-through decoration-primary decoration-2">{wrong}</span>
      {text.slice(i + wrong.length)}
    </>
  );
}
