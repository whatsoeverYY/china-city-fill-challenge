import type { ReactNode } from "react";

export default function ChoiceQuestion({
  badge,
  prompt,
  value,
  hint,
  className = "",
  badgeClassName = "bg-scholar-500",
  badgeShapeClassName = "rounded-[26px_26px_26px_9px]",
  valueClassName = "",
}: {
  badge: string;
  prompt: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
  badgeClassName?: string;
  badgeShapeClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`choice-question ${className} relative grid w-full max-w-[720px] justify-items-center text-center`}>
      <span className={`mb-7 grid size-[88px] -rotate-3 place-items-center font-serif text-[39px] font-black text-white shadow-[inset_0_0_0_4px_rgba(255,255,255,.2),0_16px_35px_rgba(76,48,91,.18)] max-sm:mb-3.5 max-sm:size-16 max-sm:text-[30px] ${badgeShapeClassName} ${badgeClassName}`} aria-hidden="true">
        {badge}
      </span>
      <p className="mb-3 mt-0 text-compact font-extrabold tracking-[0.14em] text-stone-700 max-sm:mb-2 max-sm:text-compact-mobile max-sm:tracking-normal">{prompt}</p>
      <strong className={`font-serif text-display max-sm:text-display-mobile ${valueClassName}`}>{value}</strong>
      {hint ? <small className="mt-4 max-w-xl text-compact font-extrabold text-gold-800 max-sm:mt-2.5 max-sm:text-compact-mobile">{hint}</small> : null}
    </div>
  );
}
