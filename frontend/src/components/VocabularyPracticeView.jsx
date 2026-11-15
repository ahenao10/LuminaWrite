import React, { useEffect, useRef, useState } from "react";
import { CEFR_FOCUS_AREAS, CEFR_LEVELS } from "../data/initialData";

const ACCURACY_STYLES = {
  low: {
    label: "Low",
    badge: "bg-error-container text-on-error-container",
    bar: "bg-error",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  standard: {
    label: "Standard",
    badge: "bg-primary/15 text-primary",
    bar: "bg-primary",
  },
  high: {
    label: "High",
    badge: "bg-tertiary/15 text-tertiary",
    bar: "bg-tertiary",
  },
};

export default function VocabularyPracticeView({
  vocabItem,
  isGeneratingVocab,
  selectedCefr,
  onSelectCefr,
  selectedFocusAreas = [],
  onSelectFocusAreas,
  hasPendingChanges = false,
  onApplyOrRegenerate,
  translationInput,
  onChangeTranslation,
  isEvaluatingVocab,
  vocabResult,
  onEvaluateVocab,
  onDontKnow,
  onContinue,
  errorMessage,
}) {
  const [focusWarningToast, setFocusWarningToast] = useState(false);
  const [isFocusMenuOpen, setIsFocusMenuOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const focusMenuRef = useRef(null);
  const focusToastTimerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        focusMenuRef.current &&
        !focusMenuRef.current.contains(event.target)
      ) {
        setIsFocusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (focusToastTimerRef.current) {
        clearTimeout(focusToastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setShowHint(false);
  }, [vocabItem?.spanish_text]);

  const levelFocusOptions = CEFR_FOCUS_AREAS[selectedCefr] || [];
  const isAllFocusSelected =
    levelFocusOptions.length > 0 &&
    levelFocusOptions.every((item) => selectedFocusAreas.includes(item));
  const hasNoFocusSelected = selectedFocusAreas.length === 0;

  const focusButtonLabel = isAllFocusSelected
    ? "ALL"
    : hasNoFocusSelected
    ? "None"
    : selectedFocusAreas.length === 1
    ? selectedFocusAreas[0]
    : `${selectedFocusAreas.length} selected`;

  const handleToggleAllFocus = () => {
    if (isAllFocusSelected) {
      onSelectFocusAreas?.([]);
    } else {
      onSelectFocusAreas?.(levelFocusOptions);
    }
  };

  const handleToggleSingleFocus = (item) => {
    const exists = selectedFocusAreas.includes(item);
    const next = exists
      ? selectedFocusAreas.filter((f) => f !== item)
      : [...selectedFocusAreas, item];
    onSelectFocusAreas?.(next);
  };

  const handleApplyButtonClick = () => {
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
    onApplyOrRegenerate?.();
  };

  const isEvaluated = Boolean(vocabResult);
  const accuracyMeta =
    ACCURACY_STYLES[vocabResult?.accuracy] || ACCURACY_STYLES.standard;

  return (
    <div className="flex flex-col w-full pb-16">
      {focusWarningToast && (
        <div
          role="alert"
          className="fixed top-20 right-4 sm:right-6 z-50 bg-surface-container-lowest border border-amber-500/40 text-on-surface rounded-xl shadow-xl px-4 py-3 pr-9 flex items-center gap-2.5"
        >
          <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 shrink-0">
            warning
          </span>
          <span className="font-body-sm text-body-sm whitespace-nowrap">
            Please select at least one focus area to apply changes.
          </span>
          <button
            type="button"
            onClick={() => setFocusWarningToast(false)}
            aria-label="Close notification"
            className="absolute top-1.5 right-1.5 p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] block">
              close
            </span>
          </button>
        </div>
      )}

      {/* Top Controls Card */}
      <section className="w-full mb-8 mt-4">
        <div className="relative rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-3xl"></div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  translate
                </span>
                Vocabulary Practice
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

              {/* Focus Area Multi-Check Dropdown */}
              <div className="relative" ref={focusMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsFocusMenuOpen((prev) => !prev)}
                  aria-expanded={isFocusMenuOpen}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-primary">
                    checklist
                  </span>
                  <span className="text-on-surface-variant">Focus:</span>
                  <span className="font-semibold max-w-[140px] truncate">
                    {focusButtonLabel}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    {isFocusMenuOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>

                {isFocusMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl p-2 z-30 flex flex-col gap-1">
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      {selectedCefr} Practice Focus
                    </div>

                    <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-container cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAllFocusSelected}
                        onChange={handleToggleAllFocus}
                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        ALL ({selectedCefr} skills)
                      </span>
                    </label>

                    <div className="my-1 border-t border-outline-variant/30" />

                    {levelFocusOptions.map((item) => {
                      const checked = selectedFocusAreas.includes(item);
                      return (
                        <label
                          key={item}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-container cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleSingleFocus(item)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                          />
                          <span className="font-body-sm text-body-sm text-on-surface">
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <button
                type="button"
                onClick={handleApplyButtonClick}
                disabled={isGeneratingVocab}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg disabled:opacity-60 font-label-md text-label-md transition-all shadow-sm cursor-pointer ${
                  hasPendingChanges
                    ? `bg-tertiary text-on-tertiary hover:bg-tertiary-container ${
                        hasNoFocusSelected ? "opacity-55" : ""
                      }`
                    : `bg-primary text-on-primary hover:bg-primary-container ${
                        hasNoFocusSelected ? "opacity-55" : ""
                      }`
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isGeneratingVocab ? "animate-spin" : ""
                  }`}
                >
                  {isGeneratingVocab
                    ? "refresh"
                    : hasPendingChanges
                    ? "check"
                    : "refresh"}
                </span>
                {isGeneratingVocab
                  ? "Generating..."
                  : hasPendingChanges
                  ? "Apply changes"
                  : "New Expression"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-body-md text-body-md">{errorMessage}</span>
        </div>
      )}

      {/* Main Translation Card */}
      <section className="max-w-3xl w-full mx-auto">
        <div className="rounded-xl bg-surface-container-lowest p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3 border-b border-surface-container pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                Spanish → English
              </span>
              {vocabItem?.item_type && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm capitalize font-semibold">
                  {vocabItem.item_type}
                </span>
              )}
            </div>
            {vocabItem?.hint && (
              <button
                type="button"
                onClick={() => setShowHint((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">
                  lightbulb
                </span>
                {showHint ? "Hide hint" : "Show hint"}
              </button>
            )}
          </div>

          <div className="space-y-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Translate into English
            </span>
            {isGeneratingVocab ? (
              <div className="py-4 flex items-center gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-primary">
                  progress_activity
                </span>
                <span className="font-body-md text-body-md">
                  Generating a new expression for {selectedCefr}...
                </span>
              </div>
            ) : (
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                {vocabItem?.spanish_text || "Echar una mano"}
              </h2>
            )}
            {showHint && vocabItem?.hint && !isGeneratingVocab && (
              <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low px-3.5 py-2 rounded-lg">
                Hint: {vocabItem.hint}
              </p>
            )}
          </div>

          {/* Input Box OR Evaluation Result */}
          {!isEvaluated ? (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="vocab-translation-input"
                className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider"
              >
                Your English Translation
              </label>
              <textarea
                id="vocab-translation-input"
                rows={2}
                value={translationInput}
                onChange={(e) => onChangeTranslation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (
                      translationInput.trim() &&
                      !isEvaluatingVocab &&
                      !isGeneratingVocab
                    ) {
                      onEvaluateVocab();
                    }
                  }
                }}
                disabled={isGeneratingVocab || isEvaluatingVocab}
                placeholder="Type the English translation here..."
                className="w-full resize-none rounded-xl bg-surface-container-low border border-outline-variant/40 px-4 py-3 font-body-lg text-body-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant/80"
              />
            </div>
          ) : (
            <div className="rounded-xl bg-surface-container-low p-5 flex flex-col gap-4 border border-outline-variant/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg font-bold text-on-surface">
                    {vocabResult.score}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    / 100
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Accuracy:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-label-md text-label-md font-bold uppercase ${accuracyMeta.badge}`}
                  >
                    {accuracyMeta.label}
                  </span>
                </div>
              </div>

              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className={`${accuracyMeta.bar} h-full rounded-full transition-all duration-300`}
                  style={{ width: `${vocabResult.score}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-surface-container-lowest">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    Your Answer
                  </span>
                  <p className="font-body-md text-body-md text-on-surface">
                    {vocabResult.skipped
                      ? "Skipped (I don't know)"
                      : vocabResult.user_translation}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-lowest">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary block mb-1">
                    Natural English
                  </span>
                  <p className="font-body-md text-body-md text-on-surface font-medium">
                    {vocabResult.expected_translation}
                  </p>
                </div>
              </div>

              {vocabResult.feedback && (
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {vocabResult.feedback}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-surface-container">
            <button
              type="button"
              onClick={onDontKnow}
              disabled={isEvaluated || isEvaluatingVocab || isGeneratingVocab}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-lg text-label-lg transition-all ${
                isEvaluated
                  ? "opacity-45 cursor-not-allowed"
                  : "hover:bg-surface-container-high cursor-pointer disabled:opacity-50"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                help_outline
              </span>
              I don&apos;t know
            </button>

            {!isEvaluated ? (
              <button
                type="button"
                onClick={onEvaluateVocab}
                disabled={
                  isEvaluatingVocab ||
                  isGeneratingVocab ||
                  !translationInput.trim()
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 font-label-lg text-label-lg transition-all shadow-sm cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isEvaluatingVocab ? "animate-spin" : ""
                  }`}
                >
                  {isEvaluatingVocab ? "progress_activity" : "check_circle"}
                </span>
                {isEvaluatingVocab ? "Evaluating..." : "Evaluate"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onContinue}
                disabled={isGeneratingVocab}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tertiary text-on-tertiary hover:bg-tertiary-container disabled:opacity-60 font-label-lg text-label-lg transition-all shadow-sm cursor-pointer"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
