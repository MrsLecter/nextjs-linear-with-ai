"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/helpers";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-blue-500 bg-blue-500 text-slate-950 shadow-[0_0_0_1px_rgba(96,165,250,0.15)] hover:border-blue-400 hover:bg-blue-400 focus-visible:border-blue-300",
  secondary:
    "border-slate-700/90 bg-slate-900 text-slate-100 hover:border-slate-600 hover:bg-slate-800 focus-visible:border-blue-400",
  ghost:
    "border-slate-700/70 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 focus-visible:border-blue-400",
  danger:
    "border-slate-700/70 bg-slate-900/70 text-slate-400 hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-200 focus-visible:border-blue-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-3.5 text-sm",
  icon: "h-8 w-8 justify-center p-0",
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  leadingIcon,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center gap-2 rounded-lg border font-medium transition-[color,background-color,border-color,opacity] duration-150 outline-none hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:pointer-events-none disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500 disabled:opacity-100",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {children}
    </button>
  );
}
