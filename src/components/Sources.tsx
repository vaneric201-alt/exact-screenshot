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
    <section id="nguon" className="border-t border-border bg-[var(--paper-deep)]">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl sm:text-[2.5rem]">Nguồn tham khảo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Phụ trách: Trần Minh Tuấn</p>
        <div className="rule-brush mt-6" />

        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="text-xl">Nguồn sơ cấp</h3>
            <ol className="mt-3 space-y-2 text-[0.98rem]">
              {primary.map((s, i) => (
                <li key={s}>
                  <span className="text-primary">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="text-xl">Nguồn thứ cấp</h3>
            <ol className="mt-3 space-y-2 text-[0.98rem]">
              {secondary.map((s, i) => (
                <li key={s}>
                  <span className="text-primary">{i + 1}.</span> {s}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Nguồn ảnh: các hình minh họa trong bài do nhóm dựng lại theo phong cách tranh thủy mặc, dựa trên mô tả
          trong các tài liệu nêu trên; không phải ảnh chụp hiện vật gốc.
        </p>
      </div>
    </section>
  );
}
