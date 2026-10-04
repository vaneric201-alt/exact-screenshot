/*
 * Toàn bộ chữ của website, chép từ docs/content.md.
 * Không thêm sự kiện, năm hay trích dẫn ngoài file đó.
 * `[ngoặc vuông]` là chỗ trống nhóm tự điền.
 */

export type Year = number; // năm âm = TCN

export const meta = {
  title: "Trung Hoa cổ đại",
  subtitle: "Nền văn minh của sáng chế",
  groupLine: "Lớp 10B06 · Môn Lịch sử · 5/10/2026",
  classLine: "Lớp 10B06 · Thuyết trình ngày 5/10/2026",
};

export const members = [
  { name: "Anh Dũng", part: "Mở đầu" },
  { name: "Lê Trầm Tính", part: "Giấy" },
  { name: "Nguyễn Gia Hưng", part: "Kỹ thuật in, Câu đố" },
  { name: "Đào Quang Anh", part: "Thuốc súng, Kết luận" },
  { name: "Trịnh Minh Tuấn", part: "La bàn, Nguồn tham khảo" },
];

// ---------------- Trang 1 ----------------

export const intro = {
  owner: "Anh Dũng",
  gate: {
    label: "Mở cuộn",
    loading: "Đang dựng Tử Cấm Thành…",
    note: "Bật âm thanh để có trải nghiệm đầy đủ · Phím M để tắt",
    silent: "Vào không có âm thanh",
  },
  hero: {
    scrollHint: "Cuộn để bay qua cổng thành",
    caption: "Mô hình 3D mô phỏng Tử Cấm Thành (Bắc Kinh), đã giản lược tỉ lệ và chi tiết.",
  },
  civilization: {
    title: "Một nền văn minh bên hai dòng sông",
    lead: "Nền văn minh Trung Hoa hình thành bên lưu vực Hoàng Hà và Trường Giang, là một trong những nền văn minh lâu đời nhất còn liên tục đến ngày nay.",
    panels: [
      { han: "文", title: "Chữ viết", text: "Chữ giáp cốt khắc trên mai rùa, xương thú thời Thương là tổ tiên của chữ Hán ngày nay." },
      {
        han: "道",
        title: "Tư tưởng",
        text: "Nho giáo, Đạo giáo, Pháp gia ra đời thời Xuân Thu – Chiến Quốc và ảnh hưởng sâu rộng đến cả Đông Á, trong đó có Việt Nam.",
      },
      { han: "城", title: "Kiến trúc", text: "Vạn Lý Trường Thành, cung điện, chùa tháp thể hiện trình độ tổ chức và xây dựng rất cao." },
      { han: "天", title: "Khoa học", text: "Lịch pháp, thiên văn, y học, toán học đều phát triển sớm." },
      { han: "明", title: "Sáng chế", text: "Giấy, kỹ thuật in, thuốc súng và la bàn — bốn phát minh làm thay đổi thế giới." },
    ],
  },
  dynasties: {
    title: "Dải triều đại",
    items: [
      { name: "Thương", label: "khoảng 1600 – 1046 TCN", from: -1600, to: -1046 },
      { name: "Chu", label: "1046 – 256 TCN", from: -1046, to: -256 },
      { name: "Tần", label: "221 – 206 TCN", from: -221, to: -206 },
      { name: "Hán", label: "206 TCN – 220", from: -206, to: 220 },
      { name: "Tùy – Đường", label: "581 – 907", from: 581, to: 907 },
      { name: "Tống", label: "960 – 1279", from: 960, to: 1279 },
      { name: "Nguyên", label: "1271 – 1368", from: 1271, to: 1368 },
      { name: "Minh", label: "1368 – 1644", from: 1368, to: 1644 },
      { name: "Thanh", label: "1644 – 1912", from: 1644, to: 1912 },
    ],
    marks: [
      { year: 105, label: "Giấy", target: "giay" },
      { year: 868, label: "Kỹ thuật in", target: "in" },
      { year: 1044, label: "Thuốc súng", target: "thuocsung" },
      { year: 1088, label: "La bàn", target: "laban" },
    ],
  },
  quote: {
    text: "Ba thứ ấy — kỹ thuật in, thuốc súng và nam châm — đã thay đổi toàn bộ diện mạo và trạng thái của thế giới: thứ nhất trong văn chương, thứ hai trong chiến tranh, thứ ba trong hàng hải.",
    cite: "Francis Bacon, Novum Organum, 1620",
    note: "Bacon không nhắc đến giấy, và ông không biết ba phát minh này đến từ Trung Hoa. Cụm từ “Bốn phát minh vĩ đại” do các học giả đời sau đặt ra.",
  },
  transition: {
    line: "Để hiểu một phát minh, phải quay về lúc nó chưa tồn tại.",
    cta: "Hãy tua ngược thời gian.",
  },
};

// ---------------- Theo sách giáo khoa (trong lúc đi qua Tử Cấm Thành) ----------------

/*
 * Mục c) “Văn minh Trung Hoa thời cổ – trung đại”, Bài 4, SGK Lịch sử 10 –
 * Kết nối tri thức với cuộc sống, tr. 27–30, trình bày thành gạch đầu dòng:
 * giữ đủ mọi ý và lời văn của sách, chỉ tách câu thành ý. Mỗi slide hiện khi
 * máy quay tới một công trình mới của Tử Cấm Thành. `*nghiêng*` = in nghiêng.
 * Ảnh “sgk-h…” cắt từ chính sách giáo khoa; ảnh khác từ Wikimedia Commons.
 */
export interface SgkSlide {
  /** Công trình máy quay đang tới. */
  place: { han: string; vi: string; en: string };
  heading: string;
  sub?: string;
  bullets: string[];
  images: { name: string; caption: string; sgk?: boolean }[];
  source?: { label: string; text: string; cite: string };
}

