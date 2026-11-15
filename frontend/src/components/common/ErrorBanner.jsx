import React from "react";

export default function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container flex items-center gap-3 shadow-xs">
      <span className="material-symbols-outlined text-[22px] text-error">
        error
      </span>
      <div className="flex-1 font-body-md text-body-md">
        <strong className="font-semibold">Error: </strong>
        {message}
      </div>
    </div>
  );
}
