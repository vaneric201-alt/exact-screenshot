/*
 * Eras used by the Great Rewind book: each page of the rewind belongs to one,
 * which sets the dynasty name and seal on the page and the four period images
 * in the corners of the screen (public/img/corner-<id>-1…4.webp).
 */

export interface Era {
  id: string;
  name: string;
  /** Character stamped on the page. */
  han: string;
  /** Which corner set to show (eras without their own reuse a neighbour's). */
  corners: string;
}

export const eras: Record<string, Era> = {
  nay: { id: "nay", name: "Hôm nay", han: "今", corners: "canhien" },
  canhien: { id: "canhien", name: "Cận – hiện đại", han: "近", corners: "canhien" },
  thanh: { id: "thanh", name: "Nhà Thanh", han: "清", corners: "thanh" },
  minh: { id: "minh", name: "Nhà Minh", han: "明", corners: "minh" },
  nguyen: { id: "nguyen", name: "Nhà Nguyên", han: "元", corners: "nguyen" },
  tong: { id: "tong", name: "Nhà Tống", han: "宋", corners: "tong" },
  duong: { id: "duong", name: "Nhà Đường – Ngũ Đại", han: "唐", corners: "duong" },
  han: { id: "han", name: "Nhà Hán", han: "漢", corners: "han" },
  tan: { id: "tan", name: "Nhà Tần", han: "秦", corners: "tan" },
  chu: { id: "chu", name: "Nhà Chu: Xuân Thu – Chiến Quốc", han: "周", corners: "chienquoc" },
};

/** Era of a year on the rewind pages (negative = TCN). */
export function eraOf(year: number): Era {
  if (year >= 2000) return eras["nay"]!;
  if (year >= 1900) return eras["canhien"]!;
  if (year >= 1700) return eras["thanh"]!;
  if (year >= 1368) return eras["minh"]!;
  if (year >= 1300) return eras["nguyen"]!;
  if (year >= 960) return eras["tong"]!;
  if (year >= 618) return eras["duong"]!;
  if (year >= -205) return eras["han"]!;
  if (year >= -221) return eras["tan"]!;
  return eras["chu"]!;
}
