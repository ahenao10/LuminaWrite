import React, { useEffect, useState } from "react";
import { CEFR_LEVELS, SUGGESTED_TOPICS } from "../data/initialData";

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
  selectedTopic,
  onSelectTopic,
  promptData,
  isGeneratingPrompt,
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

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
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

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Daily Prompt Header & Context Card */}
      <section className="w-full mb-8 mt-4">
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          {/* Ambient gentle tint glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-3xl pointer-events-none"></div>

          {/* Controls Row: Badges + CEFR Level Selector + Topic + Generate Prompt Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  auto_awesome
                </span>
                Today&apos;s AI Prompt
              </span>

              {/* CEFR Level Selector */}
              <div className="inline-flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant px-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    school
                  </span>
                  CEFR:
                </span>
                {CEFR_LEVELS.map((lvl) => (
                  <button
                    key={lvl.code}
                    type="button"
                    onClick={() => onSelectCefr(lvl.code)}
                    className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-all cursor-pointer ${
                      selectedCefr === lvl.code
                        ? "bg-primary text-on-primary font-bold shadow-xs"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                    title={lvl.label}
                  >
                    {lvl.code}
                  </button>
                ))}
              </div>

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
              <button
                type="button"
                onClick={onGeneratePrompt}
                disabled={isGeneratingPrompt}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container disabled:opacity-60 font-label-md text-label-md transition-all shadow-sm cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isGeneratingPrompt ? "animate-spin" : ""
                  }`}
                >
                  refresh
                </span>
                {isGeneratingPrompt ? "Generating Prompt..." : "Generate New Prompt"}
              </button>
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
              “{promptData?.question}”
            </h1>

            {/* Accordion Hint Box */}
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

      {/* Error Alert Banner if API call fails */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container flex items-center gap-3 shadow-xs">
          <span className="material-symbols-outlined text-[22px] text-error">
            error
          </span>
          <div className="flex-1 font-body-md text-body-md">
            <strong className="font-semibold">Error: </strong>
            {errorMessage}
          </div>
        </div>
      )}

      {/* Main Asymmetric Workspace & Real-time AI Assistant Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Area: Rich Writing Canvas (7 cols on 12-col desktop) */}
        <section className="xl:col-span-7 flex flex-col gap-4">
          <div className="rounded-xl bg-surface-container-lowest p-6 lg:p-8 shadow-sm flex flex-col min-h-[480px] relative">
            {/* Document Meta / Title Input */}
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

            {/* Distraction-free Writing Canvas */}
            <textarea
              value={userText}
              onChange={(e) => onChangeUserText(e.target.value)}
              placeholder="Start writing your response in English here (minimum 15 words required for evaluation)..."
              className="flex-grow w-full min-h-[320px] resize-y bg-transparent font-body-xl text-body-xl text-on-surface leading-relaxed selection:bg-primary-fixed selection:text-on-primary-fixed focus:outline-none placeholder:text-outline-variant/70"
              spellCheck="true"
            />

            {/* Bottom status bar inside canvas */}
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
            {/* Live linguistic progress metrics */}
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

            {/* Action CTA buttons */}
            <div className="flex items-center gap-2.5 self-end md:self-auto">
              <button
                type="button"
                onClick={handleSaveDraftClick}
                disabled={wordCount === 0}
                className="px-4 py-2.5 rounded-lg bg-surface-container-highest hover:bg-surface-dim disabled:opacity-50 text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={onEvaluate}
                disabled={!meetsMinWords || isEvaluating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-label-lg text-label-lg shadow-sm hover:shadow transition-all group cursor-pointer"
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
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isEvaluating
                      ? "animate-spin"
                      : "group-hover:translate-x-0.5 transition-transform"
                  }`}
                >
                  {isEvaluating ? "progress_activity" : "send"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Area: Real-Time AI Pedagogical Inspector (5 cols on desktop) */}
        <aside className="xl:col-span-5 flex flex-col gap-4">
          {/* Real-time Status Card */}
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

          {/* Tone, Register & Minimum Word Goal Dial */}
          <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Submission Readiness
              </span>
              <span className="font-label-md text-label-md text-secondary font-semibold">
                CEFR {selectedCefr} Mode
              </span>
            </div>

            {/* Minimum Words Progress Bar */}
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

            {/* Tone Spectrum Meter */}
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

          {/* Interactive Discourse Markers & Connectors Block */}
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
              Boost your Cohesion rubric score by linking your ideas with formal discourse markers:
            </p>
            <div className="flex flex-wrap gap-2">
              {DISCOURSE_MARKERS.map((marker) => (
                <button
                  key={marker}
                  type="button"
                  onClick={() => handleInsertMarker(marker)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary-fixed text-on-surface hover:text-on-primary-fixed font-label-sm text-label-sm transition-colors cursor-pointer border border-outline-variant/30"
                >
                  + {marker.trim()}
                </button>
              ))}
            </div>
          </div>

          {/* AI Socratic Follow-Up / Prompt Challenger Card */}
          <div className="rounded-xl bg-gradient-to-br from-surface-container-high to-surface-container p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                psychology
              </span>
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                Coach Challenge
              </span>
            </div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface text-[1.1rem] leading-snug mb-2">
              “Have you considered a counter-argument or concrete real-world example?”
            </h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
              Addressing both sides of the topic and illustrating your claim with a specific observation significantly increases Task Achievement.
            </p>
            <button
              type="button"
              onClick={() =>
                handleInsertMarker(
                  "\n\nOn the other hand, some people argue that "
                )
              }
              className="text-primary hover:text-primary-container font-label-md text-label-md inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              <span>Insert counterpoint template</span>
              <span className="material-symbols-outlined text-[16px]">
                add_circle_outline
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

