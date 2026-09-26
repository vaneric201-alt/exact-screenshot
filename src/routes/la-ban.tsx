import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { InventionHero } from "@/components/InventionHero";
import { InventionSection } from "@/components/InventionSection";
import { inventions } from "@/data/inventions";

const title = "La bàn – Trung Hoa cổ đại";
const description =
  "Trang 2/4 · La bàn: từ thìa Tư Nam thời Hán đến kim chỉ nam trên thuyền buôn nhà Tống.";

export const Route = createFileRoute("/la-ban")({
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
  component: LaBanPage,
});

function LaBanPage() {
  return (
    <PageShell page={2} skipTo="laban">
      <InventionHero id="laban" isPageTop />
      {inventions
        .filter((inv) => inv.id === "laban")
        .map((inv) => (
          <InventionSection key={inv.id} data={inv} />
        ))}
    </PageShell>
  );
}
