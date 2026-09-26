/**
 * How each invention appeared and spread. Every date and label below is taken from
 * the existing content (invention texts, the spread map and the original timeline);
 * `year` is only a plotting position — for century labels ("tk XII") it is the mid-century.
 */
export type SpreadEvent = {
  /** Plotting position only. */
  year: number;
  /** Date as written in the content: "105", "tk XII", "~1450"… */
  when: string;
  label: string;
  kind: "origin" | "spread";
};

export type InventionSpread = {
  id: string;
  label: string;
  color: string;
  /** Route drawn on the spread map. */
  d: string;
  stops: string[];
  events: SpreadEvent[];
};

export const spread: InventionSpread[] = [
  {
    id: "giay",
    label: "Giấy",
    color: "var(--foreground)",
    d: "M560 190 C 460 150, 330 150, 250 200 C 180 240, 130 250, 90 245",
    stops: ["Triều Tiên 610", "Samarkand 751", "Baghdad 793", "Tây Ban Nha 1150"],
    events: [
      { year: 105, when: "105", label: "Thái Luân cải tiến giấy", kind: "origin" },
      { year: 610, when: "610", label: "Triều Tiên", kind: "spread" },
      { year: 751, when: "751", label: "Samarkand", kind: "spread" },
      { year: 793, when: "793", label: "Baghdad", kind: "spread" },
      { year: 1150, when: "1150", label: "Tây Ban Nha", kind: "spread" },
    ],
  },
  {
    id: "laban",
    label: "La bàn",
    color: "var(--bronze)",
    d: "M570 230 C 480 300, 360 320, 250 290 C 180 270, 130 270, 95 275",
    stops: ["Đông Nam Á tk XII", "Ả Rập tk XII", "Châu Âu tk XIII"],
    events: [
      {
        year: 1088,
        when: "khoảng 1088",
        label: "Mộng Khê bút đàm – kim chỉ nam & chữ rời",
        kind: "origin",
      },
      {
        year: 1119,
        when: "1119",
        label: "Bình Châu khả đàm – kim chỉ nam đi biển",
        kind: "origin",
      },
      { year: 1150, when: "tk XII", label: "Đông Nam Á", kind: "spread" },
      { year: 1160, when: "tk XII", label: "Ả Rập", kind: "spread" },
      { year: 1250, when: "tk XIII", label: "Châu Âu", kind: "spread" },
    ],
  },
  {
    id: "thuocsung",
    label: "Thuốc súng",
    color: "var(--seal)",
    d: "M565 210 C 470 210, 350 230, 255 245 C 185 255, 135 260, 100 260",
    stops: ["Mông Cổ tk XIII", "Ả Rập tk XIII", "Châu Âu tk XIV"],
    events: [
      {
        year: 1044,
        when: "1044",
        label: "Vũ kinh tổng yếu – công thức thuốc súng",
        kind: "origin",
      },
      { year: 1240, when: "tk XIII", label: "Mông Cổ", kind: "spread" },
      { year: 1260, when: "tk XIII", label: "Ả Rập", kind: "spread" },
      { year: 1350, when: "tk XIV", label: "Châu Âu", kind: "spread" },
    ],
  },
  {
    id: "in",
    label: "Kỹ thuật in",
    color: "var(--celadon)",
    d: "M575 170 C 500 120, 360 130, 260 175 C 190 205, 140 215, 100 215",
    stops: ["Triều Tiên tk VIII", "Nhật Bản tk VIII", "Châu Âu ~1450"],
    events: [
      { year: 740, when: "tk VIII", label: "Triều Tiên", kind: "spread" },
      { year: 760, when: "tk VIII", label: "Nhật Bản", kind: "spread" },
      { year: 868, when: "868", label: "Kinh Kim Cương – bản in sớm nhất", kind: "origin" },
      { year: 1040, when: "khoảng 1040", label: "Tất Thăng – chữ rời", kind: "origin" },
      { year: 1450, when: "~1450", label: "Châu Âu", kind: "spread" },
    ],
  },
];
