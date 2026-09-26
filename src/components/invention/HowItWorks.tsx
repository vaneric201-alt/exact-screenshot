/** The sequence of developments, as numbered steps in reading order. */
export function HowItWorks({ steps }: { steps: string[] }) {
  return (
    <ol data-reveal-stagger className="grid-12">
      {steps.map((t, i) => (
        <li
          key={t}
          className="surface relative col-span-12 flex gap-s4 p-s5 sm:col-span-6 lg:col-span-3 lg:flex-col"
        >
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display text-small font-bold text-primary-foreground shadow-seal"
          >
            {i + 1}
          </span>
          <p className="text-small">{t}</p>
        </li>
      ))}
    </ol>
  );
}
