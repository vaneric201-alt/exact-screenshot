import { useRef } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { SectionHeader } from "./SectionHeader";

const primary = [
  "Phạm Diệp, Hậu Hán thư – Hoạn giả liệt truyện, thế kỷ V.",
  "Thẩm Quát, Mộng Khê bút đàm, khoảng 1088.",
  "Tăng Công Lượng – Đinh Độ, Vũ kinh tổng yếu, 1044.",
  "Chu Úc, Bình Châu khả đàm, 1119.",
  "Ngô Sĩ Liên và các sử thần, Đại Việt sử ký toàn thư, 1479.",
  "Francis Bacon, Novum Organum, 1620.",
];

const secondary = [
  "Joseph Needham, Science and Civilisation in China, Cambridge University Press, 1954–2004.",
  "Tsien Tsuen-Hsuin, Paper and Printing, Cambridge University Press, 1985.",
  "Tonio Andrade, The Gunpowder Age, Princeton University Press, 2016.",
  "British Library, hồ sơ hiện vật Kinh Kim Cương Đôn Hoàng (Or.8210/P.2).",
  "UNESCO, hồ sơ Mộc bản triều Nguyễn, 2009.",
  "Bảo tàng Hàng hải Trung Quốc, tư liệu về la bàn thời Tống.",
];

export function Sources() {
  const root = useRef<HTMLElement>(null);
  useScrollReveal(root);

  return (
    <section
      id="nguon"
      ref={root}
      className="relative overflow-hidden border-t border-border bg-[var(--paper-deep)]"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <SectionHeader title="Nguồn tham khảo" subtitle="Phụ trách: Trần Minh Tuấn" ghost="典" />

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div data-reveal="left" className="paper-card p-6">
            <h3 className="text-xl">Nguồn sơ cấp</h3>
            <ol data-reveal-stagger className="mt-4 space-y-3 text-[0.98rem]">
              {primary.map((s, i) => (
                <li key={s}>
                  <span className="text-primary">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
          </div>
          <div data-reveal="right" className="paper-card p-6">
            <h3 className="text-xl">Nguồn thứ cấp</h3>
            <ol data-reveal-stagger className="mt-4 space-y-3 text-[0.98rem]">
              {secondary.map((s, i) => (
                <li key={s}>
                  <span className="text-primary">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <p data-reveal="up" className="mt-8 text-sm text-muted-foreground">
          Nguồn ảnh: các hình minh họa trong bài do nhóm dựng lại theo phong cách tranh thủy mặc,
          dựa trên mô tả trong các tài liệu nêu trên; không phải ảnh chụp hiện vật gốc.
        </p>
      </div>
    </section>
  );
}
