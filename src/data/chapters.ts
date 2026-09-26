/** Page architecture: every chapter in reading order. Used by the navigator and headers. */
export type Chapter = {
  id: string;
  num: number;
  label: string;
  han: string;
};

export const chapters: Chapter[] = [
  { id: "mo-dau", num: 0, label: "Mở đầu", han: "始" },
  { id: "giay", num: 1, label: "Giấy", han: "紙" },
  { id: "laban", num: 2, label: "La bàn", han: "指南" },
  { id: "thuocsung", num: 3, label: "Thuốc súng", han: "火藥" },
  { id: "in", num: 4, label: "Kỹ thuật in", han: "印" },
  { id: "lan-truyen", num: 5, label: "Bản đồ lan truyền", han: "路" },
  { id: "cau-do", num: 6, label: "Câu đố", han: "問" },
  { id: "ket-luan", num: 7, label: "Kết luận", han: "結" },
  { id: "nguon", num: 8, label: "Nguồn", han: "典" },
];

export const chapterNum = (n: number) => String(n).padStart(2, "0");

export function chapterById(id: string) {
  const c = chapters.find((ch) => ch.id === id);
  if (!c) throw new Error(`Unknown chapter: ${id}`);
  return c;
}
