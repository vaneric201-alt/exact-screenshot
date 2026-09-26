import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { InventionHero } from "@/components/InventionHero";
import { InventionSection } from "@/components/InventionSection";
import { inventions } from "@/data/inventions";

const title = "Thuốc súng – Trung Hoa cổ đại";
const description = "Trang 3/4 · Thuốc súng: từ lò luyện đan của đạo sĩ đến hỏa khí nhà Tống.";

export const Route = createFileRoute("/thuoc-sung")({
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
  component: ThuocSungPage,
});

function ThuocSungPage() {
  return (
    <PageShell page={3} skipTo="thuocsung">
      <InventionHero id="thuocsung" isPageTop />
      {inventions
        .filter((inv) => inv.id === "thuocsung")
        .map((inv) => (
          <InventionSection key={inv.id} data={inv} />
        ))}
    </PageShell>
  );
}
