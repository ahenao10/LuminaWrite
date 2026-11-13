import React, { useState } from "react";

/**
 * Splits a block of text into plain and highlighted segments based on corrections.
 * Matches character-by-character first, with a case-insensitive fallback.
 */
function buildHighlightedSegments(text, corrections, mode) {
  if (!text) return [{ type: "plain", content: "" }];
  if (!Array.isArray(corrections) || corrections.length === 0) {
    return [{ type: "plain", content: text }];
  }

  const matches = [];
  const occupied = new Array(text.length).fill(false);

  corrections.forEach((corr, index) => {
    const snippet =
      mode === "original" ? corr.original_snippet : corr.corrected_snippet;
    if (!snippet || !snippet.trim()) return;

    // 1. Try exact character-by-character search
    let searchFrom = 0;
    let foundIdx = -1;

    while (searchFrom < text.length) {
      const idx = text.indexOf(snippet, searchFrom);
      if (idx === -1) break;
      const end = idx + snippet.length;
      const overlaps = occupied.slice(idx, end).some(Boolean);
      if (!overlaps) {
        foundIdx = idx;
        break;
      }
      searchFrom = idx + 1;
    }

    // 2. Fallback: case-insensitive search if exact match wasn't found
    if (foundIdx === -1) {
      const lowerText = text.toLowerCase();
      const lowerSnippet = snippet.toLowerCase();
      searchFrom = 0;
      while (searchFrom < lowerText.length) {
        const idx = lowerText.indexOf(lowerSnippet, searchFrom);
        if (idx === -1) break;
        const end = idx + snippet.length;
        const overlaps = occupied.slice(idx, end).some(Boolean);
        if (!overlaps) {
          foundIdx = idx;
          break;
        }
        searchFrom = idx + 1;
      }
    }

    if (foundIdx !== -1) {
      const endIdx = foundIdx + snippet.length;
      for (let i = foundIdx; i < endIdx; i++) {
        occupied[i] = true;
      }
      matches.push({
        start: foundIdx,
        end: endIdx,
        content: text.slice(foundIdx, endIdx),
        correction: corr,
        index,
      });
    }
  });

  if (matches.length === 0) {
    return [{ type: "plain", content: text }];
  }

  matches.sort((a, b) => a.start - b.start);

  const segments = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      segments.push({
        type: "plain",
        content: text.slice(cursor, match.start),
      });
    }
    segments.push({
      type: "highlight",
      content: match.content,
      correction: match.correction,
      index: match.index,
    });
    cursor = match.end;
  }

  if (cursor < text.length) {
    segments.push({
      type: "plain",
      content: text.slice(cursor),
    });
  }

  return segments;
}