export const sgk = {
  kicker: "Theo SGK Lịch sử 10 · Kết nối tri thức với cuộc sống · Bài 4, tr. 27–30",
  title: "Văn minh Trung Hoa thời cổ – trung đại",
  slides: [
    {
      place: { han: "午門", vi: "Ngọ Môn", en: "The Meridian Gate" },
      heading: "Văn minh Trung Hoa thời cổ – trung đại",
      sub: "Khái quát",
      bullets: [
        "Hình thành và phát triển trên một không gian rộng lớn ở phía đông bắc châu Á.",
        "Có hàng nghìn dòng sông lớn nhỏ, quan trọng nhất là Hoàng Hà và Trường Giang.",
        "Các triều đại: Thương, Chu, Tần, Hán, Tùy – Đường, Tống, Nguyên, Minh, Thanh.",
        "Thành tựu trên nhiều lĩnh vực: tư tưởng, tôn giáo, chữ viết, văn học, nghệ thuật, khoa học, kĩ thuật.",
      ],
      images: [{ name: "sgk-h11-truongthanh", caption: "Một đoạn của Vạn Lý Trường Thành (SGK, Hình 11)", sgk: true }],
    },
    {
      place: { han: "太和門", vi: "Thái Hòa Môn", en: "The Gate of Supreme Harmony" },
      heading: "Tư tưởng, tôn giáo",
      bullets: [
        "Các học thuyết tư tưởng và tôn giáo hình thành từ rất sớm để giải thích về thế giới và đề xướng các biện pháp cai trị đất nước.",
        "Nho giáo, Đạo giáo, Mặc gia, Pháp gia và các thuyết Âm dương, Bát quái, Ngũ hành từ thời cổ đại đã trở thành nền tảng quan trọng về tư tưởng, thế giới quan của người Trung Hoa.",
        "Có ảnh hưởng đến nhiều quốc gia khác như: Nhật Bản, Triều Tiên, Việt Nam,…",
        "Phật giáo được du nhập vào Trung Hoa khoảng những thế kỉ đầu Công nguyên, được cải biến và phát triển rực rỡ, sau đó lan toả, ảnh hưởng ra các quốc gia khác trong khu vực.",
      ],
      images: [
        { name: "sgk-confucius", caption: "Khổng Tử, người sáng lập Nho giáo" },
        { name: "sgk-longmen", caption: "Tượng Phật, hang đá Long Môn" },
      ],
    },
    {
      place: { han: "太和殿", vi: "Điện Thái Hòa", en: "The Hall of Supreme Harmony" },
      heading: "Chữ viết",
      bullets: [
        "Chữ viết cổ nhất xuất hiện thời nhà Thương: chữ khắc trên mai rùa, xương thú (*chữ giáp cốt*) và khắc trên đồ đồng (*kim văn*).",
        "Đã nhiều lần được chỉnh lí và phát triển thành chữ Hán ngày nay.",
        "Không chỉ là công cụ để ghi chép, sáng tác văn thơ,… mà còn được nâng tầm lên thành nghệ thuật thư pháp.",
        "Được truyền bá và cải biên thành chữ viết của một số quốc gia như: Nhật Bản, Triều Tiên, Việt Nam,…",
      ],
      images: [
        { name: "sgk-h9-giapcot", caption: "Chữ giáp cốt – nguồn gốc của chữ Hán ngày nay (SGK, Hình 9)", sgk: true },
        { name: "sgk-calligraphy", caption: "Thư pháp của Vương Hi Chi" },
      ],
    },
    {
      place: { han: "中和殿", vi: "Điện Trung Hòa", en: "The Hall of Middle Harmony" },
      heading: "Văn học, nghệ thuật",
      sub: "Văn học",
      bullets: [
        "Kho tàng văn học Trung Hoa đồ sộ, đa dạng về thể loại, nội dung và phong cách nghệ thuật.",
        "Thơ ca, kịch và tiểu thuyết là các loại hình có nhiều thành tựu nhất.",
        "Thơ ca thời Đường (*Đường thi*), với ba nhà thơ nổi tiếng: Lý Bạch, Đỗ Phủ, Bạch Cư Dị.",
        "Tiểu thuyết chương hồi thời Minh – Thanh: *Tam quốc diễn nghĩa*, *Thuỷ hử*, *Tây du kí*, *Hồng lâu mộng*,...",
        "Được truyền bá đến một số nước trong khu vực, để lại dấu ấn sâu sắc trong văn hoá Triều Tiên, Nhật Bản và Việt Nam.",
      ],
      images: [{ name: "sgk-libai", caption: "«Lý Bạch hành ngâm đồ» – tranh Lương Giai" }],
    },
    {
      place: { han: "保和殿", vi: "Điện Bảo Hòa", en: "The Hall of Preserving Harmony" },
      heading: "Văn học, nghệ thuật",
      sub: "Kiến trúc, điêu khắc",
      bullets: [
        "Kiến trúc và điêu khắc gắn kết mật thiết với nhau.",
        "Công năng rất đa dạng: nhà ở, cung điện; công trình phòng thủ, quân sự; công trình tôn giáo, lăng mộ,…",
        "Công trình nổi tiếng nhất: *Vạn Lý Trường Thành*, *Tử Cấm Thành*, *Di Hoà Viên*, *Thập Tam Lăng*,…",
      ],
      images: [
        { name: "sgk-h10-binhsi", caption: "Tượng binh sĩ bằng đất nung trong lăng mộ Tần Thuỷ Hoàng (SGK, Hình 10)", sgk: true },
        { name: "sgk-summerpalace", caption: "Di Hòa Viên" },
        { name: "sgk-mingtombs", caption: "Thập Tam Lăng nhà Minh" },
      ],
    },
    {
      place: { han: "乾清門", vi: "Càn Thanh Môn", en: "The Gate of Heavenly Purity" },
      heading: "Văn học, nghệ thuật",
      sub: "Hội hoạ",
      bullets: [
        "Rất đa dạng cả về đề tài, nội dung và phong cách.",
        "Vẽ tranh trên nhiều chất liệu như gỗ, lụa, giấy,…",
        "Phong cách ước lệ, dùng các đường nét để miêu tả hình ảnh, thần thái, tình cảm,...",
        "Những đặc điểm đó tạo nên dấu ấn riêng biệt của hội hoạ Trung Hoa.",
      ],
      images: [{ name: "bg-qingming", caption: "«Thanh minh thượng hà đồ» (thời Tống), vẽ trên lụa" }],
    },
    {
      place: { han: "乾清宮", vi: "Cung Càn Thanh", en: "The Palace of Heavenly Purity" },
      heading: "Khoa học, kĩ thuật",
      sub: "Toán học · Thiên văn học",
      bullets: [
        "Thành tựu quan trọng ở Toán học, Thiên văn học, Y – Dược học, Sử học,... và phát minh kĩ thuật.",
        "Toán học: dùng hệ số đếm thập phân; tính diện tích hình phẳng, thể tích hình khối,…",
        "Lần đầu tiên tính được số pi (π) chính xác tới 7 chữ số thập phân; phát minh ra bàn tính,…",
        "Thiên văn học: là những người đầu tiên ghi chép về nhật thực, nguyệt thực và nhiều hiện tượng thiên văn khác.",
        "Sớm đặt ra lịch để phục vụ đời sống và sản xuất.",
      ],
      images: [
        { name: "sgk-abacus", caption: "Bàn tính" },
        { name: "sgk-starmap", caption: "Bản đồ sao Đôn Hoàng (thời Đường)" },
      ],
    },
    {
      place: { han: "交泰殿", vi: "Điện Giao Thái", en: "The Hall of Union" },
      heading: "Khoa học, kĩ thuật",
      sub: "Y – Dược học · Sử học",
      bullets: [
        "Chẩn đoán, lí giải và chữa trị các loại bệnh bằng nhiều phương pháp: dùng thuốc, châm cứu, giải phẫu,…",
        "Nhiều thầy thuốc nổi tiếng: Hoa Đà, Trương Trọng Cảnh,…",
        "Sử học đa dạng về hình thức, thể loại, nội dung.",
        "Tác phẩm nổi tiếng: *Xuân Thu* (bộ biên niên sử đầu tiên của Trung Hoa), *Sử kí* của Tư Mã Thiên,...",
        "Không chỉ có giá trị sử học mà còn là di sản văn hoá quý báu của nền văn minh Trung Hoa.",
      ],
      images: [{ name: "sgk-simaqian", caption: "Tư Mã Thiên, tác giả «Sử kí»" }],
    },
    {
      place: { han: "坤寧宮", vi: "Cung Khôn Ninh", en: "The Palace of Earthly Tranquility" },
      heading: "Khoa học, kĩ thuật",
      sub: "Bốn phát minh lớn",
      bullets: [
        "Bốn phát minh lớn về kĩ thuật: kĩ thuật làm giấy, kĩ thuật in, thuốc súng và la bàn.",
        "Các thành tựu khoa học, kĩ thuật có ý nghĩa to lớn, chứng tỏ sự phát triển của nền văn minh này.",
        "Nhiều thành tựu sớm được truyền bá đến các nước láng giềng, sang cả Tây Á.",
        "Sau đó lan truyền và thậm chí được ứng dụng rộng rãi ở châu Âu.",
      ],
      images: [
        { name: "tgkw-paper-3", caption: "Làm giấy («Thiên công khai vật», 1637)" },
        { name: "print-wood-1", caption: "Kinh Kim Cương in năm 868" },
      ],
    },
    {
      place: { han: "御花園", vi: "Ngự Hoa Viên", en: "The Imperial Garden" },
      heading: "Ý nghĩa",
      bullets: [
        "Để lại nhiều dấu ấn và ảnh hưởng trong lịch sử nhân loại, đặc biệt là đối với khu vực Đông Á.",
        "Sự truyền bá các thành tựu là minh chứng cho ảnh hưởng của nền văn minh Trung Hoa.",
        "Cho thấy mối liên hệ về văn hoá, tri thức, khoa học, kĩ thuật giữa phương Đông và phương Tây.",
      ],
      images: [],
      source: {
        label: "Tư liệu 3",
        text: "Giống như ở những nơi khác, Trung Quốc cổ đại phải đối mặt với thách thức do sự xuất hiện của các dân tộc du mục ở biên giới của mình. Tuy nhiên, không giống như Ha-ráp-pa, Xu-me và Ai Cập, Trung Quốc cổ đại đã vượt qua thách thức đó, nhiều thể chế và giá trị văn hoá của nền văn minh này vẫn tồn tại nguyên vẹn đến đầu thế kỉ XX. Vì lí do đó, nền văn minh Trung Hoa đôi khi được mô tả là nền văn minh tồn tại liên tục lâu đời nhất trên thế giới.",
        cite: "Theo Uy-li-am G. Đu-khơ, Giắc-xơn G. Spi-en-vô-ghen, *Lịch sử thế giới* (bản tiếng Anh), NXB Oát-uốt, 2010, tr. 68",
      },
    },
  ] as SgkSlide[],
};

// ---------------- Đại tua ngược ----------------

export interface RewindPage {
  year: Year;
  label: string;
  caption: string;
  image: string;
  imageAlt: string;
  /** Mobile keeps only these pages. */
  mobile?: boolean;
}

