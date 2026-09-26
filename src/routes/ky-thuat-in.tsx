import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { InventionHero } from "@/components/InventionHero";
import { InventionSection } from "@/components/InventionSection";
import { inventions } from "@/data/inventions";
import { SpreadMap } from "@/components/SpreadMap";
import { Quiz } from "@/components/Quiz";
import { Conclusion } from "@/components/Conclusion";
import { Sources } from "@/components/Sources";

const title = "Kỹ thuật in & Tổng kết – Trung Hoa cổ đại";
const description =
  "Trang 4/4 · Kỹ thuật in, bản đồ lan truyền bốn phát minh, câu đố, kết luận và nguồn tham khảo.";

export const Route = createFileRoute("/ky-thuat-in")({
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
  component: KyThuatInPage,
});

function KyThuatInPage() {
  return (
    <PageShell page={4} skipTo="in">
      <InventionHero id="in" isPageTop />
      {inventions
        .filter((inv) => inv.id === "in")
        .map((inv) => (
          <InventionSection key={inv.id} data={inv} />
        ))}
      <SpreadMap />
      <Quiz />
      <Conclusion />
      <Sources />
    </PageShell>
  );
}
