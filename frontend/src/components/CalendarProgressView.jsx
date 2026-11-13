import React, { useState } from "react";

export default function CalendarProgressView({
  entries = [],
  currentCefr = "B1",
  onSelectEntryForReview,
  onStartWriting,
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayDate = now.getDate();
  const monthLabel = now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const [selectedDay, setSelectedDay] = useState(todayDate);

  // Compute real stats starting from 0
  const totalWords = entries.reduce((acc, e) => acc + (e.words || 0), 0);
  const reviewedEntries = entries.filter((e) => e.evaluation != null);

  // Group all entries by dayOfMonth
  const entriesByDay = {};
  entries.forEach((entry) => {
    const day = entry.dayOfMonth;
    if (day) {
      if (!entriesByDay[day]) entriesByDay[day] = { items: [], words: 0 };
      entriesByDay[day].items.push(entry);
      entriesByDay[day].words += entry.words || 0;
    }
  });

  const activeDaysLogged = Object.keys(entriesByDay).length;
  const activeStreak = activeDaysLogged > 0 ? activeDaysLogged : 0;
  const monthlyTarget = 25;
  const monthlyPercent = Math.min(
    100,
    Math.round((activeDaysLogged / monthlyTarget) * 100)
  );
  const cefrProgress = (() => {
    const scoresByDay = {};
    reviewedEntries.forEach((entry) => {
      const score = entry.evaluation?.score;
      if (entry.dayOfMonth && typeof score === "number") {
        if (!scoresByDay[entry.dayOfMonth]) {
          scoresByDay[entry.dayOfMonth] = { sum: 0, count: 0 };
        }
        scoresByDay[entry.dayOfMonth].sum += score;
        scoresByDay[entry.dayOfMonth].count += 1;
      }
    });

    const sortedDays = Object.keys(scoresByDay)
      .map(Number)
      .sort((a, b) => a - b);

    if (sortedDays.length === 0) {
      return {
        percent: 0,
        state: "empty",
        label: "No data yet",
        detail: "Complete your first writing check",
        barClass: "bg-surface-container-highest",
        badgeClass: "bg-surface-container text-on-surface-variant",
        textClass: "text-on-surface-variant",
        icon: "trending_flat",
      };
    }

    const dayAverages = sortedDays.map(
      (day) => scoresByDay[day].sum / scoresByDay[day].count
    );
    const latestAvg = dayAverages[dayAverages.length - 1];

    // Exponentially Weighted Moving Average (alpha = 0.45) across days:
    // rewards consistent day-over-day growth and drops objectively when scores fall.
    const alpha = 0.45;
    let ewma = dayAverages[0];
    for (let i = 1; i < dayAverages.length; i += 1) {
      ewma = alpha * dayAverages[i] + (1 - alpha) * ewma;
    }
    const percent = Math.min(100, Math.max(0, Math.round(ewma)));

    if (dayAverages.length === 1) {
      return {
        percent,
        state: "baseline",
        label: "Day 1 baseline",
        detail: `Avg ${Math.round(latestAvg)}/100 • Practice another day to compare`,
        barClass: "bg-primary",
        badgeClass: "bg-primary/10 text-primary",
        textClass: "text-primary",
        icon: "flag",
      };
    }

    const previousDays = dayAverages.slice(0, -1);
    const previousMean =
      previousDays.reduce((acc, val) => acc + val, 0) / previousDays.length;
    const delta = Math.round(latestAvg - previousMean);
    const priorAvgRounded = Math.round(previousMean);

    if (delta >= 2) {
      return {
        percent,
        state: "improving",
        label: "Improving",
        detail: `+${delta} pts vs prior avg (${priorAvgRounded})`,
        barClass: "bg-tertiary",
        badgeClass: "bg-tertiary/10 text-tertiary",
        textClass: "text-tertiary",
        icon: "trending_up",
      };
    }

    if (delta > -2) {
      return {
        percent,
        state: "steady",
        label: "Steady",
        detail: `Close to prior avg (${priorAvgRounded})`,
        barClass: "bg-primary",
        badgeClass: "bg-primary/10 text-primary",
        textClass: "text-primary",
        icon: "trending_flat",
      };
    }

    return {
      percent,
      state: "declining",
      label: "Declining",
      detail: `${delta} pts vs prior avg (${priorAvgRounded})`,
      barClass: "bg-amber-500",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      textClass: "text-amber-700 dark:text-amber-300",
      icon: "trending_down",
    };
  })();

  const calendarDays = Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const isToday = day === todayDate;
    const dayData = entriesByDay[day] || null;
    return {
      day,
      isToday,
      isCompleted: Boolean(dayData),
      count: dayData ? dayData.items.length : 0,
      words: dayData ? dayData.words : 0,
    };
  });

  const selectedDayEntries = entriesByDay[selectedDay]?.items || [];

  return (
    <div className="flex flex-col w-full pb-16 pt-4">
      {/* Top Intro & Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Practice History &amp; Progress
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Progress &amp; Writing Calendar
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            See your daily practice streak, total words written, and all exercises saved on each day.
          </p>
        </div>
      </div>

      {/* Top KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Active Streak */}
        <div className="relative overflow-hidden p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Active Streak
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  {activeStreak}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant font-medium">
                  {activeStreak === 1 ? "Day" : "Days"}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
              <span className="text-xl">🔥</span>
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant bg-surface-container-low/50 -mx-5 -mb-5 px-5 py-3">
            <span className="font-label-sm text-label-sm">
              Best Record:{" "}
              <strong className="text-on-surface font-semibold">
                {activeStreak} {activeStreak === 1 ? "day" : "days"}
              </strong>
            </span>
            <span className="inline-flex items-center text-on-surface-variant font-label-sm text-label-sm font-semibold">
              {activeStreak > 0 ? "Active" : "Not started"}
            </span>
          </div>
        </div>

        {/* Monthly Goal Progress */}
        <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Monthly Target
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  {activeDaysLogged}
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                  / {monthlyTarget}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant ml-1">
                  Days
                </span>
              </div>
            </div>
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container-high"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-primary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${monthlyPercent}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute font-label-sm text-label-sm font-bold text-on-surface">
                {monthlyPercent}%
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant bg-surface-container-low/50 -mx-5 -mb-5 px-5 py-3">
            <span className="font-label-sm text-label-sm">
              {Math.max(0, monthlyTarget - activeDaysLogged)} days remaining
            </span>
            <span className="font-label-sm text-label-sm text-primary font-semibold">
              {activeDaysLogged > 0 ? "In Progress" : "Start Today"}
            </span>
          </div>
        </div>

        {/* Total Words Logged */}
        <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Total Words
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  {totalWords.toLocaleString()}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                  words
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-tertiary-container/15 flex items-center justify-center text-tertiary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                stylus_note
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant bg-surface-container-low/50 -mx-5 -mb-5 px-5 py-3">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
              {entries.length}{" "}
              {entries.length === 1 ? "exercise" : "exercises"} saved
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Writing Lab
            </span>
          </div>
        </div>

        {/* Target CEFR Level */}
        <div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Target Level
              </span>
              <div className="flex items-center gap-2">
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  {currentCefr}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary uppercase">
                  CEFR Goal
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                school
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 space-y-1.5 bg-surface-container-low/50 -mx-5 -mb-5 px-5 py-3">
            <div className="flex items-center justify-between gap-2 font-label-sm text-label-sm">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cefrProgress.badgeClass}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {cefrProgress.icon}
                </span>
                {cefrProgress.label}
              </span>
              <span className={`font-semibold ${cefrProgress.textClass}`}>
                {cefrProgress.percent}%
              </span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div
                className={`${cefrProgress.barClass} h-full rounded-full transition-all duration-300`}
                style={{ width: `${cefrProgress.percent}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              {cefrProgress.detail}
            </p>
          </div>
        </div>
      </div>

      {/* Center Workspace Split: Calendar (8 cols) + Selected Day Exercises (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-3">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                {monthLabel}
              </h2>
              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                {activeDaysLogged} {activeDaysLogged === 1 ? "Day" : "Days"} Logged
              </span>
            </div>
            <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary"></span>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-surface-container-high"></span>
                <span>No Entry</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span
                key={d}
                className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider py-1"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell) => {
              const isSelected = cell.day === selectedDay;
              return (
                <button
                  key={cell.day}
                  type="button"
                  onClick={() => setSelectedDay(cell.day)}
                  className={`h-20 p-2 rounded-lg flex flex-col justify-between text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary-fixed/40 ring-2 ring-primary"
                      : cell.isToday
                      ? "bg-surface-container ring-2 ring-primary/50"
                      : cell.isCompleted
                      ? "bg-surface-container-low hover:bg-surface-container"
                      : "bg-surface-container-low/40 hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span
                      className={`font-label-sm text-label-sm font-semibold ${
                        cell.isToday || isSelected
                          ? "text-primary font-bold"
                          : "text-on-surface"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.isToday && (
                      <span className="px-1 py-0.5 rounded bg-primary text-on-primary text-[8px] font-bold uppercase">
                        Today
                      </span>
                    )}
                    {!cell.isToday && cell.isCompleted && (
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    )}
                  </div>
                  {cell.isCompleted ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-label-sm text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-[10px]">
                          check
                        </span>{" "}
                        {cell.count} {cell.count === 1 ? "task" : "tasks"}
                      </span>
                      <span className="font-label-sm text-[10px] text-on-surface-variant pl-1">
                        {cell.words}w
                      </span>
                    </div>
                  ) : (
                    <span className="font-label-sm text-[10px] text-on-surface-variant/50">
                      No entry
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Exercises List (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {selectedDayEntries.length > 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Day {selectedDay} Summary
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {selectedDayEntries.length}{" "}
                    {selectedDayEntries.length === 1 ? "Exercise" : "Exercises"} Saved
                  </h3>
                </div>
              </div>

              <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                {selectedDayEntries.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                        {item.title}
                      </span>
                      {item.evaluation?.score != null ? (
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-label-sm font-bold shrink-0">
                          {item.evaluation.score}/100
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm shrink-0">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 italic">
                      &ldquo;{item.question}&rdquo;
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {item.words} words • {item.evaluation?.cefr_level || "Draft"}
                      </span>
                      {item.evaluation && (
                        <button
                          type="button"
                          onClick={() => onSelectEntryForReview(item)}
                          className="text-primary hover:underline font-label-sm text-label-sm font-semibold cursor-pointer"
                        >
                          Open Review →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col justify-between text-center">
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">
                    calendar_today
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  No Exercises on Day {selectedDay}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Complete a writing prompt in Daily Practice to save your answer and feedback to this day.
                </p>
              </div>
              <button
                type="button"
                onClick={onStartWriting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  edit_note
                </span>
                <span>Start Writing</span>
              </button>
            </div>
          )}

          <div className="p-5 rounded-xl bg-gradient-to-br from-primary to-secondary text-on-primary shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">
                psychology
              </span>
            </div>
            <div className="space-y-0.5">
              <h4 className="font-label-lg text-label-lg font-bold">
                Practice Every Day
              </h4>
              <p className="font-body-sm text-body-sm text-on-primary/80">
                Write short answers daily and check your red and green corrections to build confidence in English.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
