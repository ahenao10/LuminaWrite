import React from "react";

export default function ThemeToggleButton({
  isDarkMode,
  onToggle,
  className = "p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all cursor-pointer shrink-0",
  iconClassName = "text-[20px] block",
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      title={isDarkMode ? "Light mode" : "Dark mode"}
      className={className}
    >
      <span className={`material-symbols-outlined ${iconClassName}`}>
        {isDarkMode ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
