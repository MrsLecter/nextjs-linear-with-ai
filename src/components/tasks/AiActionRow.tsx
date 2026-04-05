"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/helpers";

type AiActionRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionIcon: ReactNode;
};

export function AiActionRow({
  className,
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  type = "button",
  ...props
}: AiActionRowProps) {
  return (
    <button
      type={type}
      className={cx(
        "group flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left outline-none transition-[background-color,border-color,color,opacity] duration-150",
        "hover:cursor-pointer hover:bg-slate-900/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30",
        "disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-70",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-200 transition-colors duration-150 group-disabled:text-slate-500">
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-slate-50">{title}</p>
          <p className="text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-blue-200 transition-colors duration-150 group-disabled:text-slate-500">
        {actionIcon}
        <span>{actionLabel}</span>
      </div>
    </button>
  );
}
