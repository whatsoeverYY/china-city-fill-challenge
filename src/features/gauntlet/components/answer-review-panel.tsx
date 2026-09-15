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
      className={`answer-review grid gap-3 rounded-2xl p-5 ${review.correct ? "is-correct bg-brand-green/10" : "is-wrong bg-brand-red/10"}`}
      role="status"
      aria-live="polite"
    >
      <span className={`answer-review-state text-xs font-black ${review.correct ? "text-brand-green-dark" : "text-brand-red-dark"}`}>
        {review.correct ? "✓ 回答正确" : "！需要复习"}
      </span>
      <p className="m-0 text-xs">正确答案</p>
      <strong className="text-xl">{review.correctAnswer}</strong>
      <div className="answer-explanation rounded-xl bg-white/60 p-3">
        <small className="text-[9px] font-black text-ink-soft">知识解释</small>
        <p className="mb-0 text-xs">{review.explanation}</p>
      </div>
      {review.checkpoint ? (
        <p className="boss-checkpoint m-0 rounded-lg bg-brand-gold/15 p-2 text-xs">{review.checkpoint}</p>
      ) : null}
      <button className="min-h-11 cursor-pointer rounded-xl border-0 bg-ink font-black text-white" type="button" onClick={onContinue}>
        {review.nextAction === "finish"
          ? "查看通关结果"
          : review.nextAction === "lose"
            ? "查看本轮结果"
            : "继续下一题"}
      </button>
    </div>
  );
}
