import React, { useEffect, useRef, useState } from "react";
import ActionButton from "./common/ActionButton";
import CefrLevelSelector from "./common/CefrLevelSelector";
import ErrorBanner from "./common/ErrorBanner";
import FocusAreasDropdown from "./common/FocusAreasDropdown";
import ToastNotification from "./common/ToastNotification";

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
  const [showHint, setShowHint] = useState(false);
  const focusToastTimerRef = useRef(null);

  const isHintReady =
    !isGeneratingVocab &&
    Boolean(vocabItem?.spanish_text) &&
    Boolean(vocabItem?.hint);

  useEffect(() => {
    setShowHint(false);
  }, [isGeneratingVocab, vocabItem?.spanish_text]);

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

  const hasNoFocusSelected = selectedFocusAreas.length === 0;

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
      <ToastNotification
        visible={focusWarningToast}
        message="Please select at least one focus area to apply changes."
        onClose={() => setFocusWarningToast(false)}
      />

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

              <CefrLevelSelector
                selectedCefr={selectedCefr}
                onSelectCefr={onSelectCefr}
              />

              <FocusAreasDropdown
                selectedCefr={selectedCefr}
                selectedFocusAreas={selectedFocusAreas}
                onSelectFocusAreas={onSelectFocusAreas}
              />
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <ActionButton
                variant={hasPendingChanges ? "tertiary" : "primary"}
                size="md"
                icon={
                  isGeneratingVocab
                    ? "refresh"
                    : hasPendingChanges
                    ? "check"
                    : "refresh"
                }
                iconClassName="text-[16px]"
                spinIcon={isGeneratingVocab}
                dimmed={hasNoFocusSelected}
                disabled={isGeneratingVocab}
                onClick={handleApplyButtonClick}
              >
                {isGeneratingVocab
                  ? "Generating..."
                  : hasPendingChanges
                  ? "Apply changes"
                  : "New Expression"}
              </ActionButton>
            </div>
          </div>
        </div>
      </section>

      <ErrorBanner message={errorMessage} />

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
            <button
              type="button"
              disabled={!isHintReady}
              onClick={() => {
                if (isHintReady) {
                  setShowHint((prev) => !prev);
                }
              }}
              className={`inline-flex items-center gap-1 text-xs font-semibold transition-opacity ${
                isHintReady
                  ? "text-primary hover:underline cursor-pointer"
                  : "text-on-surface-variant opacity-40 cursor-not-allowed"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                lightbulb
              </span>
              {showHint && isHintReady ? "Hide hint" : "Show hint"}
            </button>
          </div>

          <div className="space-y-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Translate into English
            </span>
            {isGeneratingVocab || !vocabItem?.spanish_text ? (
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
                {vocabItem.spanish_text}
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

          {/* Action Buttons using shared ActionButton */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-surface-container">
            <ActionButton
              variant="container"
              size="lg"
              icon="help_outline"
              disabled={isEvaluated || isEvaluatingVocab || isGeneratingVocab}
              dimmed={isEvaluated}
              onClick={onDontKnow}
              className="px-4"
            >
              I don&apos;t know
            </ActionButton>

            {!isEvaluated ? (
              <ActionButton
                variant="primary"
                size="lg"
                icon={isEvaluatingVocab ? "progress_activity" : "check_circle"}
                spinIcon={isEvaluatingVocab}
                disabled={
                  isEvaluatingVocab ||
                  isGeneratingVocab ||
                  !translationInput.trim()
                }
                onClick={onEvaluateVocab}
              >
                {isEvaluatingVocab ? "Evaluating..." : "Evaluate"}
              </ActionButton>
            ) : (
              <ActionButton
                variant="tertiary"
                size="lg"
                icon="arrow_forward"
                iconPosition="right"
                disabled={isGeneratingVocab}
                onClick={onContinue}
              >
                <span>Continue</span>
              </ActionButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
