import { useEffect, useRef, useState } from "react";
import type { ChapterData } from "../content/content";
import { useTrack, trackY } from "../lib/track";
import { register } from "../lib/stops";
import { ScrollTrigger, reducedMotion } from "../lib/motion";
import { setYear, setYearMode } from "../lib/year";
import { play } from "../lib/audio";
import { Seal } from "./Seal";
import { InkImage } from "./InkImage";
import { PrimarySource, renderCite } from "./PrimarySource";
import { ProcessPin } from "./ProcessPin";
import { Invention3D } from "./Invention3D";
import { InventionEmblem } from "./InventionEmblem";
import { SpreadMap } from "./SpreadMap";
import { AIReflection } from "./AIReflection";
import { Discussion } from "./study/Study";
import { Cloud, CornerFret, OrnamentDivider } from "./Ornaments";

/*
 * One component for all four invention chapters (design.md §8.4), so every
 * presenter gets the same shape: A transition · B opening · C why · D how ·
 * E process · F spread · G significance · H sources & AI · I questions.
 */
export function Chapter({ data }: { data: ChapterData }) {
  const body = useRef<HTMLDivElement>(null);

  // while reading, the small counter in the corner shows the landing year
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 60%",
      end: "bottom 40%",
      onToggle: (self) => {
        if (self.isActive) setYear(data.landYear, "corner");
        else setYearMode("hidden");
      },
    });
    return () => st.kill();
  }, [data.landYear]);

  return (
    <div className={`chapter chapter--${data.id}`} data-chapter-name={data.title} data-audio="soft">
      {data.transition && <ChapterTransition data={data} />}
      <div ref={body}>
        <ChapterOpen data={data} />
        <Why data={data} />
        <Origin data={data} />
        <ProcessPin chapter={data} />
        <Invention3D chapter={data} />
        <SpreadMap chapter={data} />
        <Significance data={data} />
        <SourcesAI data={data} />
        <section className="scene" data-stop={`${data.title} · Câu hỏi`} aria-labelledby={`${data.id}-q`} data-dragon="95,5;95,95">
          <div className="scene__inner">
            <h3 id={`${data.id}-q`} className="h2">
              Câu hỏi tương tác
            </h3>
            <Discussion id={data.id} chapter={data.id} teacher={data.questions.teacher} groups={data.questions.groups} hint={data.questions.hint} />
          </div>
        </section>
        <OrnamentDivider className="chapter__end" />
      </div>
    </div>
  );
}

// ---------- A · time runs forward to this chapter's year ----------

function ChapterTransition({ data }: { data: ChapterData }) {
  const track = useRef<HTMLElement>(null);
  const lead = useRef<HTMLDivElement>(null);
  const [stamped, setStamped] = useState(false);
  const still = reducedMotion();
  const brushed = useRef(false);

  useTrack(
    track,
    (p) => {
      if (still) return;
      const t = Math.min(1, p / 0.55);
      const e = 1 - Math.pow(1 - t, 3);
      const y = data.fromYear + (data.landYear - data.fromYear) * e;
      if (p > 0 && p < 1) setYear(y, "center");
      else if (p >= 1) setYear(data.landYear, "corner");
      if (p > 0.02 && !brushed.current) {
        brushed.current = true;
        play("brush", 400);
      }
      if (p < 0.01) brushed.current = false;
      const done = p >= 0.55;
      setStamped((s) => (s === done ? s : done));
      if (lead.current) lead.current.style.opacity = `${Math.min(1, Math.max(0, (p - 0.5) / 0.15))}`;
    },
    [data],
  );

  useEffect(() => {
    const el = () => track.current;
    const offs = [
      register({ id: `${data.id}-tr-0`, label: data.title, getY: () => trackY(el(), 0), autoplay: 1.4 }),
      register({ id: `${data.id}-tr-1`, label: data.title, getY: () => trackY(el(), 0.8) }),
    ];
    return () => offs.forEach((f) => f());
  }, [data]);

  return (
    <section
      ref={track}
      id={data.id}
      className={`transition ${still ? "transition--still" : ""}`}
      data-cinematic
      data-audio="loud"
      aria-label={`Chuyển tới năm ${data.landYear}`}
      data-dragon="3,18;50,26;97,34"
    >
      <div className="transition__sticky">
        <div className="transition__stamp">
          <Seal han={data.dynastySeal} size="md" stamp="none" stampNow={stamped} className={stamped || still ? "is-visible" : ""} />
        </div>
        <div ref={lead} className="transition__lead">
          {data.transition && (
            <>
              <p className="transition__line">{data.transition.lead}</p>
              <p className="transition__note">{data.transition.note}</p>
            </>
          )}
        </div>
        {still && <p className="transition__year">{data.landYear}</p>}
      </div>
    </section>
  );
}

// ---------- B · opening ----------

