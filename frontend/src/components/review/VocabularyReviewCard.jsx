import React from "react";

export default function VocabularyReviewCard({ entry }) {
  if (!entry || !entry.evaluation) return null;

  return (
    <div className="mt-8 rounded-xl bg-surface-container-lowest p-6 sm:p-8 shadow-sm flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm uppercase tracking-wider font-bold">
            Vocabulary Practice
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
            CEFR {entry.evaluation.cefr_level || "B1"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-primary/15 text-primary font-label-md text-label-md font-bold uppercase">
            Accuracy: {entry.accuracy || "standard"}
          </span>
          <span className="font-headline-md text-headline-md font-bold text-on-surface">
            {entry.evaluation.score}/100
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          Spanish Prompt
        </span>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">
          {entry.question}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-container-low">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
            Your Translation
          </span>
          <p className="font-body-lg text-body-lg text-on-surface">
            {entry.user_text}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-low">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary block mb-1">
            Natural English
          </span>
          <p className="font-body-lg text-body-lg text-on-surface font-medium">
            {entry.evaluation.enhanced_text}
          </p>
        </div>
      </div>

      {entry.vocabFeedback && (
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {entry.vocabFeedback}
        </p>
      )}
    </div>
  );
}
