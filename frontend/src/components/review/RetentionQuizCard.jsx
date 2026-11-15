import React, { useEffect, useState } from "react";
import ActionButton from "../common/ActionButton";

export const PRACTICE_QUESTIONS = [
  {
    id: 1,
    topic: "Purpose: 'to' + verb",
    question: "Which sentence correctly explains the purpose of an action?",
    options: [
      {
        value: "a",
        label: "A) Companies hold weekly meetings to help remote teams stay connected.",
      },
      {
        value: "b",
        label: "B) Companies hold weekly meetings for help remote teams stay connected.",
      },
      {
        value: "c",
        label: "C) Companies hold weekly meetings to helping remote teams stay connected.",
      },
    ],
    correct: "a",
    successMsg:
      "Correct! In English, use 'to + base verb' (to help) to explain why you do something.",
    errorMsg:
      "Not quite. Use 'to + base verb' ('to help') to show purpose, not 'for + verb' or 'to + -ing'.",
  },
  {
    id: 2,
    topic: "Subject-Verb Agreement",
    question:
      "Choose the sentence where the verb matches the subject correctly:",
    options: [
      {
        value: "a",
        label: "A) Many students uses online tools to practice their English.",
      },
      {
        value: "b",
        label: "B) Many students use online tools to practice their English.",
      },
      {
        value: "c",
        label: "C) Many student use online tools to practice their English.",
      },
    ],
    correct: "b",
    successMsg:
      "Great job! 'Many students' is plural, so it takes the base verb 'use' without '-s'.",
    errorMsg:
      "Check the plural subject 'Many students'. Plural subjects take 'use', not 'uses'.",
  },
  {
    id: 3,
    topic: "Adverbs vs. Adjectives",
    question: "Which sentence uses the adverb correctly to describe a verb?",
    options: [
      {
        value: "a",
        label: "A) Technology is changing our daily lives very quick.",
      },
      {
        value: "b",
        label: "B) Technology is changing our daily lives quickly.",
      },
      {
        value: "c",
        label: "C) Technology is quick changing our daily lives.",
      },
    ],
    correct: "b",
    successMsg:
      "Well done! Adverbs ending in '-ly' (like 'quickly') describe how an action happens.",
    errorMsg:
      "Remember to use the adverb 'quickly' (not the adjective 'quick') to describe the verb 'changing'.",
  },
  {
    id: 4,
    topic: "Linking Words (Contrast)",
    question: "Which sentence uses a contrast connector correctly?",
    options: [
      {
        value: "a",
        label: "A) Working from home saves time. However, it can feel lonely.",
      },
      {
        value: "b",
        label: "B) Working from home saves time. Because, it can feel lonely.",
      },
      {
        value: "c",
        label: "C) Working from home saves time. Furthermore, it can feel lonely.",
      },
    ],
    correct: "a",
    successMsg:
      "Correct! 'However' clearly introduces a contrasting or opposite idea.",
    errorMsg:
      "'However' is used to show contrast between a positive point and a negative point.",
  },
  {
    id: 5,
    topic: "Word Choice: 'affect' vs 'effect'",
    question: "Choose the sentence that uses 'affect' or 'effect' correctly:",
    options: [
      {
        value: "a",
        label: "A) Poor sleep can effect your focus at work.",
      },
      {
        value: "b",
        label: "B) Poor sleep can affect your focus at work.",
      },
      {
        value: "c",
        label: "C) Poor sleep has a strong affect on your focus at work.",
      },
    ],
    correct: "b",
    successMsg:
      "Nice! 'Affect' is usually the action verb ('can affect'), while 'effect' is usually a noun ('has an effect').",
    errorMsg:
      "Use 'affect' as the verb ('can affect') and 'effect' as the noun ('a strong effect').",
  },
];

export default function RetentionQuizCard({ activeEntry, onSaveQuizResult }) {
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

  const currentQuestion = PRACTICE_QUESTIONS[currentQIdx];
  const selectedOption = answers[currentQuestion.id] || "";
  const isChecked = Boolean(checkedQuestions[currentQuestion.id]);
  const isCorrect = selectedOption === currentQuestion.correct;

  const totalChecked = Object.keys(checkedQuestions).length;
  const totalCorrect = PRACTICE_QUESTIONS.filter(
    (q) => checkedQuestions[q.id] && answers[q.id] === q.correct
  ).length;

  const handleVerifyCurrentQuestion = () => {
    if (!selectedOption) return;
    const nextChecked = { ...checkedQuestions, [currentQuestion.id]: true };
    setCheckedQuestions(nextChecked);

    const nextAnswered = Object.keys(nextChecked).length;
    const nextCorrect = PRACTICE_QUESTIONS.filter(
      (q) => nextChecked[q.id] && answers[q.id] === q.correct
    ).length;

    onSaveQuizResult?.(activeEntry.id, {
      correct: nextCorrect,
      total: PRACTICE_QUESTIONS.length,
      answered: nextAnswered,
      answers,
      checked: nextChecked,
    });
  };

  return (
    <div className="lg:col-span-7 rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
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
            Question {currentQIdx + 1} of {PRACTICE_QUESTIONS.length}
          </span>
        </div>

        {/* Progress Dots for 5 Questions */}
        <div className="flex items-center gap-2 mt-4">
          {PRACTICE_QUESTIONS.map((q, idx) => {
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
          Score: <strong>{totalCorrect}</strong> / {PRACTICE_QUESTIONS.length}{" "}
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
          ) : (
            <ActionButton
              variant="primary"
              size="md"
              disabled={currentQIdx === PRACTICE_QUESTIONS.length - 1}
              onClick={() =>
                setCurrentQIdx((i) =>
                  Math.min(PRACTICE_QUESTIONS.length - 1, i + 1)
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
