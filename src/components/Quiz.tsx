import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { SectionHeader } from "./SectionHeader";

type Q = { q: string; options: string[]; answer: number; explain: string };

const questions: Q[] = [
  {
    q: "Người được sử sách ghi công cải tiến kỹ thuật làm giấy năm 105 là ai?",
    options: ["Thái Luân", "Tất Thăng", "Thẩm Quát", "Trịnh Hòa"],
    answer: 0,
    explain: "Hậu Hán thư chép Thái Luân dùng vỏ cây, sợi gai, vải rách và lưới cá cũ để làm giấy.",
  },
  {
    q: "Trước khi dùng để đi biển, 'tư nam' thời Hán dùng vào việc gì?",
    options: ["Đo thời gian", "Phong thủy và bói toán", "Vẽ bản đồ", "Đo động đất"],
    answer: 1,
    explain:
      "Chiếc thìa nam châm quay trên mâm đồng phục vụ bói toán; tới thời Tống kim chỉ nam mới đi biển.",
  },
  {
    q: "Công thức thuốc súng thành văn sớm nhất nằm trong sách nào?",
    options: ["Mộng Khê bút đàm", "Vũ kinh tổng yếu", "Hậu Hán thư", "Thiên công khai vật"],
    answer: 1,
    explain:
      "Vũ kinh tổng yếu (1044) do triều Tống biên soạn, ghi rõ tỉ lệ diêm tiêu – lưu huỳnh – than.",
  },
  {
    q: "Ấn phẩm in có ghi niên đại sớm nhất còn lại của thế giới là?",
    options: [
      "Kinh Kim Cương năm 868",
      "Kinh Thánh Gutenberg",
      "Mộc bản triều Nguyễn",
      "Đại Tạng kinh Cao Ly",
    ],
    answer: 0,
    explain: "Bản Kinh Kim Cương tìm thấy ở Đôn Hoàng, nay lưu tại British Library.",
  },
  {
    q: "Ai làm ra chữ rời bằng đất sét nung khoảng năm 1040?",
    options: ["Gutenberg", "Tất Thăng", "Lương Nhữ Học", "Tăng Công Lượng"],
    answer: 1,
    explain: "Thẩm Quát mô tả kỹ thuật của Tất Thăng trong Mộng Khê bút đàm.",
  },
  {
    q: "Ghi chép sớm nhất thế giới về độ từ thiên (kim lệch khỏi chính nam) thuộc về ai?",
    options: ["Chu Úc", "Thẩm Quát", "Thái Luân", "Hồ Nguyên Trừng"],
    answer: 1,
    explain: "Mộng Khê bút đàm khoảng năm 1088 ghi kim 'thường hơi lệch về phía đông'.",
  },
  {
    q: "Nhân vật Việt Nam gắn với 'thần cơ sang pháo' là ai?",
    options: ["Lương Nhữ Học", "Hồ Nguyên Trừng", "Lê Quý Đôn", "Nguyễn Trãi"],
    answer: 1,
    explain:
      "Hồ Nguyên Trừng nổi tiếng chế tạo hỏa khí, sau bị bắt sang nhà Minh và tiếp tục công việc này.",
  },
  {
    q: "Vì sao in chữ rời không thay thế được mộc bản ở Trung Hoa?",
    options: [
      "Vì chữ Hán có quá nhiều ký tự",
      "Vì thiếu giấy",
      "Vì triều đình cấm",
      "Vì chưa biết làm mực",
    ],
    answer: 0,
    explain: "Phải đúc hàng vạn con chữ mới in được, nên khắc nguyên ván vẫn tiện và rẻ hơn.",
  },
];

export function Quiz() {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const root = useRef<HTMLElement>(null);
  useScrollReveal(root);
  const reduce = useReducedMotion();
  const answered = Object.keys(picked).length;
  const done = answered === questions.length;
  const score = questions.reduce((s, q, i) => (picked[i] === q.answer ? s + 1 : s), 0);

  return (
    <section id="cau-do" ref={root} className="relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28">
        <SectionHeader
          title="Câu đố"
          subtitle="Phụ trách: Lê Gia Hưng · 8 câu cho cả bốn phần"
          ghost="問"
        />

        <ol className="mt-10 space-y-6">
          {questions.map((q, i) => {
            const chosen = picked[i];
            const right = chosen === q.answer;
            return (
              <li
                key={q.q}
                data-reveal="up"
                className="paper-card relative overflow-hidden p-5 sm:p-6"
              >
                <AnimatePresence>
                  {chosen !== undefined && (
                    <motion.span
                      aria-hidden
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      exit={{ scaleY: 0 }}
                      className={`absolute inset-y-0 left-0 w-1 origin-top ${right ? "bg-bronze" : "bg-primary"}`}
                    />
                  )}
                </AnimatePresence>
                <p className="flex gap-3 font-display text-lg font-bold">
                  <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/40 text-sm text-primary"
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">
                    <span className="sr-only">{i + 1}. </span>
                    {q.q}
                  </span>
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => {
                    const isPicked = chosen === oi;
                    const correct = oi === q.answer;
                    const state =
                      chosen === undefined
                        ? "border-border hover:border-primary hover:bg-[color-mix(in_oklab,var(--seal)_5%,transparent)]"
                        : correct
                          ? "border-bronze bg-accent"
                          : isPicked
                            ? "border-primary bg-[color-mix(in_oklab,var(--seal)_12%,transparent)]"
                            : "border-border opacity-60";
                    const feedback =
                      chosen === undefined || reduce
                        ? {}
                        : correct
                          ? { scale: [1, 1.04, 1] }
                          : isPicked
                            ? { x: [0, -8, 8, -6, 6, -3, 0] }
                            : {};
                    return (
                      <motion.button
                        key={opt}
                        type="button"
                        disabled={chosen !== undefined}
                        onClick={() => setPicked((p) => ({ ...p, [i]: oi }))}
                        animate={feedback}
                        whileHover={chosen === undefined ? { y: -2 } : {}}
                        whileTap={chosen === undefined ? { scale: 0.97 } : {}}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className={`flex items-center justify-between gap-2 rounded-[3px] border px-3 py-2.5 text-left transition-colors ${state}`}
                      >
                        <span>{opt}</span>
                        <AnimatePresence>
                          {chosen !== undefined && (correct || isPicked) && (
                            <motion.span
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 18 }}
                              className={correct ? "text-bronze" : "text-primary"}
                            >
                              {correct ? " ✓" : " ✕"}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
                <AnimatePresence initial={false}>
                  {chosen !== undefined && (
                    <motion.div
                      key="explain"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 border-l-2 border-celadon pl-3 text-[0.95rem]">
                        {q.explain}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>

        <div className="paper-card sticky bottom-4 z-20 mt-8 overflow-hidden p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-xl" aria-live="polite">
              Điểm:{" "}
              <motion.span
                key={score}
                initial={{ y: -12, opacity: 0.4, scale: 1.4 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                className="inline-block text-primary"
              >
                {score}
              </motion.span>{" "}
              / {questions.length}
            </p>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {done && (
                  <motion.p
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground"
                  >
                    Đã trả lời hết — cảm ơn cả lớp!
                  </motion.p>
                )}
              </AnimatePresence>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPicked({})}
                className="rounded-[3px] bg-primary px-4 py-2 text-primary-foreground shadow-[0_6px_16px_-8px_var(--seal)]"
              >
                Làm lại
              </motion.button>
            </div>
          </div>
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-border/60">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-primary to-[var(--gold)]"
              initial={false}
              animate={{ scaleX: answered / questions.length }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
