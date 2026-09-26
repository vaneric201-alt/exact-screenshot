import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ChapterNav } from "@/components/ChapterNav";
import { pageByNum, pages } from "@/data/pages";

/** Shared frame for the four presentation pages: navigator, content, page hand-over, credits. */
export function PageShell({
  page,
  skipTo,
  children,
}: {
  page: number;
  /** Anchor of the first content chapter, for the skip link. */
  skipTo: string;
  children: ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <a
        href={`#${skipTo}`}
        className="sr-only focus:not-sr-only focus:fixed focus:left-s4 focus:top-s4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-s4 focus:py-s2 focus:text-primary-foreground"
      >
        Bỏ qua phần mở trang
      </a>
      <ChapterNav page={page} />
      <div className="min-h-screen lg:pl-rail">
        <main>{children}</main>
        <PageHandOver page={page} />
        <Credits />
      </div>
    </MotionConfig>
  );
}

/** Previous / next page cards, so each presenter hands over to the next with one click. */
function PageHandOver({ page }: { page: number }) {
  const prev = page > 1 ? pageByNum(page - 1) : null;
  const next = page < pages.length ? pageByNum(page + 1) : null;

  return (
    <nav aria-label="Chuyển trang" className="border-t border-border bg-paper-deep/60">
      <div className="page grid gap-s4 py-block sm:grid-cols-2">
        {prev ? (
          <a
            href={prev.path}
            className="surface group flex flex-col gap-s1 p-s5 transition-colors duration-[var(--dur-base)] hover:border-primary"
          >
            <span className="text-caption text-muted-foreground">← Trang {prev.num}</span>
            <strong className="font-display text-h3 group-hover:text-primary">{prev.title}</strong>
            <span className="text-small text-muted-foreground">{prev.presenter}</span>
          </a>
        ) : (
          <span aria-hidden className="hidden sm:block" />
        )}
        {next ? (
          <a
            href={next.path}
            className="surface group flex flex-col gap-s1 p-s5 text-right transition-colors duration-[var(--dur-base)] hover:border-primary sm:col-start-2"
          >
            <span className="text-caption text-muted-foreground">Trang {next.num} →</span>
            <strong className="font-display text-h3 group-hover:text-primary">{next.title}</strong>
            <span className="text-small text-muted-foreground">
              Người trình bày tiếp: {next.presenter}
            </span>
          </a>
        ) : (
          <a
            href="/"
            className="surface group flex flex-col gap-s1 p-s5 text-right transition-colors duration-[var(--dur-base)] hover:border-primary sm:col-start-2"
          >
            <span className="text-caption text-muted-foreground">Hết bài thuyết trình</span>
            <strong className="font-display text-h3 group-hover:text-primary">
              Về trang bìa ↺
            </strong>
          </a>
        )}
      </div>
    </nav>
  );
}

function Credits() {
  return (
    <footer className="hero-lacquer py-section text-on-dark">
      <div className="page">
        <p className="font-display text-h3 text-gold">Nhóm 4 · Lớp 10A · Môn Lịch sử</p>
        <ol className="grid-12 mt-s5 text-small text-on-dark-muted">
          <li className="col-span-12 sm:col-span-6 lg:col-span-3">
            Trang 1 · Nguyễn Anh Dũng — Mở đầu & Kỹ thuật làm giấy
          </li>
          <li className="col-span-12 sm:col-span-6 lg:col-span-3">
            Trang 2 · Trần Minh Tuấn — La bàn & Nguồn tham khảo
          </li>
          <li className="col-span-12 sm:col-span-6 lg:col-span-3">
            Trang 3 · Lê Gia Hưng — Thuốc súng & Câu đố
          </li>
          <li className="col-span-12 sm:col-span-6 lg:col-span-3">
            Trang 4 · Đào Quang Anh — Kỹ thuật in & Kết luận
          </li>
        </ol>
        <p className="mt-s5 text-small text-on-dark-muted">
          Thời gian thực hiện: tháng 9 năm 2026.
        </p>
      </div>
    </footer>
  );
}
