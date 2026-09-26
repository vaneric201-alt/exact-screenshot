import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { ChapterNav } from "@/components/ChapterNav";
import { Cover } from "@/components/Cover";
import { Intro } from "@/components/Intro";
import { InventionSection } from "@/components/InventionSection";
import { SpreadMap } from "@/components/SpreadMap";
import { Quiz } from "@/components/Quiz";
import { Conclusion } from "@/components/Conclusion";
import { Sources } from "@/components/Sources";
import { inventions } from "@/data/inventions";

const title = "Trung Hoa cổ đại – Nền văn minh của sáng chế";
const description =
  "Bài thuyết trình Lịch sử về bốn phát minh của Trung Hoa cổ đại: giấy, la bàn, thuốc súng và kỹ thuật in, kèm nguồn sơ cấp, bản đồ lan truyền và câu đố tương tác.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#mo-dau"
        className="sr-only focus:not-sr-only focus:fixed focus:left-s4 focus:top-s4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-s4 focus:py-s2 focus:text-primary-foreground"
      >
        Bỏ qua trang bìa
      </a>
      <ChapterNav />
      <div className="min-h-screen lg:pl-rail">
        <main>
          <Cover />
          <Intro />
          {inventions.map((inv) => (
            <InventionSection key={inv.id} data={inv} />
          ))}
          <SpreadMap />
          <Quiz />
          <Conclusion />
          <Sources />
        </main>
        <footer className="hero-lacquer py-section text-on-dark">
          <div className="page">
            <p className="font-display text-h3 text-gold">Nhóm 4 · Lớp 10A · Môn Lịch sử</p>
            <ul className="grid-12 mt-s5 text-small text-on-dark-muted">
              <li className="col-span-12 sm:col-span-6 lg:col-span-3">
                Nguyễn Anh Dũng — Mở đầu & Kỹ thuật làm giấy
              </li>
              <li className="col-span-12 sm:col-span-6 lg:col-span-3">
                Trần Minh Tuấn — La bàn & Nguồn tham khảo
              </li>
              <li className="col-span-12 sm:col-span-6 lg:col-span-3">
                Lê Gia Hưng — Thuốc súng & Câu đố
              </li>
              <li className="col-span-12 sm:col-span-6 lg:col-span-3">
                Đào Quang Anh — Kỹ thuật in & Kết luận
              </li>
            </ul>
            <p className="mt-s5 text-small text-on-dark-muted">
              Thời gian thực hiện: tháng 9 năm 2026.
            </p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
