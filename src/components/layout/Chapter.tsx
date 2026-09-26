import { useRef, type ReactNode } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { chapterById, chapterNum } from "@/data/chapters";
import { HanStroke } from "../HanStroke";

/**
 * Shell for every numbered chapter: section landmark, standard vertical rhythm,
 * page container, the shared reveal pattern and the chapter header.
 */
export function Chapter({
  id,
  title,
  owner,
  tagline,
  tone = "plain",
  children,
}: {
  id: string;
  /** Heading; defaults to the chapter label. */
  title?: ReactNode;
  owner?: string | undefined;
  tagline?: ReactNode;
  tone?: "plain" | "deep";
  children: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  useScrollReveal(root);
  const ch = chapterById(id);

  return (
    <section
      id={id}
      ref={root}
      aria-labelledby={`${id}-title`}
      data-chapter={id}
      className={`chapter ${tone === "deep" ? "bg-paper-deep/60" : ""}`}
    >
      <div className="page">
        <ChapterHeader
          id={id}
          num={ch.num}
          han={ch.han}
          title={title ?? ch.label}
          owner={owner}
          tagline={tagline}
        />
        {children}
      </div>
    </section>
  );
}

/** Number · Han character · name · presenter · tagline — identical for every chapter. */
export function ChapterHeader({
  id,
  num,
  han,
  title,
  owner,
  tagline,
}: {
  id: string;
  num: number;
  han: string;
  title: ReactNode;
  owner?: string | undefined;
  tagline?: ReactNode;
}) {
  return (
    <header className="grid-12 items-end">
      <div className="col-span-12 md:col-span-8 lg:col-span-9">
        <p data-reveal className="flex items-center gap-s3">
          <span
            aria-hidden
            className="font-display text-h1 font-bold leading-none text-primary tabular-nums"
          >
            {chapterNum(num)}
          </span>
          <span className="h-px w-8 bg-border" aria-hidden />
          <span className="kicker text-muted-foreground">Phần {chapterNum(num)}</span>
          <span aria-hidden className="han text-h3 text-foreground/70 md:hidden">
            {han}
          </span>
        </p>
        <h2 id={`${id}-title`} data-reveal className="mt-s4 text-h1">
          {title}
        </h2>
        {tagline && (
          <p data-reveal className="mt-s3 max-w-prose text-lead text-muted-foreground">
            {tagline}
          </p>
        )}
        {owner && (
          <p data-reveal className="mt-s4">
            <span className="inline-flex items-center gap-s2 rounded-sm border border-border bg-card px-s3 py-s1 text-small">
              <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-primary" />
              Phụ trách: <strong className="font-semibold">{owner}</strong>
            </span>
          </p>
        )}
      </div>
      <div className="hidden justify-self-end md:col-span-4 md:block lg:col-span-3">
        <HanStroke han={han} className="h-28 text-foreground lg:h-36" />
      </div>
      <div data-draw className="rule-brush col-span-12 mt-s5" />
    </header>
  );
}

/** A numbered step inside a chapter, e.g. "01.3 Ý nghĩa & ảnh hưởng". */
export function Step({
  chapter,
  n,
  title,
  className = "",
  children,
}: {
  chapter: number;
  n: number;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mt-block ${className}`}>
      <h3 data-reveal className="flex items-baseline gap-s3 text-h3">
        <span className="font-sans text-caption font-semibold tracking-widest text-primary tabular-nums">
          {chapterNum(chapter)}.{n}
        </span>
        {title}
      </h3>
      <div className="mt-s5">{children}</div>
    </div>
  );
}
