import { Seal } from "./Seal";

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
    <section id="ket-luan" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl sm:text-[2.5rem]">Kết luận & thông điệp</h2>
        <p className="mt-1 text-sm text-muted-foreground">Phụ trách: Đào Quang Anh</p>
        <div className="rule-brush mt-6" />

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {messages.map((m) => (
            <div key={m.han} className="flex flex-col items-start">
              <Seal han={m.han} />
              <h3 className="mt-4 text-lg">{m.title}</h3>
              <p className="mt-2 text-[0.98rem]">{m.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-l-4 border-celadon bg-accent p-6">
          <h3 className="text-xl">Minh bạch về AI</h3>
          <ul className="mt-3 space-y-2 text-[0.98rem]">
            <li>· Nhóm dùng AI để gợi ý dàn bài, tóm tắt bối cảnh và dịch một số đoạn trích.</li>
            <li>· Nhóm không dùng AI để viết thay phần nhận xét và kết luận — đó là quan điểm riêng của nhóm.</li>
            <li>
              · Mọi số liệu, niên đại và trích dẫn đều được đối chiếu lại với sách và hồ sơ bảo tàng nêu ở mục
              Nguồn tham khảo. Những chỗ AI trả lời sai đã được ghi lại công khai trong phần “Phản tư khi dùng AI”.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
