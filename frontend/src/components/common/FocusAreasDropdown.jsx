import React, { useEffect, useRef, useState } from "react";
import { CEFR_FOCUS_AREAS } from "../../data/initialData";

export default function FocusAreasDropdown({
  selectedCefr,
  selectedFocusAreas = [],
  onSelectFocusAreas,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const levelFocusOptions = CEFR_FOCUS_AREAS[selectedCefr] || [];
  const isAllSelected =
    levelFocusOptions.length > 0 &&
    levelFocusOptions.every((item) => selectedFocusAreas.includes(item));
  const hasNoneSelected = selectedFocusAreas.length === 0;

  const buttonLabel = isAllSelected
    ? "ALL"
    : hasNoneSelected
    ? "None"
    : selectedFocusAreas.length === 1
    ? selectedFocusAreas[0]
    : `${selectedFocusAreas.length} selected`;

  const handleToggleAll = () => {
    if (isAllSelected) {
      onSelectFocusAreas?.([]);
    } else {
      onSelectFocusAreas?.(levelFocusOptions);
    }
  };

  const handleToggleSingle = (item) => {
    const exists = selectedFocusAreas.includes(item);
    const next = exists
      ? selectedFocusAreas.filter((f) => f !== item)
      : [...selectedFocusAreas, item];
    onSelectFocusAreas?.(next);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[15px] text-primary">
          checklist
        </span>
        <span className="text-on-surface-variant">Focus:</span>
        <span className="font-semibold max-w-[140px] truncate">
          {buttonLabel}
        </span>
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl p-2 z-30 flex flex-col gap-1">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {selectedCefr} Practice Focus
          </div>

          <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-surface-container cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleAll}
              className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
            />
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              ALL ({selectedCefr} skills)
            </span>
          </label>

          <div className="my-1 border-t border-outline-variant/30" />

          {levelFocusOptions.map((item) => {
            const checked = selectedFocusAreas.includes(item);
            return (
              <label
                key={item}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-container cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleSingle(item)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
                <span className="font-body-sm text-body-sm text-on-surface">
                  {item}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
