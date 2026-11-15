import React from "react";
import { CEFR_LEVELS } from "../../data/initialData";

export default function CefrLevelSelector({ selectedCefr, onSelectCefr }) {
  return (
    <div className="inline-flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
      <span className="font-label-sm text-label-sm text-on-surface-variant px-2 flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px] text-primary">
          school
        </span>
        CEFR:
      </span>
      {CEFR_LEVELS.map((lvl) => (
        <button
          key={lvl.code}
          type="button"
          onClick={() => onSelectCefr(lvl.code)}
          className={`px-2.5 py-1 rounded font-label-sm text-label-sm transition-all cursor-pointer ${
            selectedCefr === lvl.code
              ? "bg-primary text-on-primary font-bold shadow-xs"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
          title={lvl.label}
        >
          {lvl.code}
        </button>
      ))}
    </div>
  );
}
