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
      className={`answer-review ${review.correct ? "is-correct" : "is-wrong"}`}
      role="status"
      aria-live="polite"
    >
      <span className="answer-review-state">
        {review.correct ? "✓ 回答正确" : "！需要复习"}
      </span>
      <p>正确答案</p>
      <strong>{review.correctAnswer}</strong>
      <div className="answer-explanation">
        <small>知识解释</small>
        <p>{review.explanation}</p>
      </div>
      {review.checkpoint ? (
        <p className="boss-checkpoint">{review.checkpoint}</p>
      ) : null}
      <button type="button" onClick={onContinue}>
        {review.nextAction === "finish"
          ? "查看通关结果"
          : review.nextAction === "lose"
            ? "查看本轮结果"
            : "继续下一题"}
      </button>
    </div>
  );
}
