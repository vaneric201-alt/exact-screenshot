import giay from "@/assets/giay.jpg";
import laban from "@/assets/laban.jpg";
import thuocsung from "@/assets/thuocsung.jpg";
import inan from "@/assets/in.jpg";

export type Invention = {
  id: string;
  han: string;
  name: string;
  owner: string;
  tagline: string;
  image: string;
  imageCaption: string;
  intro: string[];
  impact: { china: string; world: string; vietnam: string };
  groupNote: string;
  primary: { quote: string; source: string; reading: string };
  secondary: string[];
  ai: {
    prompt1: string;
    answer1: string;
    wrong: string;
    prompt2: string;
    answer2: string;
    verified: string;
  };
  askTeacher: { front: string; back: string };
  askClass: { front: string; back: string; hint: string };
};

export const inventions: Invention[] = [
  {
    id: "giay",
    han: "紙",
    name: "Kỹ thuật làm giấy",
    owner: "Nguyễn Anh Dũng",
    tagline: "Vật liệu rẻ tiền đã thay đổi cách loài người lưu giữ trí nhớ",
    image: giay,
    imageCaption: "Cảnh seo giấy bằng khuôn tre (hình minh họa do nhóm dựng lại)",
    intro: [
      "Trước khi có giấy, người Trung Hoa viết trên thẻ tre, lụa và mai rùa — thứ thì nặng, thứ thì quá đắt.",
      "Năm 105, Thái Luân (Cai Lun) hoàn thiện công thức làm giấy từ vỏ cây dâu, sợi gai, lưới cá và giẻ rách.",
      "Quy trình gồm bốn bước: ngâm – giã thành bột – seo bằng khuôn tre – ép và phơi khô.",
      "Giấy nhẹ, rẻ, dễ nhân bản, nên sách vở và văn bản hành chính lan rộng rất nhanh.",
      "Kỹ thuật truyền sang Triều Tiên, Nhật Bản, rồi tới Samarkand năm 751 và vào châu Âu qua thế giới Ả Rập.",
    ],
    impact: {
      china:
        "Bộ máy quan lại và chế độ khoa cử vận hành được nhờ văn bản rẻ; tri thức thoát khỏi tay tầng lớp quý tộc.",
      world:
        "Giấy là điều kiện cần cho máy in Gutenberg; không có giấy rẻ thì in hàng loạt cũng vô nghĩa.",
      vietnam:
        "Nghề giấy dó ở Yên Thái – Bưởi (Thăng Long) tiếp thu kỹ thuật này rồi phát triển theo hướng riêng, phục vụ sắc phong, tranh Đông Hồ.",
    },
    groupNote:
      "Nhóm cho rằng giấy là phát minh 'nền': ba phát minh còn lại đều cần giấy để được ghi chép và truyền lại. Một kỹ thuật càng rẻ thì sức lan tỏa càng lớn.",
    primary: {
      quote:
        "Thái Luân bèn nghĩ ra cách dùng vỏ cây, sợi gai, vải rách và lưới cá cũ để làm giấy… Thiên hạ đều dùng, gọi là 'giấy Thái hầu'.",
      source: "Phạm Diệp, Hậu Hán thư – Hoạn giả liệt truyện, thế kỷ V",
      reading:
        "Diễn giải: đoạn này cho thấy đóng góp của Thái Luân không phải là 'phát minh ra giấy' từ con số không, mà là chuẩn hóa nguyên liệu rẻ để giấy dùng được đại trà.",
    },
    secondary: [
      "Joseph Needham, Science and Civilisation in China, tập V, 1985.",
      "Tsien Tsuen-Hsuin, Paper and Printing, Cambridge University Press, 1985.",
      "Bảo tàng Anh (British Museum), hồ sơ hiện vật giấy Đôn Hoàng.",
    ],
    ai: {
      prompt1: "Ai là người phát minh ra giấy?",
      answer1: "Thái Luân phát minh ra giấy vào năm 105 sau Công nguyên.",
      wrong: "phát minh ra giấy",
      prompt2: "Có bằng chứng khảo cổ nào về giấy trước năm 105 không? Hãy nêu nguồn.",
      answer2:
        "Có. Giấy Phóng Ma Than (Gansu) niên đại khoảng thế kỷ II TCN cho thấy giấy đã tồn tại trước Thái Luân; ông là người cải tiến và chuẩn hóa quy trình.",
      verified: "Đã đối chiếu với Hậu Hán thư và Needham (1985).",
    },
    askTeacher: {
      front: "Hỏi thầy cô",
      back: "Thưa cô, nếu giấy đã có trước năm 105, vì sao sử sách vẫn ghi công Thái Luân? Tiêu chí nào để gọi một người là 'người phát minh'?",
    },
    askClass: {
      front: "Hỏi các nhóm",
      back: "Theo các bạn, vì sao nghề giấy dó Việt Nam không phát triển thành in hàng loạt như ở Trung Hoa?",
      hint: "Gợi ý: nghĩ tới quy mô thị trường, nhu cầu hành chính và chi phí khắc ván.",
    },
  },
  {
    id: "laban",
    han: "指南",
    name: "La bàn",
    owner: "Trần Minh Tuấn",
    tagline: "Từ dụng cụ bói toán trở thành chiếc kim dẫn đường ra đại dương",
    image: laban,
    imageCaption: "Thìa chỉ nam trên địa bàn và kim nổi trên nước (hình minh họa)",
    intro: [
      "Thời Hán đã có 'tư nam' — chiếc thìa bằng đá nam châm quay trên mâm đồng, dùng cho phong thủy chứ chưa để đi biển.",
      "Đến thời Tống, người ta biết mài kim sắt vào đá nam châm để nhiễm từ.",
      "Thẩm Quát mô tả bốn cách treo kim và ghi nhận hiện tượng kim lệch khỏi hướng nam thật (độ từ thiên).",
      "Chu Úc ghi lại việc thủy thủ dùng kim chỉ nam khi trời tối, không nhìn được sao.",
      "Từ đây tàu buôn có thể đi biển quanh năm, không phụ thuộc thời tiết quang đãng.",
    ],
    impact: {
      china:
        "Thương mại đường biển thời Tống – Nguyên bùng nổ; hạm đội Trịnh Hòa thế kỷ XV đi tới tận Đông Phi.",
      world:
        "La bàn truyền sang Ả Rập rồi châu Âu, trở thành công cụ then chốt của thời đại Phát kiến địa lý.",
      vietnam:
        "Thuyền buôn và thuyền đánh cá Đại Việt sử dụng kim chỉ nam trong tuyến đi Hoàng Sa; 'Đội Hoàng Sa' thời chúa Nguyễn hoạt động dựa trên kỹ thuật đi biển này.",
    },
    groupNote:
      "Nhóm chú ý một điểm thú vị: la bàn ra đời từ mục đích bói toán, rồi mới được dùng cho hàng hải. Nhiều phát minh đổi công dụng so với ý định ban đầu.",
    primary: {
      quote:
        "Thuật sĩ lấy kim mài vào đá nam châm thì mũi kim chỉ về nam, nhưng thường hơi lệch về phía đông, không đúng chính nam.",
      source: "Thẩm Quát, Mộng Khê bút đàm, khoảng 1088",
      reading:
        "Diễn giải: câu này là ghi chép sớm nhất thế giới về độ từ thiên — chứng tỏ người Tống quan sát rất kỹ chứ không chỉ dùng theo thói quen.",
    },
    secondary: [
      "Chu Úc, Bình Châu khả đàm, 1119 (ghi chép việc dùng kim chỉ nam đi biển).",
      "Joseph Needham, Science and Civilisation in China, tập IV.1.",
      "Bảo tàng Hàng hải Trung Quốc, hồ sơ la bàn thời Tống.",
    ],
    ai: {
      prompt1: "La bàn được phát minh để làm gì?",
      answer1: "La bàn được người Trung Quốc phát minh để đi biển từ thời nhà Hán.",
      wrong: "để đi biển từ thời nhà Hán",
      prompt2: "Thời Hán dùng 'tư nam' vào việc gì? Khi nào la bàn mới dùng cho hàng hải?",
      answer2:
        "Thời Hán, tư nam dùng cho phong thủy và bói toán. Phải tới thời Tống (thế kỷ XI–XII) kim chỉ nam mới được ghi nhận dùng trong hàng hải.",
      verified: "Đã đối chiếu với Mộng Khê bút đàm (1088) và Bình Châu khả đàm (1119).",
    },
    askTeacher: {
      front: "Hỏi thầy cô",
      back: "Thưa cô, vì sao Trung Hoa có la bàn sớm và hạm đội mạnh nhưng lại không mở ra thời đại thuộc địa như châu Âu?",
    },
    askClass: {
      front: "Hỏi các nhóm",
      back: "Nếu không có la bàn, theo các bạn con đường tơ lụa trên biển sẽ thay đổi thế nào?",
      hint: "Gợi ý: nghĩ tới việc đi men bờ, phụ thuộc gió mùa và số chuyến mỗi năm.",
    },
  },
  {
    id: "thuocsung",
    han: "火藥",
    name: "Thuốc súng",
    owner: "Lê Gia Hưng",
    tagline: "Thứ 'thuốc trường sinh' hỏng bét lại làm thay đổi chiến tranh",
    image: thuocsung,
    imageCaption: "Hỏa thương và tên lửa tre thời Tống (hình minh họa)",
    intro: [
      "Các đạo sĩ luyện đan tìm thuốc trường sinh đã vô tình phát hiện hỗn hợp diêm tiêu – lưu huỳnh – than cháy rất mạnh.",
      "Công thức thuốc súng sớm nhất được chép trong Vũ kinh tổng yếu năm 1044.",
      "Thời Tống xuất hiện hỏa thương, chấn thiên lôi, tên lửa tre dùng trong chiến tranh chống Kim và Mông Cổ.",
      "Đến thời Nguyên – Minh có súng thần công bằng đồng, đánh dấu chuyển sang vũ khí nòng kim loại.",
      "Kỹ thuật lan sang thế giới Hồi giáo rồi châu Âu vào thế kỷ XIII–XIV.",
    ],
    impact: {
      china:
        "Chiến tranh chuyển từ kỵ binh – cung tên sang hỏa khí; thành lũy phải xây dày hơn, thấp hơn.",
      world:
        "Ở châu Âu, đại bác góp phần chấm dứt thời kỳ lâu đài phong kiến và thúc đẩy nhà nước tập quyền.",
      vietnam:
        "Hồ Nguyên Trừng nổi tiếng với 'thần cơ sang pháo'; sau khi bị bắt sang Minh, ông được giao phụ trách chế tạo hỏa khí — một chi tiết cho thấy trao đổi kỹ thuật hai chiều.",
    },
    groupNote:
      "Nhóm thấy đây là phát minh có mặt tối rõ nhất. Bàn về thuốc súng nên nói cả hai chiều: nó thúc đẩy hóa học, khai mỏ, nhưng cũng làm chiến tranh tàn khốc hơn.",
    primary: {
      quote:
        "Phép chế hỏa dược: diêm tiêu, lưu hoàng, than… trộn đều, giã nhỏ, gói trong giấy làm cầu mà bắn đi.",
      source: "Tăng Công Lượng – Đinh Độ, Vũ kinh tổng yếu, 1044",
      reading:
        "Diễn giải: đây là công thức thuốc súng thành văn sớm nhất còn lại, chứng tỏ tới giữa thế kỷ XI nhà Tống đã sản xuất hỏa khí có tổ chức, do triều đình biên soạn thành sách quân sự.",
    },
    secondary: [
      "Joseph Needham, Science and Civilisation in China, tập V.7: The Gunpowder Epic.",
      "Tonio Andrade, The Gunpowder Age, Princeton University Press, 2016.",
      "Đại Việt sử ký toàn thư (ghi chép về hỏa khí thời Hồ).",
    ],
    ai: {
      prompt1: "Thuốc súng ra đời như thế nào?",
      answer1:
        "Thuốc súng được quân đội nhà Đường chế tạo nhằm mục đích làm vũ khí chống quân xâm lược.",
      wrong: "quân đội nhà Đường chế tạo nhằm mục đích làm vũ khí",
      prompt2: "Ai thực sự tìm ra hỗn hợp này, và công thức thành văn sớm nhất nằm trong sách nào?",
      answer2:
        "Các đạo sĩ luyện đan phát hiện ra hỗn hợp khi tìm thuốc trường sinh; công thức thành văn sớm nhất nằm trong Vũ kinh tổng yếu (1044) thời Tống.",
      verified: "Đã đối chiếu với Vũ kinh tổng yếu và Needham tập V.7.",
    },
    askTeacher: {
      front: "Hỏi thầy cô",
      back: "Thưa cô, có nên coi thuốc súng là một 'thành tựu văn minh' không, khi hệ quả lớn nhất của nó là chiến tranh?",
    },
    askClass: {
      front: "Hỏi các nhóm",
      back: "Các bạn hãy kể một phát minh hiện đại cũng có hai mặt như thuốc súng, và giải thích.",
      hint: "Gợi ý: năng lượng hạt nhân, mạng xã hội, trí tuệ nhân tạo.",
    },
  },
  {
    id: "in",
    han: "印",
    name: "Kỹ thuật in",
    owner: "Đào Quang Anh",
    tagline: "Từ con dấu nhỏ đến bản in hàng vạn tờ",
    image: inan,
    imageCaption: "Khắc ván in và chữ rời của Tất Thăng (hình minh họa)",
    intro: [
      "Gốc rễ của in là con dấu và kỹ thuật rập bia đá đã có từ lâu.",
      "In khắc ván (mộc bản) phát triển mạnh thời Đường; mỗi trang được khắc ngược trên một tấm gỗ.",
      "Kinh Kim Cương năm 868 tìm thấy ở Đôn Hoàng là ấn phẩm in có ghi niên đại sớm nhất thế giới còn lại.",
      "Khoảng 1040, Tất Thăng làm chữ rời bằng đất sét nung, xếp trên khay sắt có sáp — nguyên lý của in chữ rời.",
      "Chữ Hán quá nhiều ký tự nên mộc bản vẫn tiện hơn; chữ rời phát triển mạnh hơn ở Triều Tiên (chữ rời kim loại, thế kỷ XIII).",
    ],
    impact: {
      china:
        "Sách khoa cử, lịch, sách thuốc được in hàng loạt; tỉ lệ người biết chữ thời Tống tăng rõ rệt.",
      world:
        "Ý tưởng in hàng loạt đến châu Âu và gặp máy in Gutenberg (khoảng 1450), tạo ra cuộc bùng nổ tri thức.",
      vietnam:
        "Lương Nhữ Học được xem là ông tổ nghề in mộc bản Việt Nam; mộc bản triều Nguyễn nay là Di sản tư liệu thế giới của UNESCO.",
    },
    groupNote:
      "Nhóm rút ra: một kỹ thuật chỉ lan rộng khi hợp với hệ chữ viết và nhu cầu xã hội. Chữ rời hợp với bảng chữ cái hơn là với hàng vạn chữ Hán.",
    primary: {
      quote:
        "Tất Thăng lấy đất sét dẻo khắc chữ, mỏng như đồng tiền, mỗi chữ một con, đem nung cho cứng… in vài ba bản thì chưa lợi, in vài trăm nghìn bản thì nhanh lạ thường.",
      source: "Thẩm Quát, Mộng Khê bút đàm, khoảng 1088",
      reading:
        "Diễn giải: Thẩm Quát không chỉ tả kỹ thuật mà còn nêu điều kiện kinh tế của nó — chữ rời chỉ lợi khi in số lượng rất lớn.",
    },
    secondary: [
      "Tsien Tsuen-Hsuin, Paper and Printing, 1985.",
      "British Library, hồ sơ Kinh Kim Cương Đôn Hoàng (Or.8210/P.2).",
      "UNESCO, hồ sơ Mộc bản triều Nguyễn, 2009.",
    ],
    ai: {
      prompt1: "Ai phát minh ra kỹ thuật in?",
      answer1: "Gutenberg phát minh ra kỹ thuật in vào thế kỷ XV tại Đức.",
      wrong: "Gutenberg phát minh ra kỹ thuật in",
      prompt2: "Trước Gutenberg, Trung Hoa đã in như thế nào? Nêu mốc thời gian và nguồn.",
      answer2:
        "Trung Hoa đã in khắc ván từ thời Đường (Kinh Kim Cương, 868) và có chữ rời đất nung của Tất Thăng khoảng 1040. Gutenberg cải tiến với chữ rời kim loại và máy ép vào khoảng 1450.",
      verified: "Đã đối chiếu với Mộng Khê bút đàm và hồ sơ British Library.",
    },
    askTeacher: {
      front: "Hỏi thầy cô",
      back: "Thưa cô, vì sao in chữ rời ra đời ở Trung Hoa trước nhưng lại tạo ra 'cách mạng thông tin' ở châu Âu?",
    },
    askClass: {
      front: "Hỏi các nhóm",
      back: "Theo các bạn, internet hôm nay có vai trò giống kỹ thuật in ngày xưa ở điểm nào?",
      hint: "Gợi ý: chi phí nhân bản một bản sao gần bằng 0 và ai là người kiểm soát nội dung.",
    },
  },
];
