import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/helpers";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cx(
        "h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition-colors duration-150 placeholder:text-slate-500 hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25",
        className,
      )}
      {...props}
    />
  );
}
