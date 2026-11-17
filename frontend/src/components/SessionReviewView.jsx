import React, { useEffect, useState } from "react";
import ActionButton from "./common/ActionButton";
import EvaluationResultsPanel from "./review/EvaluationResultsPanel";
import RetentionQuizCard from "./review/RetentionQuizCard";
import VocabularyReviewCard from "./review/VocabularyReviewCard";

export { EvaluationResultsPanel };

export default function SessionReviewView({
  activeEntry,
  dayEntries = [],
  onSelectEntry,
  onNavigateToPractice,
  onNavigateToVocabulary,
  onNavigateToJournal,
  onSaveQuizResult,
  onGenerateEntryQuiz,
  isGeneratingQuiz = false,
  quizError = "",
}) {
  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  useEffect(() => {
    setIsQuizOpen(false);
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
        <ActionButton
          variant="primary"
          size="lg"
          icon="edit_note"
          onClick={onNavigateToPractice}
          className="mt-5"
        >
          Go to Daily Practice
        </ActionButton>
      </div>
    );
  }

  const reflectionWords = reflectionText.trim()
    ? reflectionText.trim().split(/\s+/).length
    : 0;

  const isVocabReview = activeEntry.entryType === "vocabulary";
  const showRetentionQuiz = !isVocabReview && Boolean(activeEntry.isToday);

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
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">
                arrow_back
              </span>
              Back to Journal Entries
            </button>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              Evaluation Complete
            </span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
            {activeEntry.title || "Session Review"}
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 flex-wrap">
            <span>Completed: {activeEntry.date || "Today"}</span>
            <span className="text-on-surface-variant/40">|</span>
            <span>Length: {activeEntry.words || 0} words</span>
            <span className="text-on-surface-variant/40">|</span>
            <span>Topic: {activeEntry.topic || "General"}</span>
          </p>
        </div>

        {/* Top Action Bar using shared ActionButton */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {showRetentionQuiz && (
            <ActionButton
              variant="tertiary"
              size="md"
              icon="quiz"
              onClick={() => {
                setIsQuizOpen(true);
                if (
                  !activeEntry.isDefaultPrompt &&
                  !activeEntry.quizQuestions?.length
                ) {
                  onGenerateEntryQuiz?.(activeEntry);
                }
              }}
            >
              Practice feedback with quiz
            </ActionButton>
          )}
          <ActionButton
            variant="primary"
            size="md"
            icon={isVocabReview ? "translate" : "add_circle"}
            onClick={isVocabReview ? onNavigateToVocabulary : onNavigateToPractice}
          >
            {isVocabReview
              ? "Practice More Vocabulary"
              : "Practice Another Question"}
          </ActionButton>
        </div>
      </div>

      {/* List of all exercises completed on the same day */}
      {dayEntries.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-surface-container-low flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Exercises Completed on This Day ({dayEntries.length})
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Click any exercise to view its feedback
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dayEntries.map((entry, idx) => {
              const isActive = entry.id === activeEntry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onSelectEntry?.(entry)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-left transition-all cursor-pointer ${isActive
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
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isActive
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
      {isVocabReview ? (
        <VocabularyReviewCard entry={activeEntry} />
      ) : (
        <EvaluationResultsPanel
          evaluation={activeEntry.evaluation}
          userText={activeEntry.user_text}
          promptQuestion={activeEntry.question}
        />
      )}

      {/* Bottom Section: Personal Reflection Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-10">
        {/* Personal Reflection Notes Container */}
        <div className="lg:col-span-12 rounded-xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between">
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
            <ActionButton
              variant="container"
              size="sm"
              icon="bookmark_added"
              iconClassName="text-[16px]"
              onClick={handleSaveReflection}
              className="px-3 py-1.5 font-label-md text-label-md"
            >
              Save Note
            </ActionButton>
          </div>
        </div>
      </div>
      {/* Full-screen Quiz Overlay (hides feedback so learner cannot peek) */}
      {isQuizOpen && showRetentionQuiz && (
        <div
          className="fixed inset-0 z-50 bg-surface overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Practice feedback with quiz"
        >
          <button
            type="button"
            onClick={() => setIsQuizOpen(false)}
            aria-label="Close quiz"
            className="fixed top-5 right-5 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high shadow-md border border-outline-variant/40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>

          <div className="w-full max-w-3xl my-auto">
            <RetentionQuizCard
              activeEntry={activeEntry}
              onSaveQuizResult={onSaveQuizResult}
              isLoading={isGeneratingQuiz}
              errorMessage={quizError}
              onRetry={() => onGenerateEntryQuiz?.(activeEntry)}
              onClose={() => setIsQuizOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
