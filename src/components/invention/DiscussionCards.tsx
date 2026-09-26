import type { Invention } from "@/data/inventions";
import { FlipCard } from "../FlipCard";

/** Two flip cards: a question for the teacher and one for the class (with hint). */
export function DiscussionCards({
  askTeacher,
  askClass,
}: Pick<Invention, "askTeacher" | "askClass">) {
  return (
    <div data-reveal-stagger className="grid-12">
      <div className="col-span-12 md:col-span-6">
        <FlipCard front={askTeacher.front} back={askTeacher.back} />
      </div>
      <div className="col-span-12 md:col-span-6">
        <FlipCard front={askClass.front} back={askClass.back} hint={askClass.hint} />
      </div>
    </div>
  );
}
