import { Seal } from "./Seal";
import { Chapter } from "./layout/Chapter";
const messages = [
  {
    han: "本",
    title: "Phát minh lớn thường bắt đầu từ nhu cầu rất đời thường",
    text: "Giấy ra đời vì thẻ tre quá nặng, la bàn khởi nguồn từ bói toán, thuốc súng đến từ việc luyện đan. Không có phát minh nào sinh ra từ hư không.",
  },
  {
    han: "傳",
    title: "Giá trị của một kỹ thuật nằm ở sức lan tỏa",
    text: "Cả bốn phát minh chỉ thực sự đổi thay thế giới khi vượt khỏi biên giới, qua con đường tơ lụa, qua thế giới Ả Rập, rồi tới châu Âu và Việt Nam.",
  },
  {
    han: "思",
    title: "Tri thức cần được kiểm chứng, hôm qua và hôm nay",
    text: "Sử liệu phải đối chiếu nhiều nguồn; câu trả lời của AI cũng vậy. Nhóm coi việc tra ngược lại nguồn gốc là phần quan trọng nhất của bài này.",
  },
];

export function Conclusion() {
  return (
    <Chapter id="ket-luan" title="Kết luận & thông điệp" owner="Đào Quang Anh">
      <ol data-reveal-stagger className="grid-12 mt-block">
        {messages.map((m, i) => (
          <li
            key={m.han}
            className="surface-raised col-span-12 flex flex-col items-start p-s6 md:col-span-4"
          >
            <div className="flex w-full items-center justify-between">
              <Seal han={m.han} />
              <span aria-hidden className="font-display text-h2 text-foreground/15 tabular-nums">
                {i + 1}
              </span>
            </div>
            <h3 className="mt-s5 text-h3">{m.title}</h3>
            <p className="mt-s3 text-small">{m.text}</p>
          </li>
        ))}
      </ol>

      <aside data-reveal className="mt-block rounded-lg border-l-4 border-celadon bg-accent p-s6">
        <h3 className="text-h3">Minh bạch về AI</h3>
        <ul className="mt-s3 space-y-s2">
          <li>· Nhóm dùng AI để gợi ý dàn bài, tóm tắt bối cảnh và dịch một số đoạn trích.</li>
          <li>
            · Nhóm không dùng AI để viết thay phần nhận xét và kết luận — đó là quan điểm riêng của
            nhóm.
          </li>
          <li>
            · Mọi số liệu, niên đại và trích dẫn đều được đối chiếu lại với sách và hồ sơ bảo tàng
            nêu ở mục Nguồn tham khảo. Những chỗ AI trả lời sai đã được ghi lại công khai trong phần
            “Phản tư khi dùng AI”.
          </li>
        </ul>
      </aside>
    </Chapter>
  );
}