export const rewind: { pages: RewindPage[]; stopLine: string; forward: RewindPage[] } = {
  pages: [
    { year: 2026, label: "2026", caption: "Hôm nay.", image: "rewind-2026", imageAlt: "Tờ giấy trắng" },
    {
      year: 1949,
      label: "1949",
      caption: "Nội chiến kết thúc, nước Cộng hòa Nhân dân Trung Hoa được thành lập.",
      image: "rewind-1949",
      imageAlt: "Cổng Thiên An Môn",
      mobile: true,
    },
    {
      year: 1937,
      label: "1937",
      caption: "Sự biến Lư Câu Kiều mở đầu cuộc kháng chiến chống Nhật.",
      image: "rewind-1937",
      imageAlt: "Cầu đá Lư Câu Kiều, hàng sư tử đá",
    },
    {
      year: 1911,
      label: "1911",
      caption: "Cách mạng Tân Hợi chấm dứt chế độ quân chủ hơn hai nghìn năm.",
      image: "rewind-1911",
      imageAlt: "Chiếc bím tóc bị cắt đứt",
      mobile: true,
    },
    {
      year: 1851,
      label: "1851",
      caption: "Khởi nghĩa Thái Bình Thiên Quốc bùng nổ.",
      image: "rewind-1851",
      imageAlt: "Rừng cờ khởi nghĩa trước thành Nam Kinh",
    },
    { year: 1840, label: "1840", caption: "Chiến tranh Nha phiến.", image: "rewind-1840", imageAlt: "Tàu chiến phương Tây, hòm thuốc phiện", mobile: true },
    {
      year: 1644,
      label: "1644",
      caption: "Nhà Minh sụp đổ, quân Thanh tiến vào Sơn Hải Quan.",
      image: "rewind-1644",
      imageAlt: "Cổng Sơn Hải Quan mở toang",
      mobile: true,
    },
    { year: 1351, label: "1351", caption: "Khởi nghĩa Khăn Đỏ, mở đường cho nhà Minh.", image: "rewind-1351", imageAlt: "Biển người đội khăn đỏ" },
    {
      year: 1279,
      label: "1279",
      caption: "Trận Nhai Sơn, nhà Tống diệt vong.",
      image: "rewind-1279",
      imageAlt: "Thuyền chiến chìm giữa biển động",
      mobile: true,
    },
    {
      year: 960,
      label: "960",
      caption: "Binh biến Trần Kiều, nhà Tống lập nước.",
      image: "rewind-960",
      imageAlt: "Tấm hoàng bào khoác lên vai tướng quân",
      mobile: true,
    },
    {
      year: 907,
      label: "907",
      caption: "Nhà Đường sụp đổ, bắt đầu Ngũ Đại Thập Quốc.",
      image: "rewind-907",
      imageAlt: "Tấm bản đồ vỡ thành nhiều mảnh",
    },
    { year: 755, label: "755", caption: "Loạn An Sử.", image: "rewind-755", imageAlt: "Kỵ binh tràn qua cung điện Trường An", mobile: true },
    { year: 208, label: "208", caption: "Trận Xích Bích, mở ra thời Tam Quốc.", image: "rewind-208", imageAlt: "Thuyền lửa cháy rực mặt sông", mobile: true },
    { year: 184, label: "184", caption: "Khởi nghĩa Khăn Vàng.", image: "rewind-184", imageAlt: "Đoàn quân đội khăn vàng" },
    { year: -206, label: "206 TCN", caption: "Sở – Hán tranh hùng.", image: "rewind-206tcn", imageAlt: "Tiệc Hồng Môn, hai phe đối mặt" },
    {
      year: -221,
      label: "221 TCN",
      caption: "Nhà Tần thống nhất Trung Hoa.",
      image: "rewind-221tcn",
      imageAlt: "Hàng binh mã dũng bằng đất nung",
      mobile: true,
    },
    { year: -475, label: "475–221 TCN", caption: "Thời Chiến Quốc, bảy nước tranh hùng.", image: "rewind-chienquoc", imageAlt: "Bảy lá cờ chiến quốc" },
    {
      year: -770,
      label: "770–476 TCN",
      caption: "Thời Xuân Thu.",
      image: "rewind-xuanthu",
      imageAlt: "Bó thẻ tre khắc Binh pháp Tôn Tử",
      mobile: true,
    },
  ],
  stopLine: "Thời ấy, mọi tri thức đều được khắc trên tre.",
  forward: [
    {
      year: -221,
      label: "221 TCN",
      caption: "Nhà Tần thống nhất; giấy tờ của cả một đế chế vẫn viết trên thẻ tre.",
      image: "forward-qin",
      imageAlt: "Thẻ tre của nhà Tần",
    },
    {
      year: -150,
      label: "Thế kỷ II TCN",
      caption: "Những mảnh giấy thô đầu tiên xuất hiện thời Tây Hán.",
      image: "forward-xihan",
      imageAlt: "Mảnh giấy thô thời Tây Hán",
    },
    { year: 105, label: "105", caption: "Thái Luân dâng giấy lên vua Hán Hòa Đế.", image: "forward-caolun", imageAlt: "Thái Luân dâng giấy" },
  ],
};

// ---------------- Chương phát minh ----------------

export interface Step {
  name: string;
  desc: string;
}

export interface ChapterData {
  id: "giay" | "in" | "thuocsung" | "laban";
  page: number;
  han: string;
  title: string;
  owner: string;
  fromYear: Year;
  landYear: Year;
  dynastySeal: string;
  dynastyName: string;
  transition?: { lead: string; note: string };
  open: string;
  openNote?: string;
  why: string[];
  whyImage: string;
  origin: string[];
  primary: { han?: string; vi?: string; cite?: string; placeholder?: string };
  reading: string;
  extraPrimary?: string;
  process: { note?: string; parts: { title?: string; prefix: string; steps: Step[] }[] };
  spread: { route: { place: string; when: string; key: SpreadKey }[]; vietnam?: string; note?: string; reverse?: string };
  significance: { china: string; world: string; vietnam: string };
  groupNote: string;
  secondary: string[];
  ai: { prompt1: string; mistakes: string; prompt2: string; verified: string; hint?: string; shots: string[] };
  questions: { teacher: string; groups: string; hint: string };
}

export type SpreadKey = "china" | "vietnam" | "korea" | "japan" | "samarkand" | "baghdad" | "arab" | "spain" | "italy" | "europe" | "mongol";

