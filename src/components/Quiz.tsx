import { useState } from "react";

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
    explain: "Chiếc thìa nam châm quay trên mâm đồng phục vụ bói toán; tới thời Tống kim chỉ nam mới đi biển.",
  },
  {
    q: "Công thức thuốc súng thành văn sớm nhất nằm trong sách nào?",
    options: ["Mộng Khê bút đàm", "Vũ kinh tổng yếu", "Hậu Hán thư", "Thiên công khai vật"],
    answer: 1,
    explain: "Vũ kinh tổng yếu (1044) do triều Tống biên soạn, ghi rõ tỉ lệ diêm tiêu – lưu huỳnh – than.",
  },
  {
    q: "Ấn phẩm in có ghi niên đại sớm nhất còn lại của thế giới là?",
    options: ["Kinh Kim Cương năm 868", "Kinh Thánh Gutenberg", "Mộc bản triều Nguyễn", "Đại Tạng kinh Cao Ly"],
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
    explain: "Hồ Nguyên Trừng nổi tiếng chế tạo hỏa khí, sau bị bắt sang nhà Minh và tiếp tục công việc này.",
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
  const done = Object.keys(picked).length === questions.length;
  const score = questions.reduce((s, q, i) => (picked[i] === q.answer ? s + 1 : s), 0);

  return (
    <section id="cau-do" className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-3xl sm:text-[2.5rem]">Câu đố</h2>
        <p className="mt-1 text-sm text-muted-foreground">Phụ trách: Lê Gia Hưng · 8 câu cho cả bốn phần</p>
        <div className="rule-brush mt-6" />

        <ol className="mt-8 space-y-6">
          {questions.map((q, i) => {
            const chosen = picked[i];
            return (
              <li key={q.q} className="paper-card p-5">
                <p className="font-display text-lg font-bold">
                  {i + 1}. {q.q}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => {
                    const isPicked = chosen === oi;
                    const correct = oi === q.answer;
                    const state =
                      chosen === undefined
                        ? "border-border hover:border-primary"
                        : correct
                          ? "border-bronze bg-accent"
                          : isPicked
                            ? "border-primary bg-[color-mix(in_oklab,var(--seal)_12%,transparent)]"
                            : "border-border opacity-60";
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={chosen !== undefined}
                        onClick={() => setPicked((p) => ({ ...p, [i]: oi }))}
                        className={`rounded-[3px] border px-3 py-2 text-left transition-colors ${state}`}
                      >
                        {opt}
                        {chosen !== undefined && correct && " ✓"}
                        {chosen !== undefined && isPicked && !correct && " ✕"}
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && (
                  <p className="mt-3 border-l-2 border-celadon pl-3 text-[0.95rem]">{q.explain}</p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="paper-card mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="font-display text-xl">
            Điểm: <span className="text-primary">{score}</span> / {questions.length}
          </p>
          <div className="flex items-center gap-4">
            {done && <p className="text-sm text-muted-foreground">Đã trả lời hết — cảm ơn cả lớp!</p>}
            <button
              type="button"
              onClick={() => setPicked({})}
              className="rounded-[3px] bg-primary px-4 py-2 text-primary-foreground"
            >
              Làm lại
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
