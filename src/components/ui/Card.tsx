import type { HTMLAttributes } from "react";
import { cx } from "@/lib/helpers";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-xl border border-slate-800/90 bg-slate-900/55 shadow-[0_0_0_1px_rgba(148,163,184,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
