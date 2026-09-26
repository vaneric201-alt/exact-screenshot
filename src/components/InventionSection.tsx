import type { Invention } from "@/data/inventions";
import { chapterById } from "@/data/chapters";
import { Chapter, Step } from "./layout/Chapter";
import { ContextBlock } from "./invention/ContextBlock";
import { HowItWorks } from "./invention/HowItWorks";
import { ImpactGrid } from "./invention/ImpactGrid";
import { PrimarySource, SecondarySources } from "./invention/SourceBlocks";
import { AiFactCheck } from "./invention/AiFactCheck";
import { DiscussionCards } from "./invention/DiscussionCards";

/**
 * One template for all four inventions, always in this order:
 * header → image + context → how it works → impact → primary source →
 * secondary sources → AI fact-check → discussion cards.
 */
export function InventionSection({ data }: { data: Invention }) {
  const { num } = chapterById(data.id);
  const [context = "", ...steps] = data.intro;

  return (
    <Chapter
      id={data.id}
      title={data.name}
      owner={data.owner}
      tagline={data.tagline}
      tone={num % 2 === 0 ? "deep" : "plain"}
    >
      <Step chapter={num} n={1} title="Giới thiệu">
        <ContextBlock
          image={data.image}
          alt={data.name}
          caption={data.imageCaption}
          context={context}
        />
      </Step>

      <Step chapter={num} n={2} title="Diễn tiến & cách hoạt động">
        <HowItWorks steps={steps} />
      </Step>

      <Step chapter={num} n={3} title="Ý nghĩa & ảnh hưởng">
        <ImpactGrid impact={data.impact} note={data.groupNote} />
      </Step>

      <div className="grid-12">
        <Step chapter={num} n={4} title="Nguồn sơ cấp" className="col-span-12 lg:col-span-7">
          <PrimarySource primary={data.primary} />
        </Step>
        <Step chapter={num} n={5} title="Nguồn thứ cấp" className="col-span-12 lg:col-span-5">
          <SecondarySources items={data.secondary} />
        </Step>
      </div>

      <Step chapter={num} n={6} title="Phản tư khi dùng AI">
        <AiFactCheck ai={data.ai} />
      </Step>

      <Step chapter={num} n={7} title="Câu hỏi tương tác">
        <DiscussionCards askTeacher={data.askTeacher} askClass={data.askClass} />
      </Step>
    </Chapter>
  );
}
