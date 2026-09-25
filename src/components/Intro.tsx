import { useState } from "react";

const marks = [
  { year: "105", label: "Thái Luân cải tiến giấy", pos: 8 },
  { year: "868", label: "Kinh Kim Cương – bản in sớm nhất", pos: 42 },
  { year: "1044", label: "Vũ kinh tổng yếu – công thức thuốc súng", pos: 66 },
  { year: "1088", label: "Mộng Khê bút đàm – kim chỉ nam & chữ rời", pos: 78 },
];

const dynasties = ["Hán", "Đường", "Tống", "Minh"];

export function Intro() {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <section id="mo-dau" className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-3xl sm:text-[2.5rem]">Mở đầu</h2>
      <p className="mt-1 text-sm text-muted-foreground">Phụ trách: Nguyễn Anh Dũng</p>
      <div className="rule-brush mt-6" />

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
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
            Bài của nhóm đi theo bốn phần đều nhau, mỗi phần gồm giới thiệu, ý nghĩa, nguồn tư liệu
            kèm phần phản tư khi dùng AI, và một câu hỏi tương tác.
          </p>
        </div>

        <figure className="paper-card relative p-6">
          <span className="han absolute right-4 top-2 text-5xl text-muted-foreground/20">言</span>
          <blockquote className="font-display text-lg italic leading-relaxed">
            “Ba phát minh này đã làm thay đổi bộ mặt và tình trạng của toàn thế giới: thứ nhất là
            nghề in, thứ hai là thuốc súng, thứ ba là la bàn.”
          </blockquote>
          <figcaption className="mt-4 text-sm text-muted-foreground">
            — Francis Bacon, <em>Novum Organum</em>, 1620
          </figcaption>
        </figure>
      </div>

      <div className="mt-14">
        <h3 className="text-xl">Dòng thời gian</h3>
        <div className="relative mt-10 pb-16">
          <div className="rule-brush" />
          <div className="mt-3 flex justify-between text-sm text-muted-foreground">
            {dynasties.map((d) => (
              <span key={d} className="font-display">
                {d}
              </span>
            ))}
          </div>
          {marks.map((m) => (
            <button
              key={m.year}
              type="button"
              className="absolute top-0 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${m.pos}%` }}
              onMouseEnter={() => setHover(m.year)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(m.year)}
              onBlur={() => setHover(null)}
            >
              <span className="block h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
              <span className="mt-2 block font-display text-sm font-bold text-primary">{m.year}</span>
              {hover === m.year && (
                <span className="absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 paper-card p-2 text-xs leading-snug">
                  {m.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
