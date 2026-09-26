import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { Nav } from "@/components/Nav";
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
      <div className="min-h-screen">
        <Nav />
        <main>
          <Cover />
          <Intro />
          {inventions.map((inv, i) => (
            <InventionSection key={inv.id} data={inv} index={i + 1} />
          ))}
          <SpreadMap />
          <Quiz />
          <Conclusion />
          <Sources />
        </main>
        <footer className="hero-lacquer border-t border-border py-14 text-background">
          <div className="mx-auto max-w-6xl px-4">
            <p className="font-display text-xl text-[var(--gold)]">
              Nhóm 4 · Lớp 10A · Môn Lịch sử
            </p>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <li>Nguyễn Anh Dũng — Mở đầu & Kỹ thuật làm giấy</li>
              <li>Trần Minh Tuấn — La bàn & Nguồn tham khảo</li>
              <li>Lê Gia Hưng — Thuốc súng & Câu đố</li>
              <li>Đào Quang Anh — Kỹ thuật in & Kết luận</li>
            </ul>
            <p className="mt-6 text-sm opacity-70">Thời gian thực hiện: tháng 9 năm 2026.</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
