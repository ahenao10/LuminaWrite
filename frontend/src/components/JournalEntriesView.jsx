import React, { useState } from "react";

export default function JournalEntriesView({
  entries,
  onSelectEntryForReview,
  onEditEntryInPractice,
  onDeleteEntry,
  onNewWriting,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [activityFilter, setActivityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [inspectedEntry, setInspectedEntry] = useState(null);

  const filteredEntries = entries
    .filter((entry) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        entry.title?.toLowerCase().includes(q) ||
        entry.question?.toLowerCase().includes(q) ||
        entry.topic?.toLowerCase().includes(q);
      const matchesDate =
        dateFilter === "all" ||
        entry.isToday === true ||
        entry.dayOfMonth === new Date().getDate();
      const isVocab = entry.entryType === "vocabulary";
      const hasQuiz = (entry.quizResult?.answered || 0) > 0;
      const matchesActivity =
        activityFilter === "all" ||
        (activityFilter === "writing" && !isVocab) ||
        (activityFilter === "quiz" && hasQuiz) ||
        (activityFilter === "vocabulary" && isVocab);
      const matchesStatus =
        statusFilter === "all" || entry.status === statusFilter;
      const entryCefr = entry.evaluation?.cefr_level || "B1";
      const matchesLevel = levelFilter === "all" || entryCefr === levelFilter;
      return (
        matchesSearch &&
        matchesDate &&
        matchesActivity &&
        matchesStatus &&
        matchesLevel
      );
    })
    .sort((a, b) => {
      if (sortBy === "highest") {
        return (b.evaluation?.score || 0) - (a.evaluation?.score || 0);
      }
      if (sortBy === "words") {
        return (b.words || 0) - (a.words || 0);
      }
      return 0; // newest first (default array order)
    });

  const totalWords = entries.reduce((acc, e) => acc + (e.words || 0), 0);
  const scoredEntries = entries.filter((e) => e.evaluation?.score != null);
  const avgScore =
    scoredEntries.length > 0
      ? Math.round(
          scoredEntries.reduce((acc, e) => acc + e.evaluation.score, 0) /
            scoredEntries.length
        )
      : 0;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Sub-Header & Main Actions */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
              Repository &amp; Portfolio
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Academic Archive
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Writing Journal
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl">
            Manage, refine, review, and export your writing archives alongside longitudinal AI coaching feedback.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onNewWriting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create New Entry
          </button>
        </div>
      </section>

      {/* Top Stats Summary Metric Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm tracking-wider uppercase font-semibold">
              Total Entries
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">
              library_books
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-headline-md font-semibold text-on-surface">
              {entries.length}
            </span>
            <span className="font-label-md text-label-md text-tertiary font-medium">
              Essays archived
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <span className="text-tertiary font-bold">Active</span> in current session
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm tracking-wider uppercase font-semibold">
              Words Written
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">
              stylus_note
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-headline-md font-semibold text-on-surface">
              {totalWords.toLocaleString()}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              total words
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <span>
              Avg{" "}
              {entries.length > 0 ? Math.round(totalWords / entries.length) : 0}{" "}
              words/essay
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm tracking-wider uppercase font-semibold">
              Average Score
            </span>
            <span className="material-symbols-outlined text-tertiary-container text-[20px]">
              workspace_premium
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-md text-headline-md font-semibold text-on-surface">
              {avgScore}
              <span className="text-on-surface-variant text-headline-sm">
                /100
              </span>
            </span>
            <span className="inline-flex px-1.5 py-0.5 rounded bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm font-semibold">
              Verified
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
            <span>Standardized CEFR evaluation</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-label-sm text-label-sm tracking-wider uppercase font-semibold">
              Most Practiced
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              psychology
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
              Opinion &amp; Argument
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Analytical &amp; CEFR Prompts
            </span>
          </div>
          <div
            onClick={onNewWriting}
            className="mt-3 flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold cursor-pointer hover:underline"
          >
            Practice new topic →
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="p-4 rounded-xl bg-surface-container-low shadow-[0_1px_6px_rgba(0,0,0,0.02)] mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/70 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            placeholder="Search entries by title, prompt, or topic..."
            type="text"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter (defaults to Today) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              When:
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-on-surface font-label-md text-label-md font-semibold focus:outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="all">All Dates</option>
            </select>
          </div>

          {/* Activity Type Filter (defaults to ALL) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Type:
            </span>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="bg-transparent text-on-surface font-label-md text-label-md font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">ALL</option>
              <option value="writing">Writing Responses</option>
              <option value="quiz">5-Question Quizzes</option>
              <option value="vocabulary">Vocabulary Practice</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-on-surface font-label-md text-label-md font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* CEFR Level */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              CEFR:
            </span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-transparent text-on-surface font-label-md text-label-md font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-on-surface font-label-md text-label-md font-semibold focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Score</option>
              <option value="words">Word Count</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setDateFilter("today");
              setActivityFilter("all");
              setStatusFilter("all");
              setLevelFilter("all");
              setSortBy("newest");
            }}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <span className="material-symbols-outlined text-[20px]">
              filter_alt_off
            </span>
          </button>
        </div>
      </section>

      {/* Main Content Table Container */}
      <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4">
              <span className="material-symbols-outlined text-[32px]">
                manage_search
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
              No Matching Entries Found
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-4">
              We couldn&apos;t locate any journal logs matching your selected filters or search criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setLevelFilter("all");
              }}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase select-none">
                  <th className="py-3.5 px-6 font-semibold">
                    Essay Title &amp; Writing Prompt
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Date &amp; Level</th>
                  <th className="py-3.5 px-4 font-semibold">Word Count</th>
                  <th className="py-3.5 px-4 font-semibold">AI Score</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-on-surface">
                {filteredEntries.map((entry) => {
                  const score = entry.evaluation?.score;
                  const cefr = entry.evaluation?.cefr_level || "B1";
                  return (
                    <tr
                      key={entry.id}
                      className="group hover:bg-surface-container-low/60 transition-colors"
                    >
                      <td className="py-4 px-6 min-w-[280px]">
                        <div className="flex flex-col">
                          <span
                            onClick={() =>
                              entry.evaluation
                                ? onSelectEntryForReview(entry)
                                : onEditEntryInPractice(entry)
                            }
                            className="font-headline-sm text-headline-sm text-on-surface font-medium hover:text-primary cursor-pointer line-clamp-1"
                          >
                            {entry.title}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 italic mt-0.5">
                            &ldquo;{entry.question}&rdquo;
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-on-primary-fixed-variant bg-primary-fixed font-label-sm text-label-sm">
                              {entry.topic || "General"}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              {entry.promptId || "Session"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">
                            {entry.date}
                          </span>
                          <span className="font-label-sm text-label-sm text-tertiary font-medium">
                            CEFR {cefr} Level
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                            {entry.words}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            words
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          {score != null ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-container/15 text-tertiary font-label-md text-label-md font-bold">
                              <span className="material-symbols-outlined text-[16px]">
                                verified
                              </span>
                              {score}/100
                            </div>
                          ) : (
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              Not evaluated
                            </span>
                          )}
                          {entry.quizResult?.answered > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-[11px] font-semibold">
                              <span className="material-symbols-outlined text-[13px]">
                                quiz
                              </span>
                              Quiz {entry.quizResult.correct}/{entry.quizResult.total}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold ${
                            entry.status === "Reviewed"
                              ? "bg-primary-container/10 text-primary"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              entry.status === "Reviewed"
                                ? "bg-primary"
                                : "bg-outline"
                            }`}
                          ></span>
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {entry.evaluation && (
                            <button
                              type="button"
                              onClick={() => onSelectEntryForReview(entry)}
                              className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                              title="View AI Review"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                visibility
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setInspectedEntry(entry)}
                            className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                            title="Quick Inspect"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              info
                            </span>
                          </button>
                          {entry.status === "Draft" && (
                            <button
                              type="button"
                              onClick={() => onEditEntryInPractice(entry)}
                              className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                              title="Continue Draft in Writing Lab"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                edit
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry.id)}
                            className="p-1.5 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                            title="Delete Entry"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Entry Inspector Drawer */}
      {inspectedEntry && (
        <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-surface-container-lowest shadow-2xl z-50 flex flex-col">
          <div className="p-6 bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                auto_stories
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Entry Inspector
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setInspectedEntry(null)}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Essay Title
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                {inspectedEntry.title}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-surface-container-low text-center">
                <span className="block font-label-sm text-label-sm text-on-surface-variant">
                  Score
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-tertiary">
                  {inspectedEntry.evaluation?.score != null
                    ? `${inspectedEntry.evaluation.score}/100`
                    : "Draft"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low text-center">
                <span className="block font-label-sm text-label-sm text-on-surface-variant">
                  Words
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {inspectedEntry.words}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low text-center">
                <span className="block font-label-sm text-label-sm text-on-surface-variant">
                  Level
                </span>
                <span className="font-headline-sm text-headline-sm font-bold text-secondary">
                  {inspectedEntry.evaluation?.cefr_level || "B1"}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 p-4 rounded-lg bg-surface-container-low">
              <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm font-semibold uppercase">
                <span className="material-symbols-outlined text-[16px]">
                  lightbulb
                </span>{" "}
                Writing Prompt
              </div>
              <p className="font-body-md text-body-md text-on-surface italic">
                &ldquo;{inspectedEntry.question}&rdquo;
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Submitted Text
              </span>
              <p className="p-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md leading-relaxed whitespace-pre-wrap">
                {inspectedEntry.user_text}
              </p>
            </div>
          </div>
          <div className="p-6 bg-surface-container-low flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setInspectedEntry(null)}
              className="px-3.5 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer"
            >
              Close
            </button>
            {inspectedEntry.evaluation && (
              <button
                type="button"
                onClick={() => {
                  onSelectEntryForReview(inspectedEntry);
                  setInspectedEntry(null);
                }}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm cursor-pointer"
              >
                Open Full Review
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

