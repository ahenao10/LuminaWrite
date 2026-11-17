import React, { useEffect, useMemo, useState } from "react";
import defaultQuizPool from "../../data/defaultQuizQuestions.json";
import ActionButton from "../common/ActionButton";

export function getRandomDefaultQuizQuestions(count = 5) {
  const copy = [...defaultQuizPool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export default function RetentionQuizCard({
  activeEntry,
  onSaveQuizResult,
  isLoading = false,
  errorMessage = "",
  onRetry,
  onClose,
}) {
  const questions = useMemo(() => {
    if (
      Array.isArray(activeEntry?.quizQuestions) &&
      activeEntry.quizQuestions.length > 0
    ) {
      return activeEntry.quizQuestions;
    }
    return getRandomDefaultQuizQuestions(5);
  }, [activeEntry?.id, activeEntry?.quizQuestions]);

  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState(
    () => activeEntry?.quizResult?.answers || {}
  );
  const [checkedQuestions, setCheckedQuestions] = useState(
    () => activeEntry?.quizResult?.checked || {}
  );

  useEffect(() => {
    setCurrentQIdx(0);
    setAnswers(activeEntry?.quizResult?.answers || {});
    setCheckedQuestions(activeEntry?.quizResult?.checked || {});
  }, [activeEntry?.id]);

  const currentQuestion = questions[currentQIdx] || questions[0];
  const selectedOption = answers[currentQuestion.id] || "";
  const isChecked = Boolean(checkedQuestions[currentQuestion.id]);
  const isCorrect = selectedOption === currentQuestion.correct;

  const totalChecked = Object.keys(checkedQuestions).length;
  const totalCorrect = questions.filter(
    (q) => checkedQuestions[q.id] && answers[q.id] === q.correct
  ).length;

  const handleVerifyCurrentQuestion = () => {
    if (!selectedOption) return;
    const nextChecked = { ...checkedQuestions, [currentQuestion.id]: true };
    setCheckedQuestions(nextChecked);

    const nextAnswered = Object.keys(nextChecked).length;
    const nextCorrect = questions.filter(
      (q) => nextChecked[q.id] && answers[q.id] === q.correct
    ).length;

    onSaveQuizResult?.(activeEntry.id, {
      correct: nextCorrect,
      total: questions.length,
      answered: nextAnswered,
      answers,
      checked: nextChecked,
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 min-h-[280px]">
        <span className="material-symbols-outlined animate-spin text-primary text-[36px]">
          progress_activity
        </span>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Preparing your 5-question quiz...
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Creating questions tailored to your Daily Practice prompt and feedback.
          </p>
        </div>
      </div>
    );
  }

  if (
    errorMessage &&
    (!Array.isArray(activeEntry?.quizQuestions) ||
      activeEntry.quizQuestions.length === 0)
  ) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm flex flex-col items-center justify-center text-center gap-4 min-h-[260px]">
        <span className="material-symbols-outlined text-error text-[36px]">
          error_outline
        </span>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Could not load quiz questions
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-md">
            {errorMessage}
          </p>
        </div>
        {onRetry && (
          <ActionButton variant="primary" size="md" icon="refresh" onClick={onRetry}>
            Try Again
          </ActionButton>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              quiz
            </span>
            <div>
              <span className="font-headline-sm text-headline-sm text-on-surface block">
                Retention &amp; Reinforcement Check
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Answer 5 quick questions to practice key English rules.
              </span>
            </div>
          </div>
          <span className="font-label-sm text-label-sm px-2.5 py-1 rounded bg-surface-container font-semibold text-on-surface-variant shrink-0">
            Question {currentQIdx + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Dots for 5 Questions */}
        <div className="flex items-center gap-2 mt-4">
          {questions.map((q, idx) => {
            const answered = Boolean(checkedQuestions[q.id]);
            const qCorrect = answered && answers[q.id] === q.correct;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentQIdx(idx)}
                className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
                  idx === currentQIdx
                    ? "bg-primary ring-2 ring-primary/30"
                    : answered
                    ? qCorrect
                      ? "bg-tertiary"
                      : "bg-error"
                    : "bg-surface-container"
                }`}
                title={`Question ${idx + 1}`}
              />
            );
          })}
        </div>

        <div className="mt-4">
          <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
            Topic: {currentQuestion.topic}
          </span>
          <p className="font-body-lg text-body-lg text-on-surface font-semibold mt-1">
            {currentQuestion.question}
          </p>
        </div>

        {/* Quiz Options */}
        <div className="flex flex-col gap-2.5 mt-4">
          {currentQuestion.options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 p-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-all border-2 border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary-fixed/20"
            >
              <input
                className="w-4 h-4 text-primary focus:ring-primary"
                name={`retention-quiz-${currentQuestion.id}`}
                type="radio"
                value={opt.value}
                checked={selectedOption === opt.value}
                disabled={isChecked}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: e.target.value,
                  }))
                }
              />
              <span className="font-body-md text-body-md text-on-surface">
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        {/* Quiz Response Feedback Box */}
        {isChecked && (
          <div
            className={`mt-4 p-3.5 rounded-lg ${
              isCorrect
                ? "bg-tertiary-container/20 text-tertiary"
                : "bg-error-container text-on-error-container"
            }`}
          >
            <div className="flex items-center gap-2 font-label-md text-label-md">
              <span className="material-symbols-outlined text-[18px]">
                {isCorrect ? "check_circle" : "cancel"}
              </span>
              {isCorrect ? "Correct!" : "Not quite right"}
            </div>
            <p className="font-body-sm text-body-sm mt-1">
              {isCorrect
                ? currentQuestion.successMsg
                : currentQuestion.errorMsg}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Score: <strong>{totalCorrect}</strong> / {questions.length}{" "}
          correct ({totalChecked} answered)
        </span>
        <div className="flex items-center gap-2">
          <ActionButton
            variant="container"
            size="md"
            disabled={currentQIdx === 0}
            onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
            className="px-3"
          >
            Previous
          </ActionButton>
          {!isChecked ? (
            <ActionButton
              variant="primary"
              size="md"
              disabled={!selectedOption}
              onClick={handleVerifyCurrentQuestion}
            >
              Check Answer
            </ActionButton>
          ) : currentQIdx === questions.length - 1 ? (
            <ActionButton
              variant="tertiary"
              size="md"
              icon="check_circle"
              onClick={onClose}
            >
              Done
            </ActionButton>
          ) : (
            <ActionButton
              variant="primary"
              size="md"
              onClick={() =>
                setCurrentQIdx((i) =>
                  Math.min(questions.length - 1, i + 1)
                )
              }
            >
              Next Question
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}
