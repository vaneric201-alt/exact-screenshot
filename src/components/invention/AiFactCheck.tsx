import type { ReactNode } from "react";
import type { Invention } from "@/data/inventions";

/** AI reflection: first prompt with the wrong part highlighted, the corrective prompt, then verification. */
export function AiFactCheck({ ai }: { ai: Invention["ai"] }) {
  return (
    <div data-reveal className="surface overflow-hidden">
      <div className="grid md:grid-cols-2">
        <Round
          step="Lần 1"
          status="Có chỗ sai"
          tone="wrong"
          prompt={ai.prompt1}
          answerLabel="AI trả lời"
          answer={<Highlighted text={ai.answer1} wrong={ai.wrong} />}
        />
        <Round
          step="Lần 2"
          status="Đã sửa"
          tone="right"
          prompt={ai.prompt2}
          answerLabel="AI trả lời (đã sửa)"
          answer={ai.answer2}
        />
      </div>
      <p className="flex items-start gap-s2 border-t border-border bg-accent px-s5 py-s4 text-small text-accent-foreground">
        <span aria-hidden className="font-bold">
          ✓
        </span>
        <span>
          <span className="sr-only">Kiểm chứng: </span>
          {ai.verified}
        </span>
      </p>
    </div>
  );
}

function Round({
  step,
  status,
  tone,
  prompt,
  answerLabel,
  answer,
}: {
  step: string;
  status: string;
  tone: "wrong" | "right";
  prompt: string;
  answerLabel: string;
  answer: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-s3 p-s5 [&+&]:border-t [&+&]:border-border md:[&+&]:border-l md:[&+&]:border-t-0">
      <p className="flex items-center justify-between gap-s3">
        <span className="kicker text-muted-foreground">{step}</span>
        <span
          className={`rounded-sm px-s2 py-s1 text-caption font-semibold ${
            tone === "wrong" ? "bg-primary/10 text-primary" : "bg-bronze/10 text-bronze"
          }`}
        >
          {status}
        </span>
      </p>
      <div className="rounded-md bg-secondary p-s3">
        <p className="text-caption uppercase tracking-widest text-muted-foreground">
          {step === "Lần 1" ? "Câu lệnh 1" : "Câu lệnh 2"}
        </p>
        <p className="mt-s1 text-small">{prompt}</p>
      </div>
      <div
        className={`rounded-md border-l-4 bg-card p-s3 ${
          tone === "wrong" ? "border-primary" : "border-bronze"
        }`}
      >
        <p className="text-caption uppercase tracking-widest text-muted-foreground">
          {answerLabel}
        </p>
        <p className="mt-s1 text-small">{answer}</p>
      </div>
    </div>
  );
}

function Highlighted({ text, wrong }: { text: string; wrong: string }) {
  const i = text.indexOf(wrong);
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-primary/10 px-s1 text-primary line-through decoration-2">
        <span className="sr-only">(sai) </span>
        {wrong}
      </mark>
      {text.slice(i + wrong.length)}
    </>
  );
}
