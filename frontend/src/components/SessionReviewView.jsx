import React, { useEffect, useState } from "react";
import SideBySideDiff from "./SideBySideDiff";

function getGradeFromScore(score) {
  if (score >= 90) return "Grade A";
  if (score >= 80) return "Grade B";
  if (score >= 70) return "Grade C";
  if (score >= 60) return "Grade D";
  return "Keep Practicing";
}

function getCefrDescription(cefr) {
  const map = {
    A1: "CEFR A1 (Beginner)",
    A2: "CEFR A2 (Elementary)",
    B1: "CEFR B1 (Intermediate)",
    B2: "CEFR B2 (Upper-Intermediate)",
    C1: "CEFR C1 (Advanced)",
    C2: "CEFR C2 (Mastery)",
  };
  return map[cefr] || `CEFR ${cefr}`;
}

const PRACTICE_QUESTIONS = [
  {
    id: 1,
    topic: "Purpose: 'to' + verb",
    question:
      "Which sentence correctly explains the purpose of an action?",
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

export function EvaluationResultsPanel({
  evaluation,
  userText,
  promptQuestion,
}) {
  if (!evaluation) return null;

  const {
    score = 0,
    cefr_level = "B1",
    rubric = {
      grammar: 0,
      vocabulary: 0,
      cohesion: 0,
      task_achievement: 0,
    },
    enhanced_text = "",
    corrections = [],
  } = evaluation;

  const rubricEntries = [
    { label: "Grammar & Accuracy", val: rubric.grammar ?? 0 },
    { label: "Vocabulary", val: rubric.vocabulary ?? 0 },
    { label: "Organization & Flow", val: rubric.cohesion ?? 0 },
    { label: "Task Achievement", val: rubric.task_achievement ?? 0 },
  ];
  const strongest = [...rubricEntries].sort((a, b) => b.val - a.val)[0];

  return (
    <div className="flex flex-col w-full">
      {/* Overall Score & Rubric Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
        {/* Composite Score Card */}
        <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                Your Score
              </span>
              <span className="inline-flex items-center gap-1 text-tertiary bg-tertiary-container/15 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">
                  lock
                </span>{" "}
                Final Submission
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="font-display-lg text-display-lg text-primary tracking-tight font-semibold">
                {score}
              </span>
              <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                / 100
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-label-lg text-label-lg font-bold text-on-surface">
                {getGradeFromScore(score)}
              </span>
              <span className="text-on-surface-variant">•</span>
              <span className="font-body-md text-body-md text-primary font-semibold">
                {getCefrDescription(cefr_level)}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-3 leading-relaxed">
              {promptQuestion
                ? `Prompt: "${promptQuestion}"`
                : "Your text has been evaluated across four key writing skills."}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-surface-container flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">
              verified
            </span>
            <span className="font-label-sm text-label-sm text-on-surface">
              Strongest skill: <strong>{strongest.label}</strong>
            </span>
          </div>
        </div>

        {/* Rubric Sub-scores Card */}
        <div className="lg:col-span-8 rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Score Breakdown
            </h2>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              CEFR Writing Rubric
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 my-auto">
            {/* Grammar */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="font-label-md text-label-md text-on-surface">
                    Grammar &amp; Accuracy
                  </span>
                </div>
                <span className="font-label-md text-label-md font-bold text-primary">
                  {rubric.grammar ?? 0}%
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-700"
                  style={{ width: `${rubric.grammar ?? 0}%` }}
                ></div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                Sentence structure, verb tenses, and punctuation
              </span>
            </div>

            {/* Vocabulary */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                  <span className="font-label-md text-label-md text-on-surface">
                    Vocabulary
                  </span>
                </div>
                <span className="font-label-md text-label-md font-bold text-secondary-container">
                  {rubric.vocabulary ?? 0}%
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary-container h-full rounded-full transition-all duration-700"
                  style={{ width: `${rubric.vocabulary ?? 0}%` }}
                ></div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                Word choice, variety, and natural expressions
              </span>
            </div>

            {/* Cohesion */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  <span className="font-label-md text-label-md text-on-surface">
                    Organization &amp; Flow
                  </span>
                </div>
                <span className="font-label-md text-label-md font-bold text-tertiary">
                  {rubric.cohesion ?? 0}%
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-tertiary h-full rounded-full transition-all duration-700"
                  style={{ width: `${rubric.cohesion ?? 0}%` }}
                ></div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                Linking words, paragraphs, and clear ideas
              </span>
            </div>

            {/* Task Achievement */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                  <span className="font-label-md text-label-md text-on-surface">
                    Task Achievement
                  </span>
                </div>
                <span className="font-label-md text-label-md font-bold text-primary-container">
                  {rubric.task_achievement ?? 0}%
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-700"
                  style={{ width: `${rubric.task_achievement ?? 0}%` }}
                ></div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                How completely you answered the question
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-surface-container text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                check_circle
              </span>{" "}
              {corrections.length}{" "}
              {corrections.length === 1 ? "correction" : "corrections"} found
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                psychology
              </span>{" "}
              AI English Coach
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Side-by-Side Diff Section */}
      <SideBySideDiff
        userText={userText}
        enhancedText={enhanced_text}
        corrections={corrections}
      />
    </div>
  );
}

export default function SessionReviewView({
  activeEntry,
  dayEntries = [],
  onSelectEntry,
  onNavigateToPractice,
  onNavigateToJournal,
  onSaveQuizResult,
}) {
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // 5-question Retention & Reinforcement Check state
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

  if (!activeEntry || !activeEntry.evaluation) {
    return (
      <div className="py-16 text-center rounded-xl bg-surface-container-lowest p-8 shadow-sm mt-6">
        <span className="material-symbols-outlined text-primary text-[40px] mb-3">
          rate_review
        </span>
        <h2 className="font-headline-md text-headline-md text-on-surface">
          No Evaluated Exercise Selected
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md mx-auto">
          Write and submit an answer in Daily Practice to see your score, side-by-side corrections, and practice quiz.
        </p>
        <button
          type="button"
          onClick={onNavigateToPractice}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          Go to Daily Practice
        </button>
      </div>
    );
  }

  const reflectionWords = reflectionText.trim()
    ? reflectionText.trim().split(/\s+/).length
    : 0;

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

  const handleSaveReflection = () => {
    if (!reflectionText.trim()) return;
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2500);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Navigation & Metadata Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b border-surface-container-high/60">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToJournal}
              className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              Back to Journal
            </button>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Session Review &amp; Feedback
            </span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              {activeEntry.title || "Writing Exercise"}
            </h1>
            <span className="font-label-md text-label-md px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold">
              {activeEntry.promptId || "Completed"}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">
              schedule
            </span>
            Submitted {activeEntry.date || "Just now"}{" "}
            <span className="text-on-surface-variant/40">|</span>{" "}
            {activeEntry.words} words{" "}
            <span className="text-on-surface-variant/40">|</span> Topic:{" "}
            {activeEntry.topic || "General"}
          </p>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={onNavigateToPractice}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container shadow-sm transition-all font-label-md text-label-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              add_circle
            </span>
            Practice Another Question
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container shadow-sm transition-all font-label-md text-label-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              picture_as_pdf
            </span>
            Export PDF
          </button>
        </div>
      </div>

      {/* List of all exercises completed on the same day */}
      {dayEntries.length > 0 && (
        <div className="mt-5 rounded-xl bg-surface-container-low p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">
                format_list_bulleted
              </span>
              <h2 className="font-label-lg text-label-lg text-on-surface">
                Exercises Completed on This Day ({dayEntries.length})
              </h2>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Click any exercise to view its feedback (read-only)
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {dayEntries.map((entry, idx) => {
              const isActive = entry.id === activeEntry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectEntry(entry)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <span className="font-label-sm text-label-sm font-bold opacity-80">
                    #{dayEntries.length - idx}
                  </span>
                  <span className="font-label-md text-label-md font-semibold truncate max-w-[200px]">
                    {entry.title}
                  </span>
                  {entry.evaluation?.score != null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-tertiary-container/15 text-tertiary"
                      }`}
                    >
                      {entry.evaluation.score}/100
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Evaluation Summary: Vocabulary vs Writing */}
      {activeEntry.entryType === "vocabulary" ? (
        <div className="mt-8 rounded-xl bg-surface-container-lowest p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm uppercase tracking-wider font-bold">
                Vocabulary Practice
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                CEFR {activeEntry.evaluation.cefr_level || "B1"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary font-label-md text-label-md font-bold uppercase">
                Accuracy: {activeEntry.accuracy || "standard"}
              </span>
              <span className="font-headline-md text-headline-md font-bold text-on-surface">
                {activeEntry.evaluation.score}/100
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Spanish Prompt
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {activeEntry.question}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container-low">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                Your Translation
              </span>
              <p className="font-body-lg text-body-lg text-on-surface">
                {activeEntry.user_text}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-low">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary block mb-1">
                Natural English
              </span>
              <p className="font-body-lg text-body-lg text-on-surface font-medium">
                {activeEntry.evaluation.enhanced_text}
              </p>
            </div>
          </div>

          {activeEntry.vocabFeedback && (
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {activeEntry.vocabFeedback}
            </p>
          )}
        </div>
      ) : (
        <EvaluationResultsPanel
          evaluation={activeEntry.evaluation}
          userText={activeEntry.user_text}
          promptQuestion={activeEntry.question}
        />
      )}

      {/* Bottom Section: 5-Question Retention & Reinforcement Check (today's writing only) + Personal Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-10">
        {activeEntry.entryType !== "vocabulary" && activeEntry.isToday && (
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
              <button
                type="button"
                disabled={currentQIdx === 0}
                onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
                className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface font-label-md text-label-md cursor-pointer"
              >
                Previous
              </button>
              {!isChecked ? (
                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleVerifyCurrentQuestion}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-all font-label-md text-label-md shadow-sm cursor-pointer"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  type="button"
                  disabled={currentQIdx === PRACTICE_QUESTIONS.length - 1}
                  onClick={() =>
                    setCurrentQIdx((i) =>
                      Math.min(PRACTICE_QUESTIONS.length - 1, i + 1)
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container disabled:opacity-40 transition-all font-label-md text-label-md shadow-sm cursor-pointer"
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Personal Reflection Notes Container */}
        <div
          className={`${
            activeEntry.entryType !== "vocabulary" && activeEntry.isToday
              ? "lg:col-span-5"
              : "lg:col-span-12"
          } rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  history_edu
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface">
                  Personal Notes
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>{" "}
                {reflectionSaved ? "Saved!" : "Study Notes"}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">
              Write down new words or grammar rules you want to remember for your next writing exercise.
            </p>
            <div className="mt-3.5">
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                className="w-full p-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/50 transition-all leading-relaxed"
                placeholder="e.g. Remember to use 'to + verb' for purpose instead of 'for + verb'..."
                rows={6}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {reflectionWords} {reflectionWords === 1 ? "word" : "words"} written
            </span>
            <button
              type="button"
              onClick={handleSaveReflection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                bookmark_added
              </span>{" "}
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
