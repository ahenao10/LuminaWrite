import React, { useEffect, useRef, useState } from "react";
import { SUGGESTED_TOPICS } from "../data/initialData";
import ActionButton from "./common/ActionButton";
import CefrLevelSelector from "./common/CefrLevelSelector";
import ErrorBanner from "./common/ErrorBanner";
import FocusAreasDropdown from "./common/FocusAreasDropdown";
import ToastNotification from "./common/ToastNotification";

const DISCOURSE_MARKERS = [
  "Furthermore, ",
  "However, ",
  "Consequently, ",
  "For instance, ",
  "On the other hand, ",
  "In conclusion, ",
];

export default function DailyPracticeView({
  selectedCefr,
  onSelectCefr,
  selectedFocusAreas = [],
  onSelectFocusAreas,
  selectedTopic,
  onSelectTopic,
  promptData,
  isGeneratingPrompt,
  hasPendingPromptChanges = false,
  onGeneratePrompt,
  essayTitle,
  onChangeTitle,
  userText,
  onChangeUserText,
  isEvaluating,
  onEvaluate,
  onSaveDraft,
  errorMessage,
}) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [focusWarningToast, setFocusWarningToast] = useState(false);
  const focusToastTimerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (focusToastTimerRef.current) {
        clearTimeout(focusToastTimerRef.current);
      }
    };
  }, []);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const trimmedText = userText.trim();
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
  const minWordsRequired = Math.max(15, promptData?.min_words || 15);
  const meetsMinWords = wordCount >= 15;
  const hasNoFocusSelected = selectedFocusAreas.length === 0;

  const sentenceCount = trimmedText
    ? trimmedText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
    : 0;
  const estReadMinutes = Math.max(0.1, wordCount / 180).toFixed(1);
  const progressPercent = Math.min(100, Math.round((wordCount / 15) * 100));

  const handleInsertMarker = (marker) => {
    const needsSpace =
      userText.length > 0 && !userText.endsWith(" ") && !userText.endsWith("\n");
    onChangeUserText(userText + (needsSpace ? " " : "") + marker);
  };

  const handleSaveDraftClick = () => {
    onSaveDraft();
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2500);
  };

  const handlePromptButtonClick = () => {
    if (hasNoFocusSelected) {
      setFocusWarningToast(true);
      if (focusToastTimerRef.current) {
        clearTimeout(focusToastTimerRef.current);
      }
      focusToastTimerRef.current = setTimeout(() => {
        setFocusWarningToast(false);
      }, 3500);
      return;
    }
    setFocusWarningToast(false);
    onGeneratePrompt();
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <ToastNotification
        visible={focusWarningToast}
        message="Please select at least one focus area to apply changes."
        onClose={() => setFocusWarningToast(false)}
      />

      {/* Top Daily Prompt Header & Context Card */}
      <section className="w-full mb-8 mt-4">
        <div className="relative rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-3xl"></div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  auto_awesome
                </span>
                Today&apos;s AI Prompt
              </span>

              <CefrLevelSelector
                selectedCefr={selectedCefr}
                onSelectCefr={onSelectCefr}
              />

              <FocusAreasDropdown
                selectedCefr={selectedCefr}
                selectedFocusAreas={selectedFocusAreas}
                onSelectFocusAreas={onSelectFocusAreas}
              />

              {/* Optional Topic Filter */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-[15px] text-primary">
                  category
                </span>
                <select
                  value={selectedTopic}
                  onChange={(e) => onSelectTopic(e.target.value)}
                  className="bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer"
                  aria-label="Prompt Topic"
                >
                  {SUGGESTED_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md">
                <span className="material-symbols-outlined text-[14px]">
                  format_align_left
                </span>
                Min {minWordsRequired} words
              </span>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md font-semibold">
                <span className="material-symbols-outlined text-[15px] text-primary">
                  timer
                </span>
                <span>{formatTimer(secondsElapsed)} elapsed</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <ActionButton
                variant={hasPendingPromptChanges ? "tertiary" : "primary"}
                size="md"
                icon={
                  isGeneratingPrompt
                    ? "refresh"
                    : hasPendingPromptChanges
                    ? "check"
                    : "refresh"
                }
                iconClassName="text-[16px]"
                spinIcon={isGeneratingPrompt}
                dimmed={hasNoFocusSelected}
                disabled={isGeneratingPrompt}
                onClick={handlePromptButtonClick}
              >
                {isGeneratingPrompt
                  ? "Generating Prompt..."
                  : hasPendingPromptChanges
                  ? "Apply changes"
                  : "Generate New Prompt"}
              </ActionButton>
            </div>
          </div>

          {/* Prompt Question Editorial Display */}
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                Topic: {promptData?.topic || "General Practice"}
              </span>
              <span className="text-on-surface-variant/40">•</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Target Level: {selectedCefr}
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight leading-snug mb-3">
              {isGeneratingPrompt ? (
                <span className="inline-flex items-center gap-2.5 text-on-surface-variant font-body-lg text-body-lg py-1">
                  <span className="material-symbols-outlined animate-spin text-primary text-[20px]">
                    progress_activity
                  </span>
                  Generating a fresh writing prompt for {selectedCefr}...
                </span>
              ) : promptData?.question ? (
                `“${promptData.question}”`
              ) : (
                <span className="text-on-surface-variant font-body-lg text-body-lg">
                  No prompt loaded yet. Click &quot;Generate New Prompt&quot; to get a fresh question.
                </span>
              )}
            </h1>

            <details className="group mt-4 text-on-surface-variant" open>
              <summary className="inline-flex items-center gap-2 cursor-pointer list-none select-none font-label-md text-label-md text-primary hover:text-primary-container transition-colors">
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-open:rotate-90">
                  arrow_right
                </span>
                <span>Writing Coach Guidance &amp; Tips</span>
              </summary>
              <div className="mt-3 pl-5 py-3 pr-4 rounded-lg bg-surface-container-low text-on-surface-variant text-body-sm font-body-sm space-y-1.5">
                {promptData?.tips && promptData.tips.length > 0 ? (
                  promptData.tips.map((tip, idx) => (
                    <p key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{tip}</span>
                    </p>
                  ))
                ) : (
                  <p>
                    Organize your ideas clearly and support your argument with concrete examples.
                  </p>
                )}
              </div>
            </details>
          </div>
        </div>
      </section>

      <ErrorBanner message={errorMessage} />

      {/* Main Asymmetric Workspace & Real-time AI Assistant Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <section className="xl:col-span-7 flex flex-col gap-4">
          <div className="rounded-xl bg-surface-container-lowest p-6 lg:p-8 shadow-sm flex flex-col min-h-[480px] relative">
            <div className="mb-5 pb-4 border-b border-surface-container flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Document Title
                </span>
                <div className="flex items-center gap-3">
                  {userText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onChangeUserText("")}
                      className="font-label-sm text-label-sm text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                    >
                      Clear text
                    </button>
                  )}
                  <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>{" "}
                    {draftSavedToast ? "Draft saved!" : "Live Editor"}
                  </span>
                </div>
              </div>
              <input
                className="font-headline-sm text-headline-sm text-on-surface bg-transparent focus:outline-none w-full py-1 placeholder:text-outline-variant"
                placeholder="AI-suggested title (editable)..."
                type="text"
                value={essayTitle}
                onChange={(e) => onChangeTitle(e.target.value)}
              />
            </div>

            <textarea
              value={userText}
              onChange={(e) => onChangeUserText(e.target.value)}
              placeholder="Start writing your response in English here (minimum 15 words required for evaluation)..."
              className="flex-grow w-full min-h-[320px] resize-y bg-transparent font-body-xl text-body-xl text-on-surface leading-relaxed selection:bg-primary-fixed selection:text-on-primary-fixed focus:outline-none placeholder:text-outline-variant/70"
              spellCheck="true"
            />

            <div className="mt-4 pt-4 border-t border-surface-container flex flex-wrap items-center justify-between gap-3 text-on-surface-variant font-label-md text-label-md">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      meetsMinWords ? "bg-tertiary" : "bg-amber-500"
                    }`}
                  ></span>
                  {meetsMinWords
                    ? "Minimum word count reached (15+ words)"
                    : `Write ${Math.max(0, 15 - wordCount)} more ${
                        15 - wordCount === 1 ? "word" : "words"
                      } to unlock AI Evaluation`}
                </span>
              </div>
              <span className="text-on-surface-variant/70 italic text-body-sm font-body-sm">
                {sentenceCount} {sentenceCount === 1 ? "sentence" : "sentences"}
              </span>
            </div>
          </div>

          {/* Editor Metrics & Submission Footer Card */}
          <div className="rounded-xl bg-surface-container-low p-4 lg:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Word Count
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-headline-sm text-headline-sm font-semibold ${
                      meetsMinWords ? "text-tertiary" : "text-on-surface"
                    }`}
                  >
                    {wordCount}
                  </span>
                  <span className="text-label-md font-label-md text-on-surface-variant font-normal">
                    / 15 min
                  </span>
                </div>
              </div>
              <div className="h-8 w-px bg-surface-container-highest"></div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Estimated Read
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {estReadMinutes}{" "}
                  <span className="text-label-md font-label-md text-on-surface-variant font-normal">
                    min
                  </span>
                </span>
              </div>
              <div className="h-8 w-px bg-surface-container-highest"></div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Target Level
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-primary font-semibold">
                    {selectedCefr}
                  </span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-auto">
              <ActionButton
                variant="highest"
                size="lg"
                disabled={wordCount === 0}
                onClick={handleSaveDraftClick}
                className="px-4"
              >
                Save as Draft
              </ActionButton>
              <ActionButton
                variant="primary"
                size="lg"
                icon={isEvaluating ? "progress_activity" : "send"}
                iconPosition="right"
                spinIcon={isEvaluating}
                disabled={!meetsMinWords || isEvaluating}
                onClick={onEvaluate}
                title={
                  !meetsMinWords
                    ? "Please write at least 15 words to evaluate"
                    : "Submit your text for AI Evaluation"
                }
              >
                <span>
                  {isEvaluating
                    ? "Evaluating with AI..."
                    : "Submit for AI Evaluation"}
                </span>
              </ActionButton>
            </div>
          </div>
        </section>

        {/* Right Area: Real-Time AI Pedagogical Inspector */}
        <aside className="xl:col-span-5 flex flex-col gap-4">
          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">
                  bolt
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-label-lg text-label-lg text-on-surface">
                    Writing Assistant
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm font-semibold">
                    Active Live
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Ready to evaluate grammar, vocabulary &amp; cohesion
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Submission Readiness
              </span>
              <span className="font-label-md text-label-md text-secondary font-semibold">
                CEFR {selectedCefr} Mode
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-label-sm font-label-sm">
                <span className="text-on-surface">Minimum Length (15 words)</span>
                <span
                  className={`font-bold ${
                    meetsMinWords ? "text-tertiary" : "text-primary"
                  }`}
                >
                  {wordCount} / 15 words ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className={`${
                    meetsMinWords ? "bg-tertiary" : "bg-primary"
                  } h-full rounded-full transition-all duration-300`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-label-sm font-label-sm">
                <span className="text-on-surface">Target Register</span>
                <span className="text-primary font-bold">
                  Structured &amp; Clear
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden flex">
                <div className="bg-surface-container-high h-full w-[25%]"></div>
                <div className="bg-primary/40 h-full w-[45%]"></div>
                <div className="bg-primary h-full w-[30%]"></div>
              </div>
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>Conversational</span>
                <span>Neutral</span>
                <span className="font-semibold text-primary">
                  Academic {selectedCefr}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <h3 className="font-label-lg text-label-lg text-on-surface">
                  Cohesive Connectors
                </h3>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                Click to insert
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Insert transition words directly into your essay to connect your ideas smoothly:
            </p>
            <div className="flex flex-wrap gap-2">
              {DISCOURSE_MARKERS.map((marker) => (
                <button
                  key={marker}
                  type="button"
                  onClick={() => handleInsertMarker(marker)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                >
                  + {marker.trim()}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                tips_and_updates
              </span>
              <h3 className="font-label-lg text-label-lg text-on-surface">
                How Evaluation Works
              </h3>
            </div>
            <ul className="space-y-2 text-body-sm font-body-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>
                  Write at least <strong>15 words</strong> answering the prompt above.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>
                  Click <strong>Submit for AI Evaluation</strong> to lock your answer and open your <strong>Session Review</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>
                  Hover over underlined phrases in the review to see why each correction was made, then complete the 5-question practice quiz.
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
