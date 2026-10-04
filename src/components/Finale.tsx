import { useEffect, useRef, useState } from "react";
import { finale, members, meta } from "../content/content";
import { setYear } from "../lib/year";
import { fadeOutBgm } from "../lib/audio";
import { Seal } from "./Seal";
import { imageCredits } from "../content/imageCredits";
import { audioCredits } from "../content/audioCredits";
import { RedFrets } from "./Ornaments";
import { renderStars } from "./PrimarySource";
import { StudyModes } from "./study/Study";
import { LanceForward } from "./LanceForward";
import { ModernShow } from "./ModernShow";
import { Ignite } from "./Ignite";

/*
 * Page 6: quiz; the fire lance fires time forward to 2026; the four inventions
 * today in 3D, ending in the flash of an explosion; the conclusion; fireworks;
 * the thanks; then AI transparency and sources as an appendix.
 */

export function Finale() {
  return (
    <div data-chapter-name="Hội tụ">
      <Quiz />
      <LanceForward />
      <ModernShow />
      <Conclusion />
      <Ignite caption={finale.fireworks} thanks={finale.closing.thanks} />
      <Closing />
      <Transparency />
      <Sources />
    </div>
  );
}

// ---------- quiz: four study modes ----------

function Quiz() {
  return (
    <section id="cau-do" className="quiz" data-stop="Câu đố" data-audio="soft" aria-labelledby="quiz-title" data-dragon="96,4;96,96">
      <RedFrets />
      <div className="scene__inner">
        <header className="quiz__head">
          <h2 id="quiz-title" className="h2">
            Câu đố
          </h2>
          <p className="quiz__owner">Phụ trách: {finale.quiz.owner}</p>
          <p className="quiz__intro">Bốn cách ôn lại cả bài: trả lời trắc nghiệm, lật thẻ ghi nhớ, thi ghép thẻ nhanh và xếp dòng thời gian.</p>
        </header>
        <StudyModes ranks={finale.quiz.ranks} />
      </div>
    </section>
  );
}

// ---------- conclusion & AI transparency ----------

function Conclusion() {
  return (
    <>
      <section className="scene era-bg era-bg--calligraphy concl--after-flash" data-stop="Kết luận" data-audio="soft" aria-labelledby="concl-title" data-dragon="95,4;95,96">
        <div className="scene__inner">
          <h2 id="concl-title" className="h2">
            Kết luận
          </h2>
          <p className="owner-line">Phụ trách: {finale.conclusion.owner}</p>
          <ol className="messages">
            {finale.conclusion.messages.map((m) => (
              <li key={m.han}>
                <Seal han={m.han} size="sm" />
                <div>
                  <h3 className="h3">{m.title}</h3>
                  <p>{m.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

function Transparency() {
  return (
    <>
      <section id="minh-bach-ai" className="scene" data-stop="Minh bạch về AI" aria-labelledby="ai-open" data-dragon="95,4;95,96">
        <div className="scene__inner">
          <div className="transparency">
            <header className="transparency__head">
              <Seal han="明" size="sm" stamp="none" />
              <div>
                <h2 id="ai-open" className="h2">
                  Minh bạch về AI
                </h2>
                <p className="transparency__intro">{finale.transparency.intro}</p>
              </div>
            </header>
            <div className="transparency__table" role="table" aria-label="AI đã làm gì, con người đã làm gì">
              <div className="transparency__row transparency__row--head" role="row">
                <span role="columnheader">Việc</span>
                <span role="columnheader">AI đã làm</span>
                <span role="columnheader">Con người kiểm soát</span>
              </div>
              {finale.transparency.rows.map((r) => (
                <div key={r.task} className="transparency__row" role="row">
                  <span role="rowheader" className="transparency__task">
                    {r.task}
                  </span>
                  <span role="cell" className="transparency__ai">
                    {r.ai}
                  </span>
                  <span role="cell" className="transparency__people">
                    {r.people}
                  </span>
                </div>
              ))}
            </div>
            <ul className="transparency__rules">
              {finale.transparency.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

// ---------- sources ----------

function Sources() {
  const s = finale.sources;
  return (
    <section id="nguon" className="scene era-bg era-bg--calligraphy" data-stop="Nguồn tham khảo" aria-labelledby="src-title" data-dragon="95,4;95,96">
      <div className="scene__inner">
        <h2 id="src-title" className="h2">
          Nguồn tham khảo
        </h2>
        <p className="owner-line">Phụ trách: {s.owner}</p>
        <div className="sources">
          <div>
            <h3 className="h3">Sơ cấp</h3>
            <ul className="plain">
              {s.primary.map((x) => (
                <li key={x}>{renderStars(x)}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="h3">Thứ cấp</h3>
            <ul className="plain">
              {s.secondary.map((x) => (
                <li key={x}>{renderStars(x)}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="sources__extra">
          <strong>Nguồn ảnh:</strong> {s.images}
        </p>
        <ImageCredits />
        <p className="sources__extra">
          <strong>Mô hình 3D</strong> (Sketchfab, giấy phép CC BY 4.0, đã nén lại cho web):
        </p>
        <ul className="audio-credits">
          {s.models.map((m) => (
            <li key={m.url}>
              {m.what}: “{m.title}” — {m.author} —{" "}
              <a href={m.url} target="_blank" rel="noreferrer">
                CC BY 4.0
              </a>
            </li>
          ))}
        </ul>
        <p className="sources__extra">
          <strong>Âm thanh</strong> (Wikimedia Commons):
        </p>
        <ul className="audio-credits">
          {audioCredits.map((a) => (
            <li key={a.page}>
              {a.what} — {a.artist} —{" "}
              <a href={a.page} target="_blank" rel="noreferrer">
                {a.license}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Every archival image with its author and licence (CC BY / BY-SA require it). */
function ImageCredits() {
  const seen = new Set<string>();
  const list = Object.values(imageCredits).filter((c) => (seen.has(c.title) ? false : (seen.add(c.title), true)));
  return (
    <details className="credits">
      <summary>Danh sách ảnh tư liệu ({list.length})</summary>
      <ol className="credits__list">
        {list.map((c) => (
          <li key={c.slot}>
            <span className="credits__alt">{c.alt}</span> — {c.artist} —{" "}
            {c.licenseUrl ? (
              <a href={c.licenseUrl} target="_blank" rel="noreferrer">
                {c.license}
              </a>
            ) : (
              c.license
            )}{" "}
            —{" "}
            <a href={c.page} target="_blank" rel="noreferrer">
              Wikimedia Commons
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

// ---------- closing ----------

function Closing() {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && !on) {
          setOn(true);
          fadeOutBgm(4000);
          setYear(2026, "hidden");
        }
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [on]);
  return (
    <section ref={ref} className="closing" data-stop="Khép lại" aria-labelledby="closing-title" data-dragon="50,10">
      <RedFrets />
      <div className="closing__frame">
        <span className="closing__eye" data-dragon-eye aria-hidden />
        <Seal han="傳" size="lg" stamp="none" stampNow={on} />
        <h2 id="closing-title" className="closing__title">
          {finale.closing.title}
        </h2>
        <p className="closing__thanks">{finale.closing.thanks}</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="scene__inner">
        <p className="footer__title">
          {meta.title} – {meta.subtitle}
        </p>
        <table className="footer__table">
          <caption className="visually-hidden">Thành viên và phần phụ trách</caption>
          <thead>
            <tr>
              <th scope="col">Thành viên</th>
              <th scope="col">Phụ trách</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td>{m.part}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footer__class">{meta.classLine}</p>
      </div>
    </footer>
  );
}