export default function SideBySideDiff({
  userText,
  enhancedText,
  corrections = [],
}) {
  const [viewMode, setViewMode] = useState("split"); // 'split' | 'polished' | 'original'
  const [activeIdx, setActiveIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [lastFocusedIdx, setLastFocusedIdx] = useState(null);
  const [copied, setCopied] = useState(false);

  const originalSegments = buildHighlightedSegments(
    userText,
    corrections,
    "original"
  );
  const correctedSegments = buildHighlightedSegments(
    enhancedText,
    corrections,
    "corrected"
  );

  const handleHoverEnter = (idx) => {
    setHoveredIdx(idx);
    setLastFocusedIdx(idx);
  };

  const handleHoverLeave = () => {
    setHoveredIdx(null);
  };

  const handleSelectCorrection = (idx) => {
    setLastFocusedIdx(idx);
    setActiveIdx((prev) => (prev === idx ? null : idx));
  };

  const handleCopyCleanDraft = () => {
    if (!enhancedText) return;
    navigator.clipboard.writeText(enhancedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const focusedIdx = hoveredIdx !== null ? hoveredIdx : activeIdx;
  const isPanelVisible =
    focusedIdx !== null && Boolean(corrections[focusedIdx]);
  const displayIdx = isPanelVisible ? focusedIdx : lastFocusedIdx;
  const displayCorrection =
    displayIdx !== null && corrections[displayIdx]
      ? corrections[displayIdx]
      : null;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
            Interactive Side-by-Side Comparison
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Hover over or click any underlined fragment in red (original) or green (corrected) to inspect the explanation in simple English.
          </p>
        </div>

        {/* Diff Filter Controls */}
        <div className="inline-flex items-center p-1 rounded-lg bg-surface-container-low self-start">
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded font-label-sm text-label-sm transition-all ${
              viewMode === "split"
                ? "bg-surface-container-lowest text-on-surface shadow-xs font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode("polished")}
            className={`px-3 py-1.5 rounded font-label-sm text-label-sm transition-all ${
              viewMode === "polished"
                ? "bg-surface-container-lowest text-on-surface shadow-xs font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Corrected Only
          </button>
          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={`px-3 py-1.5 rounded font-label-sm text-label-sm transition-all ${
              viewMode === "original"
                ? "bg-surface-container-lowest text-on-surface shadow-xs font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Original Only
          </button>
        </div>
      </div>

      {/* Side-by-Side Containers */}
      <div
        className={
          viewMode === "split"
            ? "grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch"
            : "grid grid-cols-1 max-w-4xl mx-auto w-full"
        }
      >
        {/* LEFT COLUMN: Original Text */}
        {(viewMode === "split" || viewMode === "original") && (
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm relative border-t-4 border-error/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[20px]">
                    edit_note
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                    Original Text (Your Draft)
                  </span>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded bg-error-container/50 text-on-error-container font-semibold">
                  {corrections.length}{" "}
                  {corrections.length === 1 ? "Error Highlighted" : "Errors Highlighted"}
                </span>
              </div>

              <div className="prose font-body-xl text-body-xl text-on-surface leading-loose pt-5 whitespace-pre-wrap">
                {originalSegments.map((seg, i) => {
                  if (seg.type === "plain") {
                    return <React.Fragment key={i}>{seg.content}</React.Fragment>;
                  }
                  const isSelected =
                    activeIdx === seg.index || hoveredIdx === seg.index;
                  return (
                    <span
                      key={i}
                      onMouseEnter={() => handleHoverEnter(seg.index)}
                      onMouseLeave={handleHoverLeave}
                      onClick={() => handleSelectCorrection(seg.index)}
                      className={`relative inline group cursor-pointer px-1.5 py-0.5 rounded transition-all bg-error-container/70 text-on-error-container underline decoration-error decoration-wavy decoration-2 underline-offset-4 font-medium ${
                        isSelected
                          ? "ring-2 ring-error shadow-sm bg-error-container"
                          : "hover:bg-error-container"
                      }`}
                    >
                      {seg.content}
                      {/* Floating Tooltip on Hover / Active */}
                      <span
                        className={`pointer-events-none absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl transition-all duration-150 text-left font-body-sm text-body-sm leading-snug ${
                          isSelected
                            ? "opacity-100 translate-y-0 visible"
                            : "opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-white/10">
                          <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-[10px] uppercase tracking-wider font-bold">
                            {seg.correction.category || "Correction"}
                          </span>
                          <span className="font-label-sm text-[11px] text-inverse-primary">
                            Correction #{seg.index + 1}
                          </span>
                        </span>
                        <span className="block mb-1.5 font-label-md text-xs">
                          <span className="line-through text-red-300 mr-1.5">
                            {seg.correction.original_snippet}
                          </span>
                          <span className="text-white/60 mr-1.5">→</span>
                          <span className="text-tertiary-fixed font-bold">
                            {seg.correction.corrected_snippet}
                          </span>
                        </span>
                        <span className="block text-inverse-on-surface/95 font-normal">
                          {seg.correction.explanation}
                        </span>
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error inline-block"></span>
                Red underline = Original error snippet
              </span>
              <span>Submitted Draft</span>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Corrected Text */}
        {(viewMode === "split" || viewMode === "polished") && (
          <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm relative border-t-4 border-tertiary flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">
                    auto_fix_high
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                    Corrected Text (AI Enhanced)
                  </span>
                </div>
                <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-semibold">
                  Polished &amp; Fluent
                </span>
              </div>

              <div className="prose font-body-xl text-body-xl text-on-surface leading-loose pt-5 whitespace-pre-wrap">
                {correctedSegments.map((seg, i) => {
                  if (seg.type === "plain") {
                    return <React.Fragment key={i}>{seg.content}</React.Fragment>;
                  }
                  const isSelected =
                    activeIdx === seg.index || hoveredIdx === seg.index;
                  return (
                    <span
                      key={i}
                      onMouseEnter={() => handleHoverEnter(seg.index)}
                      onMouseLeave={handleHoverLeave}
                      onClick={() => handleSelectCorrection(seg.index)}
                      className={`relative inline group cursor-pointer px-1.5 py-0.5 rounded transition-all bg-tertiary-container/20 text-tertiary underline decoration-tertiary decoration-2 underline-offset-4 font-semibold ${
                        isSelected
                          ? "ring-2 ring-tertiary shadow-sm bg-tertiary-container/35"
                          : "hover:bg-tertiary-container/30"
                      }`}
                    >
                      {seg.content}
                      {/* Floating Tooltip on Hover / Active */}
                      <span
                        className={`pointer-events-none absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl transition-all duration-150 text-left font-body-sm text-body-sm leading-snug ${
                          isSelected
                            ? "opacity-100 translate-y-0 visible"
                            : "opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-white/10">
                          <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[10px] uppercase tracking-wider font-bold">
                            {seg.correction.category || "Enhancement"}
                          </span>
                          <span className="font-label-sm text-[11px] text-inverse-primary">
                            Correction #{seg.index + 1}
                          </span>
                        </span>
                        <span className="block mb-1.5 font-label-md text-xs">
                          <span className="line-through text-red-300 mr-1.5">
                            {seg.correction.original_snippet}
                          </span>
                          <span className="text-white/60 mr-1.5">→</span>
                          <span className="text-tertiary-fixed font-bold">
                            {seg.correction.corrected_snippet}
                          </span>
                        </span>
                        <span className="block text-inverse-on-surface/95 font-normal">
                          {seg.correction.explanation}
                        </span>
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary inline-block"></span>
                Green underline = Corrected expression
              </span>
              <button
                type="button"
                onClick={handleCopyCleanDraft}
                className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied to Clipboard!" : "Copy Clean Draft"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pedagogical Corrections & Linguistic Rationale (Fixed floating panel: zero layout shift, smooth fade/slide) */}
      {corrections.length === 0 ? (
        <div className="mt-4 rounded-xl bg-surface-container-lowest p-6 text-center shadow-sm border border-tertiary/30">
          <span className="material-symbols-outlined text-tertiary text-[32px] mb-2">
            verified
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Flawless Writing!
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            No grammatical or lexical errors were detected in your text.
          </p>
        </div>
      ) : (
        <div
          className={`fixed bottom-6 left-4 right-4 md:left-72 md:right-8 z-50 flex justify-center transition-all duration-300 ease-out ${
            isPanelVisible
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          aria-hidden={!isPanelVisible}
        >
          {displayCorrection && (
            <div
              id={`card-expl-${displayIdx}`}
              className={`w-full max-w-3xl rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl p-5 shadow-[0_20px_50px_rgba(19,27,46,0.16)] border border-outline-variant/40 border-l-4 transition-colors duration-200 ${
                displayCorrection.category?.toLowerCase().includes("grammar")
                  ? "border-l-error"
                  : displayCorrection.category?.toLowerCase().includes("vocab")
                  ? "border-l-secondary-container"
                  : "border-l-primary"
              }`}
            >
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed">
                    <span className="material-symbols-outlined text-[18px]">
                      psychology_alt
                    </span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface text-[1rem] leading-tight">
                      Pedagogical Corrections &amp; Linguistic Rationale
                    </h2>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {displayCorrection.category || "Linguistic Improvement"} •
                      Correction #{displayIdx + 1} of {corrections.length}
                    </span>
                  </div>
                </div>
                {activeIdx !== null && (
                  <button
                    type="button"
                    onClick={() => setActiveIdx(null)}
                    className="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2.5 font-body-md text-body-md">
                <div className="flex items-center gap-2 bg-error-container/40 px-3 py-1.5 rounded-lg text-on-error-container">
                  <span className="material-symbols-outlined text-[16px] text-error">
                    close
                  </span>
                  <span className="line-through font-medium">
                    {displayCorrection.original_snippet}
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/60 text-[18px] rotate-90 sm:rotate-0 self-center">
                  arrow_forward
                </span>
                <div className="flex items-center gap-2 bg-tertiary-container/15 px-3 py-1.5 rounded-lg text-tertiary font-semibold">
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                  <span>{displayCorrection.corrected_snippet}</span>
                </div>
              </div>

              <p className="mt-3 font-body-md text-body-md text-on-surface leading-relaxed">
                <strong>Explanation:</strong> {displayCorrection.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

