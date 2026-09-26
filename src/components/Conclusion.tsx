import { useRef } from "react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Seal } from "./Seal";
import { SectionHeader } from "./SectionHeader";
import { TiltCard } from "./TiltCard";

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
  const root = useRef<HTMLElement>(null);
  useScrollReveal(root);

  return (
    <section id="ket-luan" ref={root} className="relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <SectionHeader
          title="Kết luận & thông điệp"
          subtitle="Phụ trách: Đào Quang Anh"
          ghost="結"
        />

        <div data-reveal-stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {messages.map((m) => (
            <TiltCard key={m.han} className="h-full">
              <div className="paper-card flex h-full flex-col items-start p-6">
                <Seal han={m.han} />
                <h3 className="mt-5 text-xl leading-snug text-balance">{m.title}</h3>
                <p className="mt-3 text-[0.98rem]">{m.text}</p>
              </div>
            </TiltCard>
          ))}
        </div>

        <div data-reveal="up" className="mt-14 border-l-4 border-celadon bg-accent p-6 sm:p-8">
          <h3 className="text-xl">Minh bạch về AI</h3>
          <ul className="mt-3 space-y-2 text-[0.98rem]">
            <li>· Nhóm dùng AI để gợi ý dàn bài, tóm tắt bối cảnh và dịch một số đoạn trích.</li>
            <li>
              · Nhóm không dùng AI để viết thay phần nhận xét và kết luận — đó là quan điểm riêng
              của nhóm.
            </li>
            <li>
              · Mọi số liệu, niên đại và trích dẫn đều được đối chiếu lại với sách và hồ sơ bảo tàng
              nêu ở mục Nguồn tham khảo. Những chỗ AI trả lời sai đã được ghi lại công khai trong
              phần “Phản tư khi dùng AI”.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
