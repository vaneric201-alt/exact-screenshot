/*
 * Study material for the quiz modes (flashcards, multiple choice, match,
 * timeline). Every fact here is taken from content.ts / docs/content.md —
 * nothing new is added; the questions only re-ask what the chapters say.
 */

export interface Card {
  term: string;
  def: string;
  /** Image in public/img, shown on the term side. */
  img?: string;
  chapter: "giay" | "in" | "thuocsung" | "laban";
}

export const cards: Card[] = [
  { chapter: "giay", term: "Thái Luân", def: "Hoạn quan nhà Hán, năm 105 cải tiến cách làm giấy và dâng lên vua Hán Hòa Đế.", img: "forward-caolun" },
  { chapter: "giay", term: "Giấy thời Tây Hán", def: "Mảnh giấy thô thế kỷ II TCN do khảo cổ tìm thấy — có trước Thái Luân.", img: "forward-xihan" },
  { chapter: "giay", term: "Hậu Hán thư", def: "Sách của Phạm Diệp (thế kỷ V) chép chuyện Thái Luân, viết khoảng 300 năm sau ông.", img: "why-paper" },
  { chapter: "giay", term: "Làng Yên Thái (Kẻ Bưởi)", def: "Làng giấy dó ở Hà Nội, làm giấy cho sắc phong và sách vở." },
  { chapter: "in", term: "Kinh Kim Cương (868)", def: "Bản in có ghi năm sớm nhất còn lại; tìm thấy ở Đôn Hoàng, nay ở Thư viện Anh.", img: "print-wood-6" },
  { chapter: "in", term: "Tất Thăng", def: "Người “áo vải” (dân thường) sáng chế chữ in rời bằng đất sét nung, khoảng 1041–1048.", img: "print-type-1" },
  { chapter: "in", term: "Vương Trinh", def: "Thời Nguyên, cho khắc hơn 6 vạn chữ gỗ, chọn chữ bằng bàn xoay (Nông thư, 1313).", img: "print-after-1" },
  { chapter: "in", term: "Lương Như Hộc", def: "Thám hoa thế kỷ XV, được xem là ông tổ nghề khắc in Việt Nam." },
  { chapter: "thuocsung", term: "Thuật luyện đan", def: "Đạo sĩ nung khoáng chất tìm thuốc trường sinh — và vô tình tạo ra thuốc súng.", img: "powder-1" },
  { chapter: "thuocsung", term: "Vũ kinh tổng yếu (1044)", def: "Binh thư nhà Tống ghi công thức thuốc súng cổ nhất còn lại trên thế giới.", img: "powder-3" },
  { chapter: "thuocsung", term: "Hỏa thương", def: "Ống tre nhồi thuốc, phun lửa ở đầu giáo — tổ tiên của súng.", img: "powder-6" },
  { chapter: "thuocsung", term: "Hồ Nguyên Trừng", def: "Bị nhà Minh bắt, được giao chế tạo hỏa khí; kỹ thuật đi ngược từ Đại Việt về Trung Hoa." },
  { chapter: "laban", term: "Tư nam", def: "Dụng cụ chỉ hướng bằng đá nam châm, thường hình dung là chiếc thìa trên mặt đồng (còn tranh luận).", img: "compass-2" },
  { chapter: "laban", term: "Cá chỉ nam", def: "Miếng sắt hình cá thả trên bát nước, được mô tả trong Vũ kinh tổng yếu (1044).", img: "compass-3" },
  { chapter: "laban", term: "Thẩm Quát", def: "Khoảng 1088 ghi lại kim chỉ nam hơi lệch về phía đông — độ lệch từ.", img: "compass-4" },
  { chapter: "laban", term: "Chu Úc", def: "Bình Châu khả đàm (khoảng 1119) ghi thủy thủ dùng kim chỉ nam trên biển.", img: "compass-6" },
];

export interface Question {
  q: string;
  img?: string;
  options: string[];
  answer: number;
  explain: string;
}

