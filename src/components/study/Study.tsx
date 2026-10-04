import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cards as allCards, questions as allQuestions, timeline as timelineEvents, type Card, type Question } from "../../content/study";
import { imageCredits } from "../../content/imageCredits";
import { play } from "../../lib/audio";
import { IconCheck, IconClose, IconDown, IconNext, IconPrev, IconRedo, IconUp } from "../Icons";
import { Seal } from "../Seal";

/*
 * Study modes in the spirit of flashcard apps: a deck that flips, a
 * multiple-choice round with pictures and instant feedback, a timed match
 * game and a timeline to put in order. Keys are handled on the component
 * itself (and stopped there) so presentation mode's arrows keep working
 * everywhere else.
 */

const CHAPTER_NAMES: Record<Card["chapter"], string> = { giay: "Giấy", in: "Kỹ thuật in", thuocsung: "Thuốc súng", laban: "La bàn" };

function shuffle<T>(list: readonly T[], seed = Math.random()) {
  const a = [...list];
  let s = Math.floor(seed * 2 ** 31) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function Pic({ name, className = "" }: { name: string; className?: string }) {
  const c = imageCredits[name];
  return (
    <figure className={`st-pic ${className}`}>
      <img src={`/img/${name}.webp`} alt={c?.alt ?? ""} loading="lazy" decoding="async" />
      {c && <figcaption>{c.alt}</figcaption>}
    </figure>
  );
}

function Progress({ value, label }: { value: number; label: string }) {
  return (
    <div className="st-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label={label}>
      <span style={{ transform: `scaleX(${value})` }} />
    </div>
  );
}

// ---------------- the whole quiz: four modes behind tabs ----------------

type Mode = "learn" | "cards" | "match" | "order";
const MODES: { id: Mode; label: string; han: string }[] = [
  { id: "learn", label: "Trắc nghiệm", han: "問" },
  { id: "cards", label: "Thẻ ghi nhớ", han: "記" },
  { id: "match", label: "Ghép thẻ", han: "配" },
  { id: "order", label: "Dòng thời gian", han: "序" },
];

export function StudyModes({ ranks }: { ranks: readonly { min: number; title: string; han: string }[] }) {
  const [mode, setMode] = useState<Mode>("learn");
  const onTabKey = (e: ReactKeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    e.stopPropagation();
    const next = MODES[(i + (e.key === "ArrowRight" ? 1 : MODES.length - 1)) % MODES.length]!;
    setMode(next.id);
    document.getElementById(`st-tab-${next.id}`)?.focus();
  };
  return (
    <div className="study">
      <div className="st-tabs" role="tablist" aria-label="Chế độ ôn tập">
        {MODES.map((m, i) => (
          <button
            key={m.id}
            id={`st-tab-${m.id}`}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            aria-controls={`st-panel-${m.id}`}
            tabIndex={mode === m.id ? 0 : -1}
            className="st-tab"
            onClick={() => {
              setMode(m.id);
              play("paper", 200);
            }}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            <span className="st-tab__han" aria-hidden lang="zh-Hant">
              {m.han}
            </span>
            {m.label}
          </button>
        ))}
      </div>
      <div id={`st-panel-${mode}`} role="tabpanel" aria-labelledby={`st-tab-${mode}`} className="st-panel">
        {mode === "learn" && <Learn questions={allQuestions} ranks={ranks} />}
        {mode === "cards" && <Flashcards deck={allCards} filters />}
        {mode === "match" && <Match />}
        {mode === "order" && <Order />}
      </div>
    </div>
  );
}

// ---------------- multiple choice ----------------

export function Learn({ questions, ranks }: { questions: readonly Question[]; ranks: readonly { min: number; title: string; han: string }[] }) {
  const [round, setRound] = useState<readonly Question[]>(questions);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missed, setMissed] = useState<Question[]>([]);
  const [done, setDone] = useState(false);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const q = round[i]!;

  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.answer) {
      setRight((r) => r + 1);
      setStreak((s) => s + 1);
      play("stamp", 150);
    } else {
      setStreak(0);
      setMissed((m) => [...m, q]);
      play("drum", 150);
    }
  };
  useEffect(() => {
    if (picked !== null) nextBtn.current?.focus({ preventScroll: true });
  }, [picked]);
  const next = () => {
    if (i + 1 >= round.length) {
      setDone(true);
      play("gate", 500);
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };
  const start = (list: readonly Question[]) => {
    setRound(list);
    setI(0);
    setPicked(null);
    setRight(0);
    setStreak(0);
    setMissed([]);
    setDone(false);
  };
  const onKey = (e: ReactKeyboardEvent) => {
    const n = Number(e.key);
    if (!done && picked === null && n >= 1 && n <= q.options.length) {
      e.preventDefault();
      e.stopPropagation();
      choose(n - 1);
    } else if (!done && picked !== null && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      e.stopPropagation();
      next();
    }
  };

  if (done) {
    const rank = ranks.find((r) => (right / round.length) * 8 >= r.min) ?? ranks[ranks.length - 1]!;
    return (
      <div className="st-card st-result" aria-live="polite">
        <p className="st-result__score">
          {right}
          <small>/{round.length}</small>
        </p>
        <div>
          <h3 className="st-result__rank">
            <Seal han={rank.han} size="sm" stamp="none" stampNow /> {rank.title}
          </h3>
          <p>
            Đúng {right} câu, sai {round.length - right} câu.
          </p>
          <div className="st-row">
            {missed.length > 0 && (
              <button type="button" className="st-btn st-btn--primary" onClick={() => start(missed)}>
                Ôn lại {missed.length} câu sai
              </button>
            )}
            <button type="button" className="st-btn" onClick={() => start(shuffle(questions))}>
              <IconRedo className="st-btn__icon" /> Làm lại từ đầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="st-card st-learn" onKeyDown={onKey}>
      <div className="st-learn__top">
        <span className="st-count">
          Câu {i + 1}
          <small>/{round.length}</small>
        </span>
        <Progress value={(i + (picked !== null ? 1 : 0)) / round.length} label="Tiến độ" />
        <span className={`st-streak ${streak >= 2 ? "is-hot" : ""}`} aria-live="polite">
          Chuỗi đúng <b>{streak}</b>
        </span>
      </div>
      <div className={`st-learn__body ${q.img ? "" : "st-learn__body--noimg"}`}>
        {q.img && <Pic name={q.img} className="st-learn__pic" />}
        <div className="st-learn__main">
          <h3 className="st-q">{q.q}</h3>
          <ol className="st-options">
            {q.options.map((o, k) => {
              const state = picked === null ? "" : k === q.answer ? "is-right" : k === picked ? "is-wrong" : "is-dim";
              return (
                <li key={o}>
                  <button type="button" className={`st-opt ${state}`} onClick={() => choose(k)} disabled={picked !== null} aria-keyshortcuts={String(k + 1)}>
                    <span className="st-opt__key">{k + 1}</span>
                    <span className="st-opt__text">{o}</span>
                    {picked !== null && k === q.answer && <IconCheck className="st-opt__mark" />}
                    {picked === k && k !== q.answer && <IconClose className="st-opt__mark" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <div className={`st-feedback ${picked === null ? "" : picked === q.answer ? "is-right" : "is-wrong"}`} aria-live="polite">
        {picked !== null && (
          <>
            <div>
              <p className="st-feedback__verdict">{picked === q.answer ? "Chính xác!" : `Chưa đúng — đáp án là “${q.options[q.answer]}”.`}</p>
              <p className="st-feedback__explain">{q.explain}</p>
            </div>
            <button ref={nextBtn} type="button" className="st-btn st-btn--primary" onClick={next}>
              {i + 1 >= round.length ? "Xem kết quả" : "Tiếp tục"} <kbd>Enter</kbd>
            </button>
          </>
        )}
        {picked === null && <p className="st-hint">Bấm vào đáp án hoặc phím 1–4.</p>}
      </div>
    </div>
  );
}

// ---------------- flashcards ----------------

export function Flashcards({ deck, filters = false, compact = false }: { deck: readonly Card[]; filters?: boolean; compact?: boolean }) {
  const [chapter, setChapter] = useState<Card["chapter"] | "all">("all");
  const [order, setOrder] = useState<readonly Card[]>(deck);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [learning, setLearning] = useState<Set<string>>(new Set());
  const list = useMemo(() => (chapter === "all" ? order : order.filter((c) => c.chapter === chapter)), [order, chapter]);
  const card = list[Math.min(i, list.length - 1)]!;

  const go = (d: number) => {
    setFlipped(false);
    setI((x) => (x + d + list.length) % list.length);
    play("paper", 120);
  };
  const flip = () => {
    setFlipped((f) => !f);
    play("paper", 120);
  };
  const mark = (k: boolean) => {
    const add = (s: Set<string>) => new Set(s).add(card.term);
    const del = (s: Set<string>) => {
      const n = new Set(s);
      n.delete(card.term);
      return n;
    };
    setKnown((s) => (k ? add(s) : del(s)));
    setLearning((s) => (k ? del(s) : add(s)));
    go(1);
  };
  const onKey = (e: ReactKeyboardEvent) => {
    const map: Record<string, () => void> = { " ": flip, ArrowRight: () => go(1), ArrowLeft: () => go(-1), ArrowUp: flip, ArrowDown: flip };
    const f = map[e.key];
    if (!f) return;
    e.preventDefault();
    e.stopPropagation();
    f();
  };

  return (
    <div className={`st-cards ${compact ? "st-cards--compact" : ""}`}>
      {filters && (
        <div className="st-chips" role="group" aria-label="Lọc theo chương">
          {(["all", "giay", "in", "thuocsung", "laban"] as const).map((c) => (
            <button
              key={c}
              type="button"
              className="st-chip"
              aria-pressed={chapter === c}
              onClick={() => {
                setChapter(c);
                setI(0);
                setFlipped(false);
              }}
            >
              {c === "all" ? "Tất cả" : CHAPTER_NAMES[c]}
            </button>
          ))}
        </div>
      )}
      <div className="st-deck" onKeyDown={onKey}>
        <button type="button" className={`st-flash ${flipped ? "is-flipped" : ""}`} onClick={flip} aria-label={flipped ? `${card.term}: ${card.def}` : `${card.term}. Bấm để lật`}>
          <span className="st-flash__inner">
            <span className="st-flash__face st-flash__front">
              {card.img && <img src={`/img/${card.img}.webp`} alt="" loading="lazy" decoding="async" />}
              <span className="st-flash__term">{card.term}</span>
              <span className="st-flash__cue">Bấm hoặc nhấn Space để lật</span>
            </span>
            <span className="st-flash__face st-flash__back">
              <span className="st-flash__tag">{CHAPTER_NAMES[card.chapter]}</span>
              <span className="st-flash__def">{card.def}</span>
            </span>
          </span>
        </button>
        <div className="st-deck__bar">
          <button type="button" className="st-round" onClick={() => go(-1)} aria-label="Thẻ trước">
            <IconPrev />
          </button>
          <span className="st-deck__count">
            {Math.min(i, list.length - 1) + 1} / {list.length}
          </span>
          <button type="button" className="st-round" onClick={() => go(1)} aria-label="Thẻ sau">
            <IconNext />
          </button>
        </div>
        <div className="st-row st-deck__marks">
          <button type="button" className="st-btn st-btn--learning" onClick={() => mark(false)}>
            Chưa nhớ <b>{learning.size}</b>
          </button>
          <button type="button" className="st-btn st-btn--known" onClick={() => mark(true)}>
            Đã nhớ <b>{known.size}</b>
          </button>
          <button
            type="button"
            className="st-btn st-btn--ghost"
            onClick={() => {
              setOrder(shuffle(deck));
              setI(0);
              setFlipped(false);
            }}
          >
            Trộn thẻ
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- match ----------------

const MATCH_PAIRS = 6;
const SHORT: Record<string, string> = {
  "Thái Luân": "Dâng giấy lên vua Hán năm 105",
  "Kinh Kim Cương (868)": "Bản in có ghi năm sớm nhất còn lại",
  "Tất Thăng": "Chữ in rời bằng đất sét nung",
  "Vương Trinh": "Hơn 6 vạn chữ gỗ, chọn chữ bằng bàn xoay",
  "Vũ kinh tổng yếu (1044)": "Công thức thuốc súng cổ nhất còn lại",
  "Hỏa thương": "Ống tre phun lửa — tổ tiên của súng",
  "Hồ Nguyên Trừng": "Chế tạo hỏa khí cho nhà Minh",
  "Cá chỉ nam": "Sắt hình cá thả trên bát nước",
  "Thẩm Quát": "Ghi lại độ lệch từ, khoảng 1088",
  "Chu Úc": "Chép về la bàn trên biển, khoảng 1119",
  "Lương Như Hộc": "Ông tổ nghề khắc in Việt Nam",
  "Làng Yên Thái (Kẻ Bưởi)": "Làng giấy dó ở Hà Nội",
};

interface Tile {
  id: string;
  pair: string;
  text: string;
  kind: "term" | "def";
}

function newBoard(): Tile[] {
  const pool = shuffle(allCards.filter((c) => SHORT[c.term])).slice(0, MATCH_PAIRS);
  return shuffle(pool.flatMap((c) => [
    { id: `${c.term}-t`, pair: c.term, text: c.term, kind: "term" as const },
    { id: `${c.term}-d`, pair: c.term, text: SHORT[c.term]!, kind: "def" as const },
  ]));
}

function readBest() {
  try {
    return Number(localStorage.getItem("match-best")) || 0;
  } catch {
    return 0;
  }
}

export function Match() {
  const [board, setBoard] = useState<Tile[]>(newBoard);
  const [sel, setSel] = useState<Tile | null>(null);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [best, setBest] = useState(readBest);
  const done = gone.size === board.length;

  useEffect(() => {
    if (t0 === null || done) return;
    const id = window.setInterval(() => setNow(performance.now()), 100);
    return () => window.clearInterval(id);
  }, [t0, done]);
  const elapsed = t0 === null ? 0 : ((done ? now : now || performance.now()) - t0) / 1000;

  const pick = (tile: Tile) => {
    if (gone.has(tile.id) || wrong.length) return;
    if (t0 === null) {
      const t = performance.now();
      setT0(t);
      setNow(t);
    }
    if (!sel) {
      setSel(tile);
      return;
    }
    if (sel.id === tile.id) {
      setSel(null);
      return;
    }
    if (sel.pair === tile.pair && sel.kind !== tile.kind) {
      const g = new Set(gone).add(sel.id).add(tile.id);
      setGone(g);
      setSel(null);
      play("stamp", 80);
      if (g.size === board.length) {
        const t = performance.now();
        setNow(t);
        const secs = (t - (t0 ?? t)) / 1000;
        if (!best || secs < best) {
          setBest(secs);
          try {
            localStorage.setItem("match-best", String(secs));
          } catch {
            /* private mode */
          }
        }
      }
    } else {
      setWrong([sel.id, tile.id]);
      play("drum", 80);
      window.setTimeout(() => {
        setWrong([]);
        setSel(null);
      }, 650);
    }
  };
  const reset = () => {
    setBoard(newBoard());
    setSel(null);
    setGone(new Set());
    setWrong([]);
    setT0(null);
    setNow(0);
  };

  return (
    <div className="st-card st-match">
      <div className="st-match__top">
        <p className="st-hint">Chọn một thẻ bên trái rồi thẻ ghép với nó. Ghép hết càng nhanh càng tốt!</p>
        <span className="st-timer" aria-live="off">
          {elapsed.toFixed(1)}
          <small> giây</small>
        </span>
        {best > 0 && <span className="st-best">Kỷ lục: {best.toFixed(1)} giây</span>}
      </div>
      {done ? (
        <div className="st-match__done" aria-live="polite">
          <Seal han="配" size="md" stamp="none" stampNow />
          <p className="st-match__time">
            Xong trong <b>{elapsed.toFixed(1)} giây</b>
            {elapsed <= best + 0.05 ? " — kỷ lục mới!" : ""}
          </p>
          <button type="button" className="st-btn st-btn--primary" onClick={reset}>
            <IconRedo className="st-btn__icon" /> Chơi lại
          </button>
        </div>
      ) : (
        <div className="st-match__grid">
          {board.map((tile) => (
            <button
              key={tile.id}
              type="button"
              className={`st-tile st-tile--${tile.kind} ${sel?.id === tile.id ? "is-sel" : ""} ${gone.has(tile.id) ? "is-gone" : ""} ${wrong.includes(tile.id) ? "is-wrong" : ""}`}
              onClick={() => pick(tile)}
              disabled={gone.has(tile.id)}
              aria-pressed={sel?.id === tile.id}
            >
              {tile.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- timeline order ----------------

export function Order() {
  const [items, setItems] = useState(() => shuffle(timelineEvents));
  const [checked, setChecked] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const sorted = useMemo(() => [...timelineEvents].sort((a, b) => a.year - b.year), []);
  const allRight = checked && items.every((it, k) => it.label === sorted[k]!.label);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((list) => {
      const a = [...list];
      const [x] = a.splice(from, 1);
      a.splice(to, 0, x!);
      return a;
    });
    setChecked(false);
  };

  return (
    <div className="st-card st-order">
      <p className="st-hint">Kéo thả (hoặc dùng mũi tên) để xếp các sự kiện từ sớm nhất đến muộn nhất.</p>
      <ol className="st-order__list">
        {items.map((it, k) => {
          const ok = checked && it.label === sorted[k]!.label;
          return (
            <li
              key={it.label}
              className={`st-event ${checked ? (ok ? "is-right" : "is-wrong") : ""} ${drag === k ? "is-drag" : ""}`}
              draggable
              onDragStart={() => setDrag(k)}
              onDragOver={(e) => {
                e.preventDefault();
                if (drag !== null && drag !== k) {
                  move(drag, k);
                  setDrag(k);
                }
              }}
              onDragEnd={() => setDrag(null)}
            >
              <span className="st-event__n">{k + 1}</span>
              <span className="st-event__label">{it.label}</span>
              {checked && <span className="st-event__year">{it.shown}</span>}
              <span className="st-event__moves">
                <button type="button" className="st-mini" onClick={() => move(k, k - 1)} disabled={k === 0} aria-label={`Đưa “${it.label}” lên`}>
                  <IconUp />
                </button>
                <button type="button" className="st-mini" onClick={() => move(k, k + 1)} disabled={k === items.length - 1} aria-label={`Đưa “${it.label}” xuống`}>
                  <IconDown />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="st-row" aria-live="polite">
        <button
          type="button"
          className="st-btn st-btn--primary"
          onClick={() => {
            setChecked(true);
            play(items.every((it, k) => it.label === sorted[k]!.label) ? "gate" : "drum", 200);
          }}
        >
          Kiểm tra
        </button>
        <button
          type="button"
          className="st-btn"
          onClick={() => {
            setItems(shuffle(timelineEvents));
            setChecked(false);
          }}
        >
          <IconRedo className="st-btn__icon" /> Trộn lại
        </button>
        {checked && <p className={`st-order__verdict ${allRight ? "is-right" : ""}`}>{allRight ? "Hoàn toàn chính xác!" : "Chưa đúng hết — xem các ô đỏ và thử lại."}</p>}
      </div>
    </div>
  );
}

// ---------------- per-chapter discussion ----------------

export function Discussion({ id, teacher, groups, hint, chapter }: { id: string; teacher: string; groups: string; hint: string; chapter: Card["chapter"] }) {
  const deck = allCards.filter((c) => c.chapter === chapter);
  return (
    <div className="st-discuss">
      <div className="st-discuss__qs">
        <Prompt id={`${id}-t`} who="Hỏi thầy cô" seal="師" text={teacher} />
        <Prompt id={`${id}-g`} who="Hỏi các nhóm" seal="友" text={groups} hint={hint} timer />
      </div>
      <div className="st-discuss__deck">
        <h4 className="st-discuss__title">Ôn nhanh {deck.length} thẻ</h4>
        <Flashcards deck={deck} compact />
      </div>
    </div>
  );
}

function Prompt({ id, who, seal, text, hint, timer = false }: { id: string; who: string; seal: string; text: string; hint?: string; timer?: boolean }) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  return (
    <article className={`st-prompt ${open ? "is-open" : ""}`}>
      <header className="st-prompt__head">
        <Seal han={seal} size="sm" stamp="none" />
        <h4>{who}</h4>
      </header>
      {open ? (
        <div id={`${id}-q`} className="st-prompt__body" aria-live="polite">
          <p className="st-prompt__q">{text}</p>
          <div className="st-row">
            {timer && <Countdown />}
            {hint && (
              <button type="button" className="st-btn st-btn--ghost" aria-expanded={showHint} onClick={() => setShowHint((s) => !s)}>
                {showHint ? "Ẩn gợi ý" : "Gợi ý"}
              </button>
            )}
          </div>
          {showHint && hint && <p className="st-prompt__hint">{hint}</p>}
        </div>
      ) : (
        <button
          type="button"
          className="st-prompt__reveal"
          aria-controls={`${id}-q`}
          onClick={() => {
            setOpen(true);
            play("paper");
          }}
        >
          Mở câu hỏi
        </button>
      )}
    </article>
  );
}

/** A 60-second discussion timer. */
function Countdown({ seconds = 60 }: { seconds?: number }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (left === null || left <= 0) return;
    const id = window.setTimeout(() => setLeft((l) => (l === null ? l : l - 1)), 1000);
    if (left === 1) play("gate", 500);
    return () => window.clearTimeout(id);
  }, [left]);
  const running = left !== null && left > 0;
  const frac = left === null ? 1 : left / seconds;
  return (
    <button type="button" className={`st-btn st-timerbtn ${running ? "is-running" : ""} ${left === 0 ? "is-over" : ""}`} onClick={() => setLeft(running ? null : seconds)}>
      <svg viewBox="0 0 24 24" aria-hidden className="st-btn__icon">
        <circle cx="12" cy="12" r="9" className="st-timer__track" />
        <circle cx="12" cy="12" r="9" className="st-timer__fill" style={{ strokeDasharray: `${56.5 * frac} 56.5` }} />
      </svg>
      {left === null ? `Thảo luận ${seconds} giây` : left === 0 ? "Hết giờ!" : `Còn ${left} giây`}
    </button>
  );
}
