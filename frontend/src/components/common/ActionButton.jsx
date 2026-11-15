import React from "react";

const VARIANT_CLASSES = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-container shadow-sm",
  tertiary:
    "bg-tertiary text-on-tertiary hover:bg-tertiary-container shadow-sm",
  secondary:
    "bg-secondary text-on-secondary hover:bg-secondary-container shadow-sm",
  surface:
    "bg-surface-container-lowest text-on-surface hover:bg-surface-container shadow-sm",
  container:
    "bg-surface-container text-on-surface hover:bg-surface-container-high",
  highest:
    "bg-surface-container-highest text-on-surface hover:bg-surface-dim",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 font-label-sm text-label-sm gap-1.5",
  md: "px-4 py-2 font-label-md text-label-md gap-1.5",
  lg: "px-5 py-2.5 font-label-lg text-label-lg gap-2",
};

export default function ActionButton({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  spinIcon = false,
  iconClassName = "text-[18px]",
  dimmed = false,
  disabled = false,
  onClick,
  title,
  type = "button",
  className = "",
  children,
}) {
  const variantStyle = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeStyle = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const iconEl = icon ? (
    <span
      className={`material-symbols-outlined ${iconClassName} ${
        spinIcon ? "animate-spin" : ""
      }`}
    >
      {icon}
    </span>
  ) : null;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center rounded-lg transition-all disabled:opacity-55 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } ${dimmed ? "opacity-55" : ""} ${variantStyle} ${sizeStyle} ${className}`}
    >
      {iconPosition === "left" && iconEl}
      {children}
      {iconPosition === "right" && iconEl}
    </button>
  );
}
