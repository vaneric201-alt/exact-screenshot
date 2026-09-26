import { inventions } from "@/data/inventions";
import { chapterById, chapterNum } from "@/data/chapters";
import { pageByNum, pages, type InventionId } from "@/data/pages";
import { InventionCanvas } from "./InventionCanvas";

/**
 * Opening band for an invention: page number, Han character, name and presenter
 * beside a 3D model the audience can turn. It is the top of pages 2–4 and the
 * hand-over into "Giấy" on page 1.
 */
export function InventionHero({ id, isPageTop = false }: { id: InventionId; isPageTop?: boolean }) {
  const inv = inventions.find((i) => i.id === id);
  const ch = chapterById(id);
  const page = pageByNum(ch.page);
  if (!inv) return null;
  const Title = isPageTop ? "h1" : "h2";

  return (
    <section
      id={isPageTop ? "bia" : `${id}-mo-hinh`}
      aria-labelledby={`${id}-hero-title`}
      className="hero-lacquer relative isolate overflow-hidden text-on-dark"
    >
      <div className="page py-section">
        <div className="grid-12 items-center gap-y-s6">
          <div className="col-span-12 lg:col-span-6">
            <p className="kicker text-gold">
              Trang {page.num}/{pages.length} · Phần {chapterNum(ch.num)}
            </p>
            <p
              aria-hidden
              className="han mt-s4 text-[clamp(4rem,9vw,7.5rem)] leading-none text-gold"
            >
              {ch.han}
            </p>
            <Title id={`${id}-hero-title`} className="animate-ink mt-s4 text-display text-on-dark">
              {inv.name}
            </Title>
            <p className="mt-s4 max-w-prose text-lead text-on-dark-muted">{inv.tagline}</p>
            <div className="mt-s6 flex flex-wrap items-center gap-s3">
              <span className="surface-dark inline-flex items-center gap-s2 px-s4 py-s2 text-small">
                <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-gold" />
                Trình bày: <strong className="font-semibold text-on-dark">{page.presenter}</strong>
              </span>
              <a
                href={`#${id}`}
                className="inline-flex min-h-11 items-center gap-s2 rounded-md bg-seal px-s4 text-small font-semibold text-on-dark transition-colors duration-[var(--dur-base)] hover:bg-seal/80"
              >
                Vào phần {ch.label} <span aria-hidden>↓</span>
              </a>
            </div>
          </div>

          <figure className="col-span-12 lg:col-span-6">
            <div className="relative h-[300px] sm:h-[420px] lg:h-[540px]">
              <InventionCanvas kind={id} />
            </div>
            <figcaption className="mt-s2 text-center text-caption text-on-dark-muted">
              Mô hình 3D · kéo ngang để xoay
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
