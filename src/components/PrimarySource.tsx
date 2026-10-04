import type { ChapterData } from "../content/content";

/** A scrap of old paper: the original Classical Chinese set vertically, then the translation. */
export function PrimarySource({ source }: { source: ChapterData["primary"] }) {
  return (
    <figure className={`scrap ${source.placeholder ? "scrap--todo" : ""}`}>
      {source.han && (
        <p className="scrap__han" lang="zh-Hant">
          {source.han}
        </p>
      )}
      <div className="scrap__side">
        {source.vi && <blockquote className="scrap__vi">“{source.vi}”</blockquote>}
        {source.placeholder && <p className="scrap__vi">{source.placeholder}</p>}
        {source.cite && <figcaption className="scrap__cite">— {renderCite(source.cite)}</figcaption>}
      </div>
    </figure>
  );
}

/** Italicise book titles known in the content (kept as plain strings there). */
const BOOKS = [
  "Hậu Hán thư",
  "Mộng Khê bút đàm",
  "Đại Việt sử ký toàn thư",
  "Bình Châu khả đàm",
  "Vũ kinh tổng yếu",
  "Thiên công khai vật",
  "Luận hành",
  "Hàn Phi Tử",
  "Novum Organum",
  "Kinh Kim Cương",
  "Chân nguyên diệu đạo yếu lược",
  "Nông thư",
  "Paper and Printing",
  "The Diamond Sutra",
  "Military Technology: The Gunpowder Epic",
  "Science and Civilisation in China",
  "Binh pháp Tôn Tử",
  "Toàn thư",
];

export function renderCite(text: string) {
  const parts: (string | { b: string })[] = [text];
  for (const b of BOOKS) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (typeof p !== "string") continue;
      const at = p.indexOf(b);
      if (at < 0) continue;
      parts.splice(i, 1, p.slice(0, at), { b }, p.slice(at + b.length));
      i += 2;
    }
  }
  return parts.map((p, i) => (typeof p === "string" ? p : <cite key={i}>{p.b}</cite>));
}

/** Render "*Title*" markers from the sources list as <cite>. */
export function renderStars(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((s, i) => (s.startsWith("*") && s.endsWith("*") ? <cite key={i}>{s.slice(1, -1)}</cite> : s));
}
