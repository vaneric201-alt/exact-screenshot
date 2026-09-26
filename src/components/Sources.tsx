import { Chapter } from "./layout/Chapter";

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
  return (
    <Chapter id="nguon" title="Nguồn tham khảo" owner="Trần Minh Tuấn" tone="deep">
      <div className="grid-12 mt-block">
        <SourceList title="Nguồn sơ cấp" items={primary} />
        <SourceList title="Nguồn thứ cấp" items={secondary} />
      </div>

      <p data-reveal className="mt-s5 max-w-prose text-small text-muted-foreground">
        Nguồn ảnh: các hình minh họa trong bài do nhóm dựng lại theo phong cách tranh thủy mặc, dựa
        trên mô tả trong các tài liệu nêu trên; không phải ảnh chụp hiện vật gốc.
      </p>
    </Chapter>
  );
}

function SourceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div data-reveal className="surface col-span-12 p-s6 md:col-span-6">
      <h3 className="text-h3">{title}</h3>
      <ol className="mt-s4 divide-y divide-border text-small">
        {items.map((s, i) => (
          <li key={s} className="flex gap-s3 py-s2">
            <span className="font-semibold text-primary tabular-nums">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