export const questions: Question[] = [
  {
    q: "Năm 105, ai dâng giấy lên vua Hán Hòa Đế?",
    img: "forward-caolun",
    options: ["Tất Thăng", "Thái Luân", "Thẩm Quát", "Vương Trinh"],
    answer: 1,
    explain: "Thái Luân cải tiến cách làm giấy từ vỏ cây, đầu sợi gai, vải rách và lưới đánh cá cũ.",
  },
  {
    q: "Vì sao Thái Luân được xem là người “cải tiến” chứ không phải người đầu tiên làm ra giấy?",
    img: "forward-xihan",
    options: ["Ông mua công thức của người khác", "Khảo cổ đã tìm thấy giấy thô thời Tây Hán", "Ông không biết chữ", "Giấy do người Ả Rập làm ra"],
    answer: 1,
    explain: "Những mảnh giấy thô thế kỷ II TCN có trước Thái Luân khoảng ba trăm năm.",
  },
  {
    q: "Trước khi có giấy, vì sao thẻ tre và lụa đều bất tiện?",
    img: "why-paper",
    options: ["Thẻ tre nặng, lụa đắt", "Thẻ tre đắt, lụa nặng", "Cả hai đều không viết được", "Vua cấm dùng"],
    answer: 0,
    explain: "“Lụa thì đắt, thẻ tre thì nặng, đều bất tiện cho người dùng” — Hậu Hán thư.",
  },
  {
    q: "Bản in này năm 868 đặc biệt vì sao?",
    img: "print-wood-6",
    options: ["Là sách chữ rời đầu tiên", "Là bản in có ghi năm sớm nhất còn lại", "Do Gutenberg in", "Viết bằng chữ Nôm"],
    answer: 1,
    explain: "Kinh Kim Cương tìm thấy ở hang Mạc Cao, Đôn Hoàng năm 1907, nay ở Thư viện Anh.",
  },
  {
    q: "Chữ in rời của Tất Thăng làm bằng gì?",
    img: "print-type-1",
    options: ["Gỗ", "Đồng", "Đất sét nung", "Đá"],
    answer: 2,
    explain: "“Lấy đất sét khắc chữ… đem nung lửa cho cứng” — Mộng Khê bút đàm.",
  },
  {
    q: "Mộng Khê bút đàm gọi Tất Thăng là người “áo vải”. Điều đó cho biết gì?",
    img: "print-type-7",
    options: ["Ông là thợ may", "Ông là dân thường", "Ông là hoàng tử", "Ông là nhà sư"],
    answer: 1,
    explain: "Một phát minh lớn đến từ người lao động, nhưng chỉ được biết nhờ một vị quan ghi lại.",
  },
  {
    q: "Thuốc súng ra đời từ hoạt động nào?",
    img: "powder-1",
    options: ["Luyện đan tìm thuốc trường sinh", "Làm pháo hoa", "Khai mỏ", "Nấu ăn"],
    answer: 0,
    explain: "Các đạo sĩ thời Đường nung trộn diêm tiêu, lưu huỳnh để tìm “tiên đan”.",
  },
  {
    q: "Công thức thuốc súng cổ nhất còn lại nằm trong sách nào?",
    img: "powder-3",
    options: ["Thiên công khai vật", "Vũ kinh tổng yếu", "Hậu Hán thư", "Luận hành"],
    answer: 1,
    explain: "Bộ binh thư năm 1044 của Tăng Công Lượng và Đinh Độ.",
  },
  {
    q: "Nhân vật Việt Nam nào giúp nhà Minh chế tạo hỏa khí?",
    options: ["Trần Khát Chân", "Lương Như Hộc", "Hồ Nguyên Trừng", "Chế Bồng Nga"],
    answer: 2,
    explain: "Kỹ thuật không đi một chiều: Đại Việt cũng đóng góp ngược lại.",
  },
  {
    q: "Thẩm Quát ghi lại hiện tượng gì của kim chỉ nam?",
    img: "compass-4",
    options: ["Kim chỉ đúng hướng bắc", "Kim hơi lệch về phía đông", "Kim quay liên tục", "Kim chỉ hoạt động ban đêm"],
    answer: 1,
    explain: "Đó là độ lệch từ, ghi lại khoảng năm 1088 — sớm hơn châu Âu vài trăm năm.",
  },
  {
    q: "Thẩm Quát thử bốn cách đặt kim. Ông cho rằng cách nào tốt nhất?",
    img: "compass-5",
    options: ["Thả nổi trên nước", "Đặt trên móng tay", "Đặt trên miệng bát", "Treo bằng sợi tơ"],
    answer: 3,
    explain: "Treo bằng sợi tơ để kim quay tự do nhất.",
  },
  {
    q: "Ban đầu dụng cụ chỉ hướng chủ yếu dùng vào việc gì?",
    img: "compass-7",
    options: ["Đi biển", "Phong thủy", "Đánh trận", "Đo thời gian"],
    answer: 1,
    explain: "Chọn hướng nhà, hướng mộ, hướng cung điện — rồi mới dùng để đi biển.",
  },
];

/** Events to put in order on the timeline game. */
export const timeline: { label: string; year: number; shown: string }[] = [
  { label: "Giấy thô thời Tây Hán", year: -150, shown: "Thế kỷ II TCN" },
  { label: "Thái Luân dâng giấy lên vua Hán", year: 105, shown: "105" },
  { label: "Kinh Kim Cương được in", year: 868, shown: "868" },
  { label: "Vũ kinh tổng yếu ghi công thức thuốc súng", year: 1044, shown: "1044" },
  { label: "Thẩm Quát ghi lại độ lệch từ", year: 1088, shown: "khoảng 1088" },
  { label: "Chu Úc chép về la bàn trên biển", year: 1119, shown: "khoảng 1119" },
];