function ChapterOpen({ data }: { data: ChapterData }) {
  return (
    <section
      id={data.transition ? undefined : `${data.id}-chuong`}
      className="scene open"
      data-stop={`${data.title} · Mở chương`}
      aria-labelledby={`${data.id}-title`}
      data-dragon="94,10;95,90"
      data-dragon-claw="90,40"
    >
      <div className="open__frets" aria-hidden>
        <CornerFret />
        <CornerFret />
      </div>
      <Cloud className="open__cloud" />
      {/* the invention itself, very large behind the title: the hook of the chapter */}
      <InventionEmblem id={data.id} className="open__hero" size={1100} />
      <span className={`open__han ${[...data.han].length > 1 ? "open__han--two" : ""}`} aria-hidden lang="zh-Hant">
        {data.han}
      </span>
      <div className="open__plate">
        <Seal han={data.han} size="md" />
        <div>
          <h2 id={`${data.id}-title`} className="open__title">
            {data.title}
          </h2>
          <p className="open__owner">Phụ trách: {data.owner}</p>
        </div>
      </div>
      <div className="scene__inner open__lead">
        <p className="open__line">{data.open}</p>
      </div>
    </section>
  );
}

// ---------- C · why ----------

function Why({ data }: { data: ChapterData }) {
  return (
    <section className="scene" data-stop={`${data.title} · Vì sao ra đời`} aria-labelledby={`${data.id}-why`} data-dragon="95,5;96,95">
      <div className="scene__inner split">
        <div className="split__text">
          <h3 id={`${data.id}-why`} className="h2">
            Vì sao ra đời
          </h3>
          <ul className="ticks">
            {data.why.map((w) => (
              <li key={w}>{renderCite(w)}</li>
            ))}
          </ul>
        </div>
        <div className="split__aside">
          <InkImage name={data.whyImage} alt={`Minh họa: vì sao ${data.title.toLowerCase()} ra đời`} ratio="4 / 5" ai />
        </div>
      </div>
    </section>
  );
}

// ---------- D · how it was born ----------

function Origin({ data }: { data: ChapterData }) {
  return (
    <section className="scene" data-stop={`${data.title} · Ra đời như thế nào`} aria-labelledby={`${data.id}-origin`} data-dragon="95,5;96,95">
      <div className="scene__inner split split--source">
        <div className="split__text">
          <h3 id={`${data.id}-origin`} className="h2">
            Ra đời như thế nào
          </h3>
          <ul className="ticks">
            {data.origin.map((o) => (
              <li key={o}>{renderCite(o)}</li>
            ))}
          </ul>
        </div>
        <div className="split__aside">
          <p className="label">Nguồn sơ cấp</p>
          <PrimarySource source={data.primary} />
          <div className="reading">
            <p className="label">Diễn giải</p>
            <p>{renderCite(data.reading)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- G · significance ----------

function Significance({ data }: { data: ChapterData }) {
  const cols = [
    { key: "china", title: "Với Trung Hoa", han: "中", text: data.significance.china },
    { key: "world", title: "Với thế giới", han: "世", text: data.significance.world },
    { key: "vietnam", title: "Với Việt Nam", han: "越", text: data.significance.vietnam },
  ];
  return (
    <section className="scene" data-stop={`${data.title} · Ý nghĩa`} aria-labelledby={`${data.id}-sig`} data-dragon="95,5;96,95">
      <div className="scene__inner">
        <h3 id={`${data.id}-sig`} className="h2">
          Ý nghĩa & ảnh hưởng
        </h3>
        <div className="sig">
          {cols.map((c) => (
            <div key={c.key} className={`sig__col sig__col--${c.key}`}>
              <span className="sig__han" aria-hidden lang="zh-Hant">
                {c.han}
              </span>
              <h4 className="sig__title">{c.title}</h4>
              <p>{renderCite(c.text)}</p>
            </div>
          ))}
        </div>
        <aside className="note">
          <Seal han="評" size="sm" className="note__seal" />
          <h4 className="note__title">Nhận xét của nhóm</h4>
          <p>{data.groupNote}</p>
        </aside>
      </div>
    </section>
  );
}

// ---------- H · sources & AI ----------

function SourcesAI({ data }: { data: ChapterData }) {
  return (
    <section className="scene" data-stop={`${data.title} · Nguồn & phản tư AI`} aria-labelledby={`${data.id}-src`} data-dragon="95,5;96,95">
      <div className="scene__inner split split--ai">
        <div className="split__text">
          <h3 id={`${data.id}-src`} className="h2">
            Nguồn & phản tư AI
          </h3>
          {data.extraPrimary && (
            <>
              <p className="label">Nguồn sơ cấp bổ sung</p>
              <p>{renderCite(data.extraPrimary)}</p>
            </>
          )}
          <p className="label">Nguồn thứ cấp</p>
          <ul className="plain">
            {data.secondary.map((s) => (
              <li key={s}>{renderCite(s)}</li>
            ))}
          </ul>
        </div>
        <div className="split__aside">
          <AIReflection ai={data.ai} chapterId={data.id} />
        </div>
      </div>
    </section>
  );
}
