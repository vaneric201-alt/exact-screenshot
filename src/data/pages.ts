import { chapterById } from "./chapters";

/**
 * The presentation is split into four pages, one per presenter, in speaking order.
 * Each page carries one invention; page 1 also opens the talk, page 4 closes it.
 */
export type InventionId = "giay" | "laban" | "thuocsung" | "in";

export type PageInfo = {
  num: number;
  path: "/" | "/la-ban" | "/thuoc-sung" | "/ky-thuat-in";
  title: string;
  presenter: string;
  invention: InventionId;
};

export const pages: PageInfo[] = [
  { num: 1, path: "/", title: "Mở đầu & Giấy", presenter: "Nguyễn Anh Dũng", invention: "giay" },
  { num: 2, path: "/la-ban", title: "La bàn", presenter: "Trần Minh Tuấn", invention: "laban" },
  {
    num: 3,
    path: "/thuoc-sung",
    title: "Thuốc súng",
    presenter: "Lê Gia Hưng",
    invention: "thuocsung",
  },
  {
    num: 4,
    path: "/ky-thuat-in",
    title: "Kỹ thuật in & Tổng kết",
    presenter: "Đào Quang Anh",
    invention: "in",
  },
];

export function pageByNum(num: number) {
  const p = pages.find((pg) => pg.num === num);
  if (!p) throw new Error(`Unknown page: ${num}`);
  return p;
}

/** Link to a chapter from anywhere: same-page links only change the hash. */
export function chapterHref(id: string) {
  const { path } = pageByNum(chapterById(id).page);
  return `${path}#${id}`;
}
