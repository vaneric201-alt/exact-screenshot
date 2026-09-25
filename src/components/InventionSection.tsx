import type { Invention } from "@/data/inventions";
import { Seal } from "./Seal";
import { FlipCard } from "./FlipCard";

export function InventionSection({ data, index }: { data: Invention; index: number }) {
  return (
    <section id={data.id} className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <header className="flex flex-wrap items-center gap-5">
          <Seal han={data.han} size="lg" />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Phần {index} · Phụ trách: {data.owner}
            </p>
            <h2 className="mt-1 text-3xl sm:text-[2.5rem]">{data.name}</h2>
            <p className="text-muted-foreground">{data.tagline}</p>
          </div>
        </header>
        <div className="rule-brush mt-6" />

        {/* ① Giới thiệu */}
        <Block num="①" title="Giới thiệu">
          <div className="grid gap-8 md:grid-cols-2">
            <ul className="space-y-3">
              {data.intro.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <figure className="paper-card p-3">
              <img
                src={data.image}
                alt={data.name}
                loading="lazy"
                width={1024}
                height={640}
                className="w-full"
              />
              <figcaption className="mt-2 text-xs text-muted-foreground">{data.imageCaption}</figcaption>
            </figure>
          </div>
        </Block>

        {/* ② Ý nghĩa */}
        <Block num="②" title="Ý nghĩa & ảnh hưởng">
          <div className="grid gap-5 md:grid-cols-3">
            <Cell label="Với Trung Hoa" text={data.impact.china} />
            <Cell label="Với thế giới" text={data.impact.world} />
            <Cell label="Với Việt Nam" text={data.impact.vietnam} />
          </div>
          <div className="mt-5 border-l-4 border-celadon bg-accent p-5">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground">
              Nhận xét của nhóm
            </p>
            <p className="mt-2">{data.groupNote}</p>
          </div>
        </Block>

        {/* ③ Nguồn & phản tư AI */}
        <Block num="③" title="Nguồn & phản tư AI">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h4 className="font-display text-lg">Nguồn sơ cấp</h4>
              <figure className="paper-card mt-3 p-5" style={{ backgroundColor: "var(--paper-deep)" }}>
                <blockquote className="font-display italic leading-relaxed">“{data.primary.quote}”</blockquote>
                <figcaption className="mt-3 text-sm text-muted-foreground">— {data.primary.source}</figcaption>
              </figure>
              <p className="mt-3 text-[0.95rem]">{data.primary.reading}</p>

              <h4 className="mt-8 font-display text-lg">Nguồn thứ cấp</h4>
              <ul className="mt-2 space-y-1 text-[0.95rem] text-muted-foreground">
                {data.secondary.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display text-lg">Phản tư khi dùng AI</h4>
              <div className="paper-card mt-3 space-y-3 p-4">
                <Bubble role="Câu lệnh 1">{data.ai.prompt1}</Bubble>
                <Bubble role="AI trả lời" muted>
                  <Struck text={data.ai.answer1} wrong={data.ai.wrong} />
                </Bubble>
                <Bubble role="Câu lệnh 2">{data.ai.prompt2}</Bubble>
                <Bubble role="AI trả lời (đã sửa)" muted>
                  {data.ai.answer2}
                </Bubble>
                <p className="border-t border-border pt-3 text-sm text-bronze">✓ {data.ai.verified}</p>
              </div>
            </div>
          </div>
        </Block>

        {/* ④ Câu hỏi tương tác */}
        <Block num="④" title="Câu hỏi tương tác">
          <div className="grid gap-5 md:grid-cols-2">
            <FlipCard front={data.askTeacher.front} back={data.askTeacher.back} />
            <FlipCard front={data.askClass.front} back={data.askClass.back} hint={data.askClass.hint} />
          </div>
        </Block>
      </div>
    </section>
  );
}

function Block({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-12">
      <h3 className="flex items-baseline gap-3 text-xl">
        <span className="text-primary">{num}</span>
        {title}
      </h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Cell({ label, text }: { label: string; text: string }) {
  return (
    <div className="paper-card p-5">
      <p className="font-display text-base font-bold text-bronze">{label}</p>
      <p className="mt-2 text-[0.98rem]">{text}</p>
    </div>
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
    <div className={`rounded-[4px] p-3 ${muted ? "bg-muted" : "bg-secondary"}`}>
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
