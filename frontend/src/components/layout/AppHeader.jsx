import React from "react";
import ActionButton from "../common/ActionButton";
import ThemeToggleButton from "../common/ThemeToggleButton";

const MOBILE_NAV_ITEMS = [
  { id: "daily-practice", label: "Practice", icon: "edit_square" },
  { id: "vocabulary-practice", label: "Vocabulary", icon: "translate" },
  { id: "session-review", label: "Review", icon: "fact_check" },
  { id: "journal-entries", label: "Journal", icon: "book_2" },
  {
    id: "calendar-and-progress",
    label: "Calendar & Progress",
    icon: "calendar_month",
  },
];

export default function AppHeader({
  activeTab,
  onSelectTab,
  uniqueDaysLogged = 0,
  currentCefrObj,
  displayUserLabel,
  onStartNewWriting,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
}) {
  return (
    <>
      <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl z-40 pl-4 pr-16 md:px-4 lg:px-gutter-lg flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-surface-container text-on-surface shrink-0">
            <span className="text-sm sm:text-base leading-none">🔥</span>
            <span className="font-label-md text-xs sm:text-label-md font-semibold">
              {uniqueDaysLogged} {uniqueDaysLogged === 1 ? "Day" : "Days"}
              <span className="hidden sm:inline"> Streak</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-tertiary-container/15 text-tertiary min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>
            <span className="font-label-md text-xs sm:text-label-md font-semibold truncate">
              <span className="sm:hidden">{currentCefrObj.code}</span>
              <span className="hidden sm:inline">{currentCefrObj.label}</span>
            </span>
          </div>
          <span className="hidden xl:inline-block font-label-sm text-label-sm text-on-surface-variant">
            {displayUserLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "calendar-and-progress" && (
            <ActionButton
              variant="primary"
              size="md"
              icon="add"
              onClick={onStartNewWriting}
              className="px-3 sm:px-4"
            >
              <span className="font-label-lg text-label-lg hidden sm:inline">
                New Writing
              </span>
            </ActionButton>
          )}
        </div>
      </header>

      {/* Mobile Floating Top-Right Navigation Menu */}
      <div className="md:hidden">
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={onCloseMobileMenu}
            aria-hidden="true"
          />
        )}

        <div className="fixed top-3 right-3 z-50 flex flex-col items-end">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open navigation menu"
            aria-expanded={isMobileMenuOpen}
            className="w-10 h-10 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:bg-primary-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>

          {isMobileMenuOpen && (
            <div className="mt-2 w-56 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl p-2 flex flex-col gap-1">
              {MOBILE_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobileMenu();
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-on-primary font-semibold"
                        : "text-on-surface hover:bg-surface-container-high"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}

              <div className="my-1 border-t border-outline-variant/30" />

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onCloseMobileMenu();
                    onSignOut();
                  }}
                  className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  <span>Sign Out</span>
                </button>
                <ThemeToggleButton
                  isDarkMode={isDarkMode}
                  onToggle={onToggleDarkMode}
                  className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                  iconClassName="text-[18px] block"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
