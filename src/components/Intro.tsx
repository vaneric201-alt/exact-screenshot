import { Chapter, Step } from "./layout/Chapter";
import { Timeline } from "./Timeline";

export function Intro() {
  return (
    <Chapter id="mo-dau" owner="Nguyễn Anh Dũng">
      <div className="grid-12 mt-block items-center">
        <div data-reveal-stagger className="col-span-12 space-y-s4 text-lead md:col-span-7">
          <p>
            Trong hơn một nghìn năm, Trung Hoa là một trong những trung tâm kỹ thuật lớn nhất thế
            giới. Bốn phát minh thường được nhắc tới nhiều nhất là <strong>giấy</strong>,{" "}
            <strong>la bàn</strong>, <strong>thuốc súng</strong> và <strong>kỹ thuật in</strong>.
          </p>
          <p>
            Điều đáng chú ý không nằm ở việc ai làm ra trước, mà ở chỗ cả bốn đều là những công cụ
            nền: chúng thay đổi cách con người ghi nhớ, đi lại, chiến đấu và truyền bá tri thức.
          </p>
          <p>
            Bài của nhóm đi theo bốn phần đều nhau, mỗi phần gồm giới thiệu, ý nghĩa, nguồn tư liệu
            kèm phần phản tư khi dùng AI, và một câu hỏi tương tác.
          </p>
        </div>

        <figure
          data-reveal
          className="surface-raised relative col-span-12 overflow-hidden p-s6 md:col-span-5"
        >
          <span aria-hidden className="han absolute right-s4 top-s2 text-[4rem] text-foreground/10">
            言
          </span>
          <blockquote className="relative font-display text-h3 font-normal italic">
            “Ba phát minh này đã làm thay đổi bộ mặt và tình trạng của toàn thế giới: thứ nhất là
            nghề in, thứ hai là thuốc súng, thứ ba là la bàn.”
          </blockquote>
          <figcaption className="mt-s4 text-small text-muted-foreground">
            — Francis Bacon, <em>Novum Organum</em>, 1620
          </figcaption>
        </figure>
      </div>

      <Step chapter={0} n={1} title="Dòng thời gian">
        <Timeline />
      </Step>
    </Chapter>
  );
}