export const chapters: ChapterData[] = [
  {
    id: "giay",
    page: 2,
    han: "紙",
    title: "Giấy",
    owner: "Lê Trầm Tính",
    fromYear: -770,
    landYear: 105,
    dynastySeal: "漢",
    dynastyName: "Hán",
    open: "Trước khi có giấy, một cuốn sách nặng bằng cả một xe bò.",
    openNote: "Câu mang tính hình ảnh.",
    why: [
      "Người Trung Hoa viết lên thẻ tre: rẻ nhưng rất nặng, cồng kềnh, dây buộc dễ đứt.",
      "Hoặc viết lên lụa: nhẹ, đẹp nhưng quá đắt, chỉ giới quý tộc dùng được.",
      "Nhà nước Hán cần một vật liệu vừa rẻ vừa nhẹ để ghi chép giấy tờ, sách vở và thư từ.",
    ],
    whyImage: "why-paper",
    origin: [
      "Khảo cổ học đã tìm thấy những mảnh giấy thô từ thời Tây Hán, thế kỷ II TCN, dùng để gói đồ hoặc vẽ bản đồ.",
      "Năm 105, hoạn quan Thái Luân cải tiến cách làm giấy từ vỏ cây, đầu sợi gai, vải rách và lưới đánh cá cũ, rồi dâng lên vua Hán Hòa Đế. Vua khen ngợi, từ đó giấy được dùng rộng rãi và người đời gọi là “giấy Thái hầu”.",
      "Vì vậy Thái Luân nên được xem là người cải tiến và phổ biến, không phải người đầu tiên làm ra giấy.",
    ],
    primary: {
      han: "自古書契多編以竹簡，其用縑帛者謂之為紙。縑貴而簡重，並不便於人。倫乃造意，用樹膚、麻頭及敝布、魚網以為紙。",
      vi: "Từ xưa, văn thư phần nhiều viết trên thẻ tre kết lại; loại viết trên lụa thì gọi là chỉ. Lụa thì đắt, thẻ tre thì nặng, đều bất tiện cho người dùng. Luân bèn nghĩ ra cách dùng vỏ cây, đầu gai, vải rách và lưới đánh cá để làm giấy.",
      cite: "Phạm Diệp, Hậu Hán thư, “Thái Luân truyện”, thế kỷ V",
    },
    reading:
      "Đoạn văn cho thấy giấy ra đời để giải quyết đúng hai vấn đề: đắt và nặng. Cần lưu ý rằng Hậu Hán thư được viết khoảng 300 năm sau thời Thái Luân, bởi sử quan triều đình, nên có xu hướng gán phát minh cho một cá nhân gắn với cung đình.",
    process: {
      note: "Các bước chi tiết được ghi lại rõ nhất trong Thiên công khai vật (Tống Ứng Tinh, 1637), tức là sau thời Thái Luân rất lâu. Nguyên lý cơ bản thì vẫn giống nhau.",
      parts: [
        {
          prefix: "tgkw-paper",
          steps: [
            { name: "Chọn nguyên liệu", desc: "Vỏ cây, sợi gai, vải rách, lưới cũ — những thứ rẻ và sẵn có." },
            { name: "Ngâm", desc: "Ngâm nguyên liệu trong nước nhiều ngày cho mềm." },
            { name: "Nấu", desc: "Nấu với nước vôi hoặc nước tro để tách sợi." },
            { name: "Giã", desc: "Giã nát thành bột sợi mịn." },
            { name: "Hòa bể", desc: "Khuấy bột sợi vào một bể nước lớn." },
            { name: "Xeo giấy", desc: "Nhúng khuôn lưới vào bể, vớt lên một lớp sợi mỏng đều." },
            { name: "Ép", desc: "Xếp chồng các lớp và ép cho ráo nước." },
            { name: "Phơi", desc: "Dán từng tờ lên tường nóng hoặc phơi nắng cho khô." },
            { name: "Hoàn thành", desc: "Bóc ra — một tờ giấy." },
          ],
        },
      ],
    },
    spread: {
      route: [
        { place: "Trung Hoa", when: "105", key: "china" },
        { place: "Triều Tiên", when: "khoảng thế kỷ IV–VI", key: "korea" },
        { place: "Nhật Bản", when: "610", key: "japan" },
        { place: "Samarkand", when: "khoảng 751", key: "samarkand" },
        { place: "Baghdad", when: "khoảng 794", key: "baghdad" },
        { place: "Tây Ban Nha", when: "thế kỷ XII", key: "spain" },
        { place: "Ý", when: "1276", key: "italy" },
      ],
      vietnam: "Việt Nam: từ thời Bắc thuộc.",
      note: "Câu chuyện “tù binh Trung Hoa sau trận Talas (751) truyền nghề giấy cho người Ả Rập” là truyền thuyết, giới sử học còn tranh cãi.",
    },
    significance: {
      china: "Sách vở rẻ hơn, việc học, thi cử và bộ máy hành chính dựa trên văn bản phát triển. Thời Tống, giấy còn được dùng làm tiền.",
      world: "Giấy theo Con đường Tơ lụa sang thế giới Hồi giáo rồi châu Âu, trở thành nền cho kỹ thuật in của Gutenberg.",
      vietnam:
        "Nghề giấy dó phát triển từ sớm. Làng Yên Thái (Kẻ Bưởi, Hà Nội) nổi tiếng làm giấy dùng cho sắc phong, sách vở. Giấy điệp là nền của tranh Đông Hồ.",
    },
    groupNote:
      "Giấy là phát minh “thầm lặng” nhất, nhưng ba phát minh còn lại đều cần đến nó: kỹ thuật in cần giấy để in, binh thư và hải đồ đều viết trên giấy. Nhóm cho rằng giấy là phát minh giúp tri thức rời khỏi tay tầng lớp quý tộc.",
    secondary: ["Tsien Tsuen-hsuin, Paper and Printing, 1985", "SGK Lịch sử 10, chủ đề Văn minh Trung Hoa cổ – trung đại"],
    ai: {
      prompt1: "Ai phát minh ra giấy?",
      mistakes:
        "Nói chắc chắn “Thái Luân phát minh ra giấy năm 105” mà bỏ qua giấy khảo cổ thời Tây Hán; kể chuyện trận Talas như sự thật.",
      prompt2: "Có bằng chứng khảo cổ nào về giấy trước thời Thái Luân không? Câu chuyện trận Talas có đáng tin không?",
      verified: "Hậu Hán thư, Tsien (1985)",
      shots: ["ai/giay-1", "ai/giay-2"],
    },
    questions: {
      teacher: "Nếu Thái Luân chỉ là người cải tiến, vì sao sử sách vẫn ghi công cho ông? Điều đó nói gì về cách sử quan thời xưa ghi chép?",
      groups: "Ngày nay ta dùng giấy ít dần. “Giấy” của thời đại số là gì?",
      hint: "Màn hình, bộ nhớ đám mây… Điểm chung là rẻ, nhẹ, lưu được nhiều.",
    },
  },
  {
    id: "in",
    page: 3,
    han: "印",
    title: "Kỹ thuật in",
    owner: "Nguyễn Gia Hưng",
    fromYear: 105,
    landYear: 868,
    dynastySeal: "唐",
    dynastyName: "Đường",
    transition: {
      lead: "Tám thế kỷ sau, giấy đã có khắp nơi. Nhưng mỗi cuốn sách vẫn phải chép bằng tay.",
      note: "Kỹ thuật in khắc gỗ có lẽ đã xuất hiện từ khoảng thế kỷ VII–VIII; năm 868 là bản in có ghi năm sớm nhất còn lại.",
    },
    open: "Chép tay một cuốn kinh mất nhiều tháng. Khắc một tấm gỗ, có thể in ra hàng nghìn bản.",
    why: [
      "Có giấy rồi, nhưng mỗi cuốn sách vẫn phải chép tay: chậm, đắt và dễ sai.",
      "Phật giáo phát triển mạnh thời Đường, nhu cầu nhân bản kinh sách rất lớn. In kinh để phát không cũng được xem là làm việc công đức.",
      "Người Trung Hoa đã quen với con dấu và kỹ thuật dập chữ từ bia đá, nên ý tưởng “khắc ngược, bôi mực, ấn xuống” đã có sẵn.",
    ],
    whyImage: "why-print",
    origin: [
      "Nghệ thuật in bắt nguồn từ việc khắc con dấu: khắc chữ ngược, bôi mực rồi ấn xuống.",
      "In khắc gỗ toàn trang xuất hiện khoảng thế kỷ VII–VIII thời Đường: khắc cả một trang chữ ngược lên một tấm gỗ.",
      "Kinh Kim Cương năm 868 được tìm thấy ở hang Mạc Cao, Đôn Hoàng năm 1907 và hiện lưu giữ ở Thư viện Anh. Cuối cuốn kinh có dòng ghi rằng Vương Giới cho in vì cha mẹ, để phát không cho mọi người.",
      "Trong khoảng năm 1041–1048 thời Bắc Tống, một người dân thường tên Tất Thăng sáng chế chữ in rời bằng đất sét nung.",
      "Người đời sau tiếp tục cải tiến: chữ gỗ (Vương Trinh, thời Nguyên) và chữ đồng (thời Minh).",
    ],
    primary: {
      han: "慶曆中，有布衣畢昇，又為活板。其法用膠泥刻字，薄如錢唇，每字為一印，火燒令堅。",
      vi: "Trong niên hiệu Khánh Lịch, có người áo vải là Tất Thăng làm ra bản in rời. Cách làm là lấy đất sét khắc chữ, mỏng như vành đồng tiền, mỗi chữ là một con dấu, đem nung lửa cho cứng.",
      cite: "Thẩm Quát, Mộng Khê bút đàm, khoảng 1088",
    },
    reading:
      "“Áo vải” cho biết Tất Thăng là dân thường. Một phát minh quan trọng đến từ người lao động, nhưng chỉ còn được biết đến nhờ một vị quan ghi chép lại. Cụm “mỗi chữ là một con dấu” cũng là lý do con dấu đỏ xuất hiện trên khắp trang web này.",
    process: {
      parts: [
        {
          title: "In khắc gỗ",
          prefix: "print-wood",
          steps: [
            { name: "Viết bản mẫu", desc: "Viết chữ lên một tờ giấy mỏng." },
            { name: "Dán úp", desc: "Dán úp tờ giấy lên ván gỗ, chữ hiện ngược." },
            { name: "Khắc", desc: "Đục bỏ phần gỗ không có chữ, để chữ nổi lên." },
            { name: "Bôi mực", desc: "Quét mực lên mặt ván." },
            { name: "Ép giấy", desc: "Đặt giấy lên, xoa đều bằng bàn chải." },
            { name: "Bóc", desc: "Bóc tờ giấy — một trang in hoàn chỉnh." },
          ],
        },
        {
          title: "Chữ rời của Tất Thăng",
          prefix: "print-type",
          steps: [
            { name: "Khắc chữ", desc: "Khắc mỗi chữ lên một miếng đất sét nhỏ. Chữ hay dùng được làm hơn 20 con." },
            { name: "Nung", desc: "Nung lửa cho chữ cứng lại." },
            { name: "Chuẩn bị khay", desc: "Phủ lên khay sắt một lớp nhựa thông, sáp và tro giấy." },
            { name: "Xếp chữ", desc: "Đặt khung sắt lên khay, xếp các con chữ vào khung." },
            { name: "Cố định", desc: "Hơ nóng cho sáp chảy, dùng tấm ván ép cho mặt chữ phẳng." },
            { name: "In", desc: "Bôi mực và in như in khắc gỗ." },
            { name: "Tháo & dùng lại", desc: "Hơ nóng lần nữa để tháo chữ. Dùng hai khay luân phiên: khay này in, khay kia xếp chữ." },
          ],
        },
        {
          title: "Sau Tất Thăng",
          prefix: "print-after",
          steps: [
            {
              name: "Chữ gỗ",
              desc: "Thời Nguyên, Vương Trinh cho khắc khoảng hơn 6 vạn chữ gỗ và dùng bàn xoay để chọn chữ, ghi lại trong Nông thư (1313).",
            },
            { name: "Chữ đồng", desc: "Thời Minh, chữ in bằng đồng được dùng để in sách, bền hơn chữ đất nung và chữ gỗ." },
          ],
        },
      ],
    },
    spread: {
      route: [
        { place: "Trung Hoa", when: "khắc gỗ, thế kỷ VII–VIII", key: "china" },
        { place: "Nhật Bản", when: "770 (Hyakumantō Darani, không ghi năm in trên bản)", key: "japan" },
        { place: "Triều Tiên", when: "1377 (chữ kim loại)", key: "korea" },
        { place: "Đại Việt", when: "thế kỷ XV", key: "vietnam" },
        { place: "Châu Âu", when: "khoảng 1450 (có thể là phát minh độc lập)", key: "europe" },
      ],
    },
    significance: {
      china: "Kinh Phật, sách Nho, sách thi cử được in hàng loạt; tri thức lan rộng ra ngoài cung đình.",
      world:
        "Kỹ thuật in giúp sách rẻ đi, góp phần vào Phục hưng, Cải cách tôn giáo và cách mạng khoa học ở châu Âu. Chưa có bằng chứng Gutenberg học từ Trung Hoa.",
      vietnam:
        "Thám hoa Lương Như Hộc (thế kỷ XV) được xem là ông tổ nghề khắc in, truyền nghề cho làng Hồng Lục, Liễu Tràng (Hải Dương). Mộc bản triều Nguyễn được UNESCO công nhận là Di sản tư liệu thế giới năm 2009.",
    },
    groupNote:
      "Con dấu đỏ trên trang web này chính là tổ tiên của kỹ thuật in: khắc ngược, bôi mực, ấn xuống. Ý tưởng “mỗi chữ là một con dấu” của Tất Thăng rất gần với cách máy tính ngày nay xử lý từng ký tự — một phát minh gần 1000 năm tuổi vẫn còn “sống” trong mỗi văn bản chúng ta gõ.",
    secondary: ["Frances Wood & Mark Barnard, The Diamond Sutra, 2010", "Tsien Tsuen-hsuin, Paper and Printing, 1985"],
    ai: {
      prompt1: "Cuốn sách in cổ nhất thế giới là gì?",
      mistakes:
        "Nói Kinh Kim Cương là “sách in cổ nhất” (chính xác: sách in có ghi năm cổ nhất còn trọn vẹn); nói Gutenberg “phát minh ra kỹ thuật in”.",
      prompt2: "Có bản in nào cổ hơn Kinh Kim Cương không? Nó khác ở điểm gì?",
      verified: "Wood & Barnard (2010), trang của Thư viện Anh",
      shots: ["ai/in-1", "ai/in-2"],
    },
    questions: {
      teacher: "Trung Hoa có chữ rời trước châu Âu 400 năm. Vì sao chữ rời tạo ra cách mạng ở châu Âu mà không ở Trung Hoa?",
      groups: "Chữ Quốc ngữ có dễ in chữ rời hơn chữ Hán, chữ Nôm không? Vì sao?",
      hint: "Chữ Quốc ngữ chỉ cần vài chục ký tự và dấu; chữ Hán, chữ Nôm cần hàng nghìn ký tự.",
    },
  },
  {
    id: "thuocsung",
    page: 4,
    han: "火藥",
    title: "Thuốc súng",
    owner: "Đào Quang Anh",
    fromYear: 868,
    landYear: 1044,
    dynastySeal: "宋",
    dynastyName: "Tống",
    transition: {
      lead: "Năm 1044, một bộ binh thư của nhà Tống ghi lại công thức của một thứ bột có thể phun lửa.",
      note: "Nhưng câu chuyện bắt đầu từ hai trăm năm trước, trong những lò luyện đan thời Đường…",
    },
    open: "Họ đi tìm thuốc bất tử. Họ tìm ra thứ có thể giết người nhanh nhất.",
    why: [
      "Thuốc súng không được tạo ra có chủ đích. Nó là sản phẩm phụ của thuật luyện đan.",
      "Các đạo sĩ thời Đường nung trộn khoáng chất như diêm tiêu, lưu huỳnh để tìm “tiên đan” kéo dài tuổi thọ.",
      "Nhiều lần hỗn hợp bốc cháy dữ dội, làm bỏng người và cháy nhà.",
    ],
    whyImage: "why-powder",
    origin: [
      "Sách đạo giáo Chân nguyên diệu đạo yếu lược (khoảng thế kỷ IX, niên đại còn tranh luận) đã cảnh báo rằng trộn một số chất rồi đốt có thể cháy tay, cháy mặt, thậm chí cháy rụi nhà cửa. Đây là một trong những ghi chép sớm nhất về thuốc súng.",
      "Dần dần, nhà Đường cuối và nhà Tống nhận ra giá trị quân sự của nó.",
      "Năm 1044, bộ binh thư Vũ kinh tổng yếu do Tăng Công Lượng và Đinh Độ biên soạn ghi lại các công thức dùng trong chiến tranh — công thức thuốc súng cổ nhất còn lại trên thế giới.",
    ],
    primary: {
      placeholder:
        "Trích đoạn Đại Việt sử ký toàn thư ghi sự kiện năm Canh Ngọ (1390): quân Trần Khát Chân dùng súng bắn trúng thuyền, giết Chế Bồng Nga. [Nhóm chép nguyên văn từ bản dịch Toàn thư (NXB Khoa học Xã hội) và ghi số trang.]",
      cite: "Ngô Sĩ Liên và các sử thần, Đại Việt sử ký toàn thư",
    },
    reading:
      "Đây là ghi chép sớm về việc Đại Việt dùng hỏa khí. Cần lưu ý rằng Toàn thư do sử quan nhà Lê biên soạn gần một thế kỷ sau sự kiện, và có xu hướng đề cao chiến thắng của Đại Việt.",
    process: {
      parts: [
        {
          title: "Từ lò luyện đan đến chiến trường",
          prefix: "powder",
          steps: [
            { name: "Lò luyện đan", desc: "Đạo sĩ nung khoáng chất tìm thuốc trường sinh." },
            { name: "Tai nạn", desc: "Hỗn hợp bùng cháy, gây bỏng và hỏa hoạn." },
            { name: "Lời cảnh báo", desc: "Sách đạo giáo ghi lại để người sau tránh." },
            { name: "Tên lửa cháy", desc: "Buộc thuốc vào mũi tên để bắn lửa vào thành địch." },
            { name: "Hỏa cầu", desc: "Bọc thuốc thành quả cầu, ném bằng máy bắn đá." },
            { name: "Hỏa thương", desc: "Ống tre nhồi thuốc, phun lửa ở đầu giáo — tổ tiên của súng." },
            { name: "Súng", desc: "Ống kim loại dùng sức nổ đẩy đạn đi — vũ khí thay đổi chiến tranh." },
          ],
        },
      ],
    },
    spread: {
      route: [
        { place: "Trung Hoa", when: "thế kỷ IX; 1044", key: "china" },
        { place: "Mông Cổ", when: "thế kỷ XIII", key: "mongol" },
        { place: "Châu Âu", when: "1267", key: "europe" },
        { place: "Thế giới Ả Rập", when: "khoảng 1280", key: "arab" },
        { place: "Đại Việt", when: "1390", key: "vietnam" },
      ],
      reverse: "Đi ngược lại: Hồ Nguyên Trừng mang kỹ thuật hỏa khí của Đại Việt về nhà Minh.",
    },
    significance: {
      china: "Nhà Tống dùng hỏa khí để chống quân Kim, Mông Cổ. Thuốc súng còn làm pháo hoa trong lễ hội.",
      world: "Súng đại bác làm sụp đổ lâu đài phong kiến châu Âu và thay đổi chiến tranh mãi mãi. Ngày nay thuốc nổ còn dùng trong khai mỏ, làm đường.",
      vietnam:
        "Năm 1390, quân Trần Khát Chân dùng súng giết Chế Bồng Nga. Hồ Nguyên Trừng, sau khi bị nhà Minh bắt, được giao chế tạo hỏa khí và theo nhiều tài liệu được thờ như “thần súng”.",
    },
    groupNote:
      "Thuốc súng là phát minh “hai mặt” rõ nhất: sinh ra từ ước mơ trường sinh nhưng trở thành công cụ chiến tranh. Câu chuyện Hồ Nguyên Trừng cho thấy kỹ thuật không đi theo một chiều — Việt Nam không chỉ tiếp nhận mà còn đóng góp ngược lại.",
    secondary: ["Joseph Needham và cộng sự, Military Technology: The Gunpowder Epic, 1986"],
    ai: {
      prompt1: "Người Trung Hoa chỉ dùng thuốc súng làm pháo hoa, đúng không?",
      mistakes: "Đồng ý với định kiến “Trung Hoa chỉ dùng làm pháo hoa, châu Âu mới dùng đánh trận”. Sai, vì Vũ kinh tổng yếu là sách quân sự.",
      prompt2: "Vũ kinh tổng yếu là loại sách gì và ghi thuốc súng dùng vào việc gì?",
      verified: "Needham (1986)",
      shots: ["ai/thuocsung-1", "ai/thuocsung-2"],
    },
    questions: {
      teacher:
        "Nếu một phát minh gây ra nhiều chết chóc, người phát minh có phải chịu trách nhiệm đạo đức không? Câu hỏi này có còn đúng với AI ngày nay?",
      groups: "Các bạn biết câu chuyện nào về hỏa khí trong lịch sử Việt Nam?",
      hint: "Hồ Nguyên Trừng, trận năm 1390, súng thần công thời Nguyễn ở Huế.",
    },
  },
  {
    id: "laban",
    page: 5,
    han: "指南",
    title: "La bàn",
    owner: "Trịnh Minh Tuấn",
    fromYear: 1044,
    landYear: 1088,
    dynastySeal: "宋",
    dynastyName: "Tống",
    transition: {
      lead: "Cũng trong cuốn binh thư năm 1044 ấy có mô tả một chiếc “cá” biết chỉ đường. 44 năm sau, Thẩm Quát viết về một chiếc kim.",
      note: "Tiền thân của nó có thể còn xa hơn nữa — chiếc “tư nam” từ thời Chiến Quốc, nếu cách hiểu ấy là đúng.",
    },
    open: "Trước khi dẫn đường cho tàu thuyền, chiếc kim này dùng để xem hướng đất.",
    why: [
      "Từ rất sớm, người Trung Hoa biết đá nam châm hút sắt và luôn quay về một hướng.",
      "Ban đầu, dụng cụ chỉ hướng dùng trong phong thủy: chọn hướng nhà, hướng mộ, hướng cung điện.",
      "Về sau, thương mại đường biển thời Tống phát triển mạnh; thủy thủ cần một cách định hướng khi không nhìn thấy sao hay mặt trời.",
    ],
    whyImage: "why-compass",
    origin: [
      "Nhiều tài liệu cho rằng từ thời Chiến Quốc (thế kỷ III TCN), người Trung Hoa đã làm ra “tư nam” — dụng cụ chỉ hướng bằng đá nam châm tự nhiên — dựa vào câu “tiên vương lập tư nam” trong Hàn Phi Tử.",
      "Luận hành của Vương Sung (thế kỷ I) mô tả “tư nam” giống chiếc thìa quay trên mặt đồng.",
      "Cả hai cách hiểu còn tranh luận: chưa tìm thấy hiện vật, và mô hình thìa trên đĩa đồng trong sách là bản phục dựng thế kỷ XX.",
      "Vũ kinh tổng yếu (1044) mô tả cá chỉ nam: miếng sắt hình cá thả nổi trên bát nước.",
      "Khoảng năm 1088, Thẩm Quát mô tả kim sắt được mài lên đá nam châm để chỉ hướng, và lần đầu ghi lại rằng kim hơi lệch về phía đông — hiện tượng độ lệch từ.",
      "Khoảng năm 1119, Bình Châu khả đàm của Chu Úc ghi thủy thủ dùng kim chỉ nam trên biển.",
    ],
    primary: {
      han: "方家以磁石磨針鋒，則能指南，然常微偏東，不全南也。",
      vi: "Các thầy phương thuật lấy đá nam châm mài đầu kim thì kim chỉ được hướng nam, nhưng thường hơi lệch về đông, không hoàn toàn đúng nam.",
      cite: "Thẩm Quát, Mộng Khê bút đàm, khoảng 1088",
    },
    reading:
      "Chỉ một câu nhưng có hai thông tin quan trọng: cách làm kim chỉ nam và quan sát khoa học về độ lệch từ, sớm hơn châu Âu vài trăm năm. Người dùng la bàn khi đó là “các thầy phương thuật”, cho thấy la bàn vẫn gắn với phong thủy.",
    extraPrimary: "Chu Úc, Bình Châu khả đàm, khoảng 1119",
    process: {
      parts: [
        {
          title: "Tiến hóa của la bàn",
          prefix: "compass",
          steps: [
            { name: "Đá nam châm", desc: "Người xưa phát hiện đá hút sắt và tự quay về một hướng." },
            {
              name: "Tư nam",
              desc: "Dụng cụ bằng đá nam châm tự nhiên, thường được hình dung là chiếc thìa trên mặt đồng (thời Chiến Quốc – Hán, còn tranh luận).",
            },
            { name: "Cá chỉ nam (1044)", desc: "Miếng sắt hình cá thả trên bát nước, đầu cá chỉ hướng nam." },
            {
              name: "Kim nam châm nhân tạo",
              desc: "Thời Bắc Tống, mài đầu kim sắt lên đá nam châm để kim có từ tính — không còn phụ thuộc vào hình dạng đá tự nhiên.",
            },
            {
              name: "Bốn cách đặt kim",
              desc: "Thẩm Quát thử bốn cách: thả nổi trên nước, đặt trên móng tay, đặt trên miệng bát, treo bằng sợi tơ. Ông cho rằng treo bằng sợi tơ là tốt nhất.",
            },
            { name: "La bàn trên biển (khoảng 1119)", desc: "Thủy thủ nhìn kim chỉ nam khi trời u ám." },
            { name: "La kinh", desc: "La bàn phong thủy với nhiều vòng phương vị, dùng đến ngày nay." },
          ],
        },
      ],
    },
    spread: {
      route: [
        { place: "Trung Hoa", when: "đi biển khoảng 1119", key: "china" },
        { place: "Châu Âu", when: "khoảng 1190", key: "europe" },
        { place: "Thế giới Ả Rập – Ba Tư", when: "thế kỷ XIII", key: "arab" },
      ],
      vietnam: "Việt Nam: la bàn dùng trong phong thủy và nghề đi biển.",
      note: "Có giả thuyết cho rằng châu Âu tìm ra la bàn độc lập.",
    },
    significance: {
      china: "Thương thuyền thời Tống đi biển được cả khi trời u ám, mậu dịch đường biển phát triển mạnh.",
      world: "La bàn trở thành công cụ không thể thiếu của thời đại Phát kiến địa lý.",
      vietnam:
        "La bàn (còn gọi địa bàn, la kinh) gắn với phong thủy, xây dựng nhà cửa, lăng mộ và nghề đi biển. Tên gọi “la bàn” bắt nguồn từ chữ 羅盤.",
    },
    groupNote:
      "La bàn được dùng để xem phong thủy trước rồi mới dùng để đi biển. Một phát minh không phải lúc nào cũng được dùng theo cách “hữu ích nhất” ngay từ đầu; giá trị của nó phụ thuộc vào nhu cầu của xã hội ở từng thời điểm.",
    secondary: ["Joseph Needham, Science and Civilisation in China, tập 4 phần 1, 1962"],
    ai: {
      prompt1: "La bàn được phát minh khi nào?",
      mistakes:
        "Khẳng định “la bàn ra đời thời Chiến Quốc” hoặc “người Trung Hoa dùng la bàn đi biển từ thời Hán”, trình bày mô hình thìa tư nam như hiện vật thật.",
      prompt2: "Bằng chứng nào chắc chắn nhất về la bàn từ tính? Mô hình thìa tư nam là hiện vật hay phục dựng?",
      verified: "Mộng Khê bút đàm, Bình Châu khả đàm, Needham (1962)",
      hint: "Đây chính là lỗi có trong bảng dòng thời gian ban đầu của nhóm — có thể dùng làm ví dụ phản tư AI rất thật.",
      shots: ["ai/laban-1", "ai/laban-2"],
    },
    questions: {
      teacher: "Thẩm Quát phát hiện độ lệch từ từ thế kỷ XI. Vì sao phát hiện này không dẫn đến một cuộc “phát kiến địa lý” của Trung Hoa như ở châu Âu?",
      groups: "La bàn trong điện thoại hoạt động giống hay khác kim chỉ nam của Thẩm Quát?",
      hint: "Cả hai đều đo từ trường Trái Đất; điện thoại dùng cảm biến điện tử thay cho kim sắt.",
    },
  },
];

