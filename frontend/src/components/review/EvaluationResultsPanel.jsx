import React from "react";
import SideBySideDiff from "../SideBySideDiff";

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

export default function EvaluationResultsPanel({
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
    {
      label: "Grammar & Accuracy",
      val: rubric.grammar ?? 0,
      desc: "Sentence structure, verb tenses, and punctuation",
      dotClass: "bg-primary",
      textClass: "text-primary",
      barClass: "bg-primary",
    },
    {
      label: "Vocabulary",
      val: rubric.vocabulary ?? 0,
      desc: "Word choice, variety, and natural expressions",
      dotClass: "bg-secondary-container",
      textClass: "text-secondary-container",
      barClass: "bg-secondary-container",
    },
    {
      label: "Organization & Flow",
      val: rubric.cohesion ?? 0,
      desc: "Linking words, paragraphs, and clear ideas",
      dotClass: "bg-tertiary",
      textClass: "text-tertiary",
      barClass: "bg-tertiary",
    },
    {
      label: "Task Achievement",
      val: rubric.task_achievement ?? 0,
      desc: "How completely you answered the question",
      dotClass: "bg-primary-container",
      textClass: "text-primary-container",
      barClass: "bg-primary-container",
    },
  ];
  const strongest = [...rubricEntries].sort((a, b) => b.val - a.val)[0];

  return (
    <div className="flex flex-col w-full">
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
            {rubricEntries.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${item.dotClass}`}
                    ></span>
                    <span className="font-label-md text-label-md text-on-surface">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`font-label-md text-label-md font-bold ${item.textClass}`}
                  >
                    {item.val}%
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className={`${item.barClass} h-full rounded-full transition-all duration-700`}
                    style={{ width: `${item.val}%` }}
                  ></div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">
                  {item.desc}
                </span>
              </div>
            ))}
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

      <SideBySideDiff
        userText={userText}
        enhancedText={enhanced_text}
        corrections={corrections}
      />
    </div>
  );
}
