import type { ReactNode } from "react";

export default function ChoiceQuestion({
  badge,
  prompt,
  value,
  hint,
  className = "",
}: {
  badge: string;
  prompt: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`choice-question ${className} relative grid w-full max-w-3xl justify-items-center gap-4 text-center`}>
      <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-red to-[#72558a] text-xl font-black text-white" aria-hidden="true">
        {badge}
      </span>
      <p className="m-0 text-sm text-ink-soft">{prompt}</p>
      <strong className="text-[clamp(26px,5vw,52px)] font-black max-md:text-3xl">{value}</strong>
      {hint ? <small className="max-w-xl text-xs leading-5 text-ink-soft">{hint}</small> : null}
    </div>
  );
}
