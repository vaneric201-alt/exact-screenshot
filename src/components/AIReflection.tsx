import { useEffect, useRef, useState } from "react";
import type { ChapterData } from "../content/content";
import { play } from "../lib/audio";
import { IconCheck } from "./Icons";

/**
 * The AI-reflection script as four steps: the first question, the mistake AI
 * tends to make (struck through with a red stroke that draws itself), the
 * better question, and the sources the group checked against. A screenshot of
 * a real answer shows up only once the group has put it in /img/ai/…
 */
export function AIReflection({ ai, chapterId }: { ai: ChapterData["ai"]; chapterId: string }) {
  const box = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          el.classList.add("is-struck");
          play("brush", 300);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ol ref={box} className="reflect" aria-label="Phản tư khi dùng AI">
      <li className="reflect__step reflect__step--ask">
        <span className="reflect__n">1</span>
        <div className="reflect__card">
          <p className="reflect__label">Câu hỏi đầu tiên</p>
          <p className="reflect__prompt">“{ai.prompt1}”</p>
          <Shot name={ai.shots[0] ?? `ai/${chapterId}-1`} />
        </div>
      </li>
      <li className="reflect__step reflect__step--wrong">
        <span className="reflect__n">2</span>
        <div className="reflect__card">
          <p className="reflect__label">Lỗi AI hay mắc</p>
          <p className="strike">
            {ai.mistakes}
            <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden>
              <path d="M2 12 C 60 6, 120 15, 180 9 S 260 7, 298 11" pathLength={1} />
            </svg>
          </p>
        </div>
      </li>
      <li className="reflect__step reflect__step--ask">
        <span className="reflect__n">3</span>
        <div className="reflect__card">
          <p className="reflect__label">Hỏi lại, đòi bằng chứng</p>
          <p className="reflect__prompt">“{ai.prompt2}”</p>
          <Shot name={ai.shots[1] ?? `ai/${chapterId}-2`} />
        </div>
      </li>
      <li className="reflect__step reflect__step--ok">
        <span className="reflect__n">
          <IconCheck />
        </span>
        <div className="reflect__card">
          <p className="reflect__label">Nhóm đối chiếu với</p>
          <p className="reflect__verified">{ai.verified}</p>
        </div>
      </li>
    </ol>
  );
}

/** A screenshot of a real AI answer, if the group has added one; nothing otherwise. */
function Shot({ name }: { name: string }) {
  const [ok, setOk] = useState(false);
  const [gone, setGone] = useState(false);
  if (gone) return null;
  return (
    <img
      className="reflect__shot"
      src={`/img/${name}.webp`}
      alt="Ảnh chụp màn hình câu trả lời của AI"
      loading="lazy"
      style={ok ? undefined : { display: "none" }}
      onLoad={() => setOk(true)}
      onError={() => setGone(true)}
    />
  );
}
