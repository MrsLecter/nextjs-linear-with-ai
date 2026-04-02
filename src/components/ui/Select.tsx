import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/helpers";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cx(
          "h-10 w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 pr-9 text-sm text-slate-100 outline-none transition-colors duration-150 hover:border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}
