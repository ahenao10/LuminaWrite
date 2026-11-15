import React from "react";
import ThemeToggleButton from "../common/ThemeToggleButton";

const SIDEBAR_ITEMS = [
  { id: "daily-practice", label: "Daily Practice", icon: "edit_note" },
  { id: "vocabulary-practice", label: "Vocabulary", icon: "translate" },
  { id: "session-review", label: "Session Review", icon: "rate_review" },
  { id: "journal-entries", label: "Journal Entries", icon: "menu_book" },
  {
    id: "calendar-and-progress",
    label: "Calendar & Progress",
    icon: "calendar_month",
  },
];

export default function AppSidebar({
  activeTab,
  onSelectTab,
  latestEvaluationScore,
  journalCount = 0,
  uniqueDaysLogged = 0,
  goalProgressPercent = 0,
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
}) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 hidden md:flex flex-col justify-between py-6 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div
          onClick={() => onSelectTab("daily-practice")}
          className="flex items-center gap-3 px-3 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px]">
              edit_note
            </span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
            Lumina Write
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                  isActive
                    ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span className="font-label-lg text-label-lg">
                    {item.label}
                  </span>
                </span>
                {item.id === "session-review" && latestEvaluationScore != null && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-tertiary text-on-tertiary">
                    {latestEvaluationScore}
                  </span>
                )}
                {item.id === "journal-entries" && (
                  <span className="font-label-sm text-label-sm opacity-75">
                    {journalCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Writing Goal Card & Sign Out */}
      <div className="flex flex-col gap-3 px-2">
        <div className="p-3.5 rounded-xl bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Writing Goal
            </span>
            <span className="font-label-sm text-label-sm text-primary font-bold">
              {Math.min(5, uniqueDaysLogged)}/5 Days
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${goalProgressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSignOut}
            className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-label-md text-label-md">Sign Out</span>
          </button>
          <ThemeToggleButton
            isDarkMode={isDarkMode}
            onToggle={onToggleDarkMode}
          />
        </div>
      </div>
    </aside>
  );
}