export const aiNote = "Phần phản tư chỉ là kịch bản gồm câu lệnh và lỗi AI hay mắc. Nhóm cần chạy thật, chụp màn hình câu trả lời thật rồi đưa lên trang.";

// ---------------- Trang 6 ----------------

export const finale = {
  credits: "Câu đố: Nguyễn Gia Hưng · Kết luận: Đào Quang Anh · Nguồn: Trịnh Minh Tuấn",
  fastForward: "Gần một nghìn năm trôi qua trong vài giây.",
  convergence: "Bốn phát minh. Hơn một nghìn năm. Vẫn còn ở quanh bạn.",
  montage: "Từ cổ đại đến hôm nay",
  fireworks: "Pháo hoa — niềm vui mà thuốc súng mang đến cho con người.",
  modern: [
    {
      id: "giay",
      ancient: "Giấy",
      today: "Màn hình & kho tài liệu số",
      note: "Giấy làm cho việc ghi chép trở nên rẻ và dễ lưu giữ. Ngày nay sách, báo, giáo trình được lưu trong thư viện số và đọc trên màn hình — “tờ giấy” của thời đại số.",
      facts: [
        "Thư viện số lưu sách, báo, giáo trình dưới dạng tệp, đọc trên máy tính, điện thoại, máy tính bảng.",
        "Một chiếc máy tính bảng có thể chứa hàng nghìn cuốn sách.",
        "Giấy vẫn có mặt hằng ngày: sách vở, bao bì, tiền giấy.",
      ],
    },
    {
      id: "in",
      ancient: "Kỹ thuật in",
      today: "In 3D & máy CNC",
      note: "Từ khắc ván và sắp chữ rời đến máy in 3D đắp vật thể từng lớp và máy CNC khắc theo lệnh số: vẫn là ý tưởng sao chép một mẫu thành nhiều bản.",
      facts: [
        "Máy in 3D đắp nhựa hoặc kim loại thành từng lớp mỏng theo bản vẽ trên máy tính.",
        "Máy CNC dùng máy tính điều khiển mũi dao để khắc, phay chính xác.",
        "Sách báo hằng ngày vẫn được in bằng máy in offset tốc độ cao.",
      ],
    },
    {
      id: "laban",
      ancient: "La bàn",
      today: "GPS, Bắc Đẩu & bản đồ di động",
      note: "Điện thoại chỉ đường nhờ tín hiệu vệ tinh. Hệ thống định vị vệ tinh của Trung Quốc mang tên chòm sao Bắc Đẩu — ngôi sao dẫn đường của người xưa.",
      facts: [
        "GPS (Mỹ), Bắc Đẩu (Trung Quốc), GLONASS (Nga), Galileo (châu Âu) là các hệ thống định vị vệ tinh toàn cầu.",
        "Điện thoại nhận tín hiệu của nhiều vệ tinh cùng lúc để tính ra vị trí của mình.",
        "La bàn điện tử trong điện thoại vẫn đo từ trường Trái Đất, như kim chỉ nam ngày xưa.",
      ],
    },
    {
      id: "thuocsung",
      ancient: "Thuốc súng",
      today: "Tên lửa & vũ khí hiện đại",
      note: "Thuốc súng mở đầu thời đại hỏa khí. Ngày nay, tên lửa đạn đạo có thể mang đầu đạn hạt nhân — sức hủy diệt khiến con người phải cân nhắc cách dùng công nghệ.",
      facts: [
        "Thuốc súng mở đầu thời đại hỏa khí: súng, pháo, rồi tên lửa.",
        "Thuốc nổ cũng phục vụ hòa bình: pháo hoa, khai thác mỏ, phá đá làm đường.",
        "Tên lửa đạn đạo có thể mang đầu đạn hạt nhân — sức hủy diệt rất lớn.",
      ],
    },
  ] as const,
  weapons: {
    title: "Thuốc súng → tên lửa & vũ khí hiện đại",
    items: [
      { name: "Đông Phong-41 (DF-41)", note: "Tên lửa đạn đạo xuyên lục địa trên xe phóng 16 bánh; lần đầu xuất hiện ở lễ duyệt binh năm 2019." },
      { name: "Đông Phong-17 (DF-17)", note: "Tên lửa mang tàu lượn siêu vượt âm; lần đầu xuất hiện ở lễ duyệt binh năm 2019." },
      { name: "Xe tăng Type 99A", note: "Xe tăng chiến đấu chủ lực." },
      { name: "Pháo tự hành PLZ-05", note: "Pháo tự hành 155 mm bánh xích." },
      { name: "Hồng Kỳ-9 (HQ-9)", note: "Hệ thống tên lửa phòng không tầm xa." },
      { name: "Ngư lôi Yu-6", note: "Ngư lôi hạng nặng phóng từ tàu ngầm." },
      { name: "J-20", note: "Máy bay tiêm kích tàng hình của Không quân Trung Quốc." },
    ],
    air: {
      title: "Tên lửa không đối không PL-15",
      points: [
        "Phóng từ khoang vũ khí kín trong thân tiêm kích J-20.",
        "Động cơ nhiên liệu rắn — hậu duệ xa của thuốc súng — đẩy tên lửa tăng tốc rất nhanh.",
        "Đầu dò ra-đa ở mũi tự bám theo mục tiêu.",
      ],
      caption: "Mô phỏng: hai tiêm kích J-20 bay thấp trong hẻm núi; tên lửa bắn trúng một máy bay mục tiêu không người lái.",
    },
    flight: "Mô phỏng: một tên lửa đạn đạo phóng từ Trung Quốc, bay vòng qua Thái Bình Dương.",
    caption: "Mô hình 3D dựng lại hình dáng bên ngoài các khí tài đã duyệt binh ở Bắc Kinh ngày 1/10/2019; không theo tỉ lệ và chi tiết thật.",
  },
  quiz: {
    owner: "Nguyễn Gia Hưng",
    questions: [
      { q: "Thái Luân dâng giấy lên vua Hán năm nào?", options: ["105", "868", "1044", "1088"], answer: 0, explain: "Năm 105, thời Hán Hòa Đế." },
      {
        q: "Vì sao Thái Luân được gọi là “người cải tiến” giấy?",
        options: ["Ông mua công thức", "Đã có giấy cổ hơn được khảo cổ tìm thấy", "Ông không biết chữ", "Giấy do người Ả Rập làm ra"],
        answer: 1,
        explain: "Giấy Phóng Mã Than, Bá Kiều có từ thời Tây Hán.",
      },
      {
        q: "Kinh Kim Cương năm 868 đặc biệt vì sao?",
        options: ["Là sách chữ rời đầu tiên", "Là sách in có ghi năm cổ nhất còn lại", "Do Gutenberg in", "Viết bằng chữ Nôm"],
        answer: 1,
        explain: "",
      },
      { q: "Chữ in rời của Tất Thăng làm bằng gì?", options: ["Gỗ", "Đồng", "Đất sét nung", "Đá"], answer: 2, explain: "" },
      {
        q: "Thuốc súng ra đời từ hoạt động nào?",
        options: ["Luyện đan tìm thuốc trường sinh", "Làm pháo hoa", "Khai mỏ", "Nấu ăn"],
        answer: 0,
        explain: "",
      },
      {
        q: "Nhân vật Việt Nam nào giúp nhà Minh chế tạo hỏa khí?",
        options: ["Trần Khát Chân", "Lương Như Hộc", "Hồ Nguyên Trừng", "Chế Bồng Nga"],
        answer: 2,
        explain: "",
      },
      {
        q: "Thẩm Quát ghi lại hiện tượng gì của kim chỉ nam?",
        options: ["Kim chỉ đúng hướng bắc", "Kim hơi lệch về phía đông", "Kim quay liên tục", "Kim chỉ hoạt động ban đêm"],
        answer: 1,
        explain: "Đó là độ lệch từ, ghi lại khoảng năm 1088.",
      },
      { q: "Ban đầu la bàn chủ yếu dùng vào việc gì?", options: ["Đi biển", "Phong thủy", "Đánh trận", "Đo thời gian"], answer: 1, explain: "" },
    ],
    ranks: [
      { min: 8, title: "Trạng nguyên", han: "狀元" },
      { min: 6, title: "Bảng nhãn", han: "榜眼" },
      { min: 4, title: "Thám hoa", han: "探花" },
      { min: 0, title: "Học trò chăm chỉ", han: "學" },
    ],
  },
  conclusion: {
    owner: "Đào Quang Anh",
    messages: [
      {
        han: "紙",
        title: "Tri thức cần được giữ lại.",
        text: "Giấy và kỹ thuật in cho thấy một nền văn minh mạnh không chỉ vì biết nhiều, mà vì biết lưu giữ và chia sẻ điều mình biết.",
      },
      {
        han: "火藥",
        title: "Công nghệ không tốt hay xấu tự thân.",
        text: "Thuốc súng sinh ra từ ước mơ trường sinh và trở thành vũ khí. Cách con người sử dụng mới quyết định giá trị của một phát minh.",
      },
      {
        han: "指南",
        title: "Kỹ thuật đi theo nhiều chiều.",
        text: "Từ giấy dó, mộc bản đến Hồ Nguyên Trừng, Việt Nam không chỉ tiếp nhận mà còn góp phần vào dòng chảy văn minh chung.",
      },
    ],
  },
  transparency: {
    intro:
      "Nhóm có dùng AI trong bài này. Dưới đây là AI đã làm những việc gì, con người đã làm gì, và mọi thứ được kiểm tra ra sao.",
    rows: [
      {
        task: "Tìm hiểu nội dung",
        ai: "Gợi ý dàn ý, dịch nghĩa sơ bộ các đoạn Hán văn, gợi ý câu hỏi trắc nghiệm.",
        people: "Nhóm tự viết lại nội dung, đối chiếu từng năm, tên người, trích dẫn với nguồn sơ cấp và sách chuyên khảo.",
      },
      {
        task: "Dựng trang web",
        ai: "Claude Code (Anthropic) viết mã giao diện, mô hình 3D Tử Cấm Thành, rồng vàng, cuốn sách lật và mô hình từng phát minh.",
        people: "Nhóm đặt yêu cầu thiết kế, duyệt từng phần và yêu cầu sửa.",
      },
      {
        task: "Ảnh và âm thanh",
        ai: "AI tìm ảnh tư liệu và bản ghi âm thanh có giấy phép tự do trên Wikimedia Commons, và các mô hình 3D mở (CC BY) trên Sketchfab; ảnh ở bốn góc cuốn sách được tách nền tự động.",
        people: "Không dùng ảnh do AI vẽ. Mỗi ảnh, mỗi bản nhạc đều ghi tác giả và giấy phép ở mục Nguồn tham khảo.",
      },
      {
        task: "Câu đố",
        ai: "Gợi ý câu hỏi, thẻ ghi nhớ và trò chơi dựa trên nội dung các chương.",
        people: "Đáp án chỉ dùng những gì đã có trong bài; nhóm kiểm tra lại trước khi thuyết trình.",
      },
    ],
    rules: [
      "Ở mỗi chương, nhóm ghi lại ít nhất một lỗi AI đã mắc và cách nhóm phát hiện, sửa lỗi đó (mục “Nguồn & phản tư AI”).",
      "Phần nhận xét và thông điệp là quan điểm của nhóm, không phải của AI.",
    ],
  },
  sources: {
    owner: "Trịnh Minh Tuấn",
    primary: [
      "Hàn Phi, *Hàn Phi Tử*, thế kỷ III TCN.",
      "Vương Sung, *Luận hành*, thế kỷ I.",
      "Phạm Diệp, *Hậu Hán thư*, thế kỷ V.",
      "Vương Giới (người cho in), *Kinh Kim Cương*, 868.",
      "Tăng Công Lượng, Đinh Độ, *Vũ kinh tổng yếu*, 1044.",
      "Thẩm Quát, *Mộng Khê bút đàm*, khoảng 1088.",
      "Chu Úc, *Bình Châu khả đàm*, khoảng 1119.",
      "Ngô Sĩ Liên và các sử thần, *Đại Việt sử ký toàn thư*, 1479 (bản khắc 1697). Bản dịch: [NXB, năm].",
      "Tống Ứng Tinh, *Thiên công khai vật*, 1637.",
      "Francis Bacon, *Novum Organum*, 1620.",
    ],
    secondary: [
      "Joseph Needham, *Science and Civilisation in China*, tập 4 phần 1, 1962.",
      "Tsien Tsuen-hsuin, *Paper and Printing*, 1985.",
      "Joseph Needham và cộng sự, *Military Technology: The Gunpowder Epic*, 1986.",
      "Frances Wood, Mark Barnard, *The Diamond Sutra*, 2010.",
      "Vũ Minh Giang (Tổng Chủ biên xuyên suốt), Phạm Hồng Tung (Tổng Chủ biên cấp THPT kiêm Chủ biên) và nhóm tác giả, *Lịch sử 10* (Kết nối tri thức với cuộc sống), tái bản lần thứ ba, NXB Giáo dục Việt Nam, 2026 — Bài 4, mục c), tr. 27–30.",
    ],
    images: "Ảnh tư liệu lấy từ Wikimedia Commons; tác giả và giấy phép của từng ảnh ở danh sách bên dưới. Trang web không dùng ảnh do AI vẽ. Ảnh ở bốn góc cuốn sách được tách nền tự động (công cụ Vision có sẵn trên macOS) hoặc cắt thành mảnh giấy xé. Mô hình 3D Tử Cấm Thành, rồng vàng, cuốn sách và các phát minh được dựng bằng mã Three.js với sự hỗ trợ của Claude Code. Riêng các khí tài quân sự, hẻm núi và Điện Thái Hòa dùng mô hình 3D mở trên Sketchfab, ghi tên tác giả ở danh sách bên dưới.",
    models: [
      { what: "Tiêm kích J-20", title: "Chinese Chengdu J-20", author: "42manako", url: "https://sketchfab.com/3d-models/b9e81062c94545ffb0232d3ac6b7adc5" },
      { what: "Xe tăng Type 99A", title: "ZTZ-99A2", author: "42manako", url: "https://sketchfab.com/3d-models/6d0a293a050347fe81c405b7c0f21e64" },
      { what: "Tên lửa DF-17 và xe phóng", title: "DF-17 Missile", author: "Chenzoss", url: "https://sketchfab.com/3d-models/fd705f99e66d4c3993dbbe7045671ac6" },
      { what: "Tên lửa phòng không HQ-9", title: "Chinese HQ-9", author: "42manako", url: "https://sketchfab.com/3d-models/246c635701c0421ca02e67202a6494e9" },
      { what: "Pháo tự hành PLZ-05", title: "Chinese PLZ-05", author: "42manako", url: "https://sketchfab.com/3d-models/3a9fc646cf0a4e56a574ee54c8f61686" },
      { what: "Hẻm núi", title: "Foreign Canyon - Terrain", author: "artfromheath", url: "https://sketchfab.com/3d-models/6fb8d28d4ad943e2bf2ea5b4f0c1e2c3" },
      { what: "Điện Thái Hòa", title: "太和殿", author: "David_Pang", url: "https://sketchfab.com/3d-models/f39212f1ba0145bf882e742b28d4eaef" },
    ],
    note: "Với sách tiếng Anh, nếu chỉ đọc qua trang web hay bài tóm tắt thì ghi đúng trang đã đọc.",
  },
  closing: { title: "Trung Hoa cổ đại – Nền văn minh của sáng chế", thanks: "Cảm ơn các bạn đã lắng nghe." },
};

export function formatYear(y: number) {
  const r = Math.round(y);
  if (r < 0) return `${-r} TCN`;
  return `${r}`;
}
