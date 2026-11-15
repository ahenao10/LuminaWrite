import React from "react";

export default function ToastNotification({
  visible,
  message,
  onClose,
  icon = "warning",
}) {
  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-20 right-4 sm:right-6 z-50 bg-surface-container-lowest border border-amber-500/40 text-on-surface rounded-xl shadow-xl px-4 py-3 pr-9 flex items-center gap-2.5"
    >
      <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 shrink-0">
        {icon}
      </span>
      <span className="font-body-sm text-body-sm whitespace-nowrap">
        {message}
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="absolute top-1.5 right-1.5 p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
      >
        <span className="material-symbols-outlined text-[15px] block">
          close
        </span>
      </button>
    </div>
  );
}
