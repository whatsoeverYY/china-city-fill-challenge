import type { AnswerReview } from "@/features/gauntlet/model/gauntlet-types";

export default function AnswerReviewPanel({
  review,
  onContinue,
}: {
  review: AnswerReview;
  onContinue: () => void;
}) {
  return (
    <div
      className={`answer-review grid gap-3 rounded-2xl border p-[22px] shadow-[0_16px_38px_rgba(58,75,61,.09)] ${review.correct ? "border-jade-500/25 bg-gradient-to-br from-jade-200/95 to-paper-100/95" : "border-city-500/25 bg-gradient-to-br from-city-200/95 to-paper-100/95"}`}
      role="status"
      aria-live="polite"
    >
      <span className={`answer-review-state w-max rounded-full px-2.5 py-1.5 text-[11px] font-black ${review.correct ? "bg-jade-500/10 text-jade-700" : "bg-city-500/10 text-city-900"}`}>
        {review.correct ? "✓ 回答正确" : "！需要复习"}
      </span>
      <p className="mb-[-8px] mt-1 text-meta font-black tracking-[.12em] text-stone-700">正确答案</p>
      <strong className="font-serif text-page text-clay-800 max-sm:text-page-mobile">{review.correctAnswer}</strong>
      <div className="answer-explanation rounded-r-[10px] border-l-[3px] border-gold-500 bg-gold-100/85 px-[15px] py-3.5">
        <small className="text-meta font-black tracking-[.14em] text-gold-700">知识解释</small>
        <p className="mb-0 mt-1.5 text-compact text-stone-800">{review.explanation}</p>
      </div>
      {review.checkpoint ? (
        <p className="boss-checkpoint m-0 rounded-lg bg-gold-500/15 p-2 text-xs">{review.checkpoint}</p>
      ) : null}
      <button className="min-h-11 cursor-pointer rounded-[10px] border-0 bg-city-500 px-4 py-3 text-compact font-black text-white" type="button" onClick={onContinue}>
        {review.nextAction === "finish"
          ? "查看通关结果"
          : review.nextAction === "lose"
            ? "查看本轮结果"
            : "继续下一题"}
      </button>
    </div>
  );
}
