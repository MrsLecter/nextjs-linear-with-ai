import { CalendarArrowDown, CalendarArrowUp, Plus } from "lucide-react";
import { TaskPriority, TaskStatus } from "#prisma/browser";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  type TaskDateSortDirection,
} from "@/lib/constants/task.constants";
import { cx } from "@/lib/helpers";
import { getStatusMeta } from "@/lib/utils/task.utils";

type TaskToolbarProps = {
  activeStatus: TaskStatus | null;
  prioritySort: TaskPriority;
  dateSort: TaskDateSortDirection;
  onCreate: () => void;
  onStatusChange: (status: TaskStatus | null) => void;
  onSortChange: (priority: TaskPriority) => void;
  onDateSortToggle: () => void;
};

export function TaskToolbar({
  activeStatus,
  prioritySort,
  dateSort,
  onCreate,
  onStatusChange,
  onSortChange,
  onDateSortToggle,
}: TaskToolbarProps) {
  const DateSortIcon =
    dateSort === "desc" ? CalendarArrowDown : CalendarArrowUp;
  const segmentedGroupClass =
    "inline-flex w-full flex-wrap items-stretch overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:w-auto";
  const statusGroupClass =
    "flex w-full flex-col items-stretch overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:inline-flex sm:w-auto sm:flex-row sm:flex-wrap";
  const segmentedButtonClass =
    "relative inline-flex min-h-10 flex-1 items-center justify-center gap-2 border-r border-slate-700/80 px-3 text-sm font-medium text-slate-300 transition-[color,background-color,border-color] duration-150 hover:cursor-pointer hover:bg-slate-900 hover:text-slate-50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 sm:h-9 sm:min-h-0 sm:flex-none";
  const activeSegmentClass =
    "z-[1] bg-blue-500/15 text-blue-100 hover:bg-blue-500/15 hover:text-blue-100";
  const statusSegmentBaseClass =
    "w-full rounded-none border-b border-r-0 border-slate-700/80 sm:w-auto sm:border-b-0";

  return (
    <Card className="border-slate-800/95 bg-slate-900/60 px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          className="w-full justify-center sm:w-auto"
          leadingIcon={<Plus className="size-4" />}
          onClick={onCreate}
        >
          New Task
        </Button>

        <div
          aria-label="Filter tasks by status"
          className={statusGroupClass}
          role="group"
        >
          <button
            aria-pressed={activeStatus === null}
            className={cx(
              segmentedButtonClass,
              statusSegmentBaseClass,
              "rounded-t-xl sm:rounded-l-xl sm:rounded-r-none sm:border-r",
              activeStatus === null && activeSegmentClass,
            )}
            onClick={() => onStatusChange(null)}
            type="button"
          >
            All
          </button>
          {STATUS_OPTIONS.map((option, index) => {
            const Icon = getStatusMeta(option.value).icon;
            const isActive = activeStatus === option.value;
            const isLast = index === STATUS_OPTIONS.length - 1;

            return (
              <button
                key={option.value}
                aria-pressed={isActive}
                className={cx(
                  segmentedButtonClass,
                  statusSegmentBaseClass,
                  isLast
                    ? "rounded-b-xl border-b-0 sm:rounded-r-xl sm:rounded-l-none sm:border-r-0"
                    : "sm:border-r",
                  isActive && activeSegmentClass,
                )}
                onClick={() => onStatusChange(option.value)}
                type="button"
              >
                <Icon className="size-4" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex w-full items-center justify-start sm:ml-auto sm:w-auto sm:min-w-[160px] sm:flex-1 sm:justify-end">
          <div
            aria-label="Sort tasks"
            className={segmentedGroupClass}
            role="group"
          >
            {PRIORITY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = prioritySort === option.value;
              const isFirstPriority =
                option.value === PRIORITY_OPTIONS.at(0)?.value;
              const isLastPriority = option.value === PRIORITY_OPTIONS.at(-1)?.value;

              return (
                <Tooltip
                  key={option.value}
                  className={cx(
                    "flex-1",
                    isLastPriority ? "" : "border-r border-slate-700/80",
                    "sm:flex-none",
                  )}
                  content={`Sort by ${option.label.toLowerCase()} priority`}
                >
                  <button
                    aria-label={`Sort by ${option.label.toLowerCase()} priority`}
                    aria-pressed={isActive}
                    className={cx(
                      segmentedButtonClass,
                      isFirstPriority && "rounded-l-xl",
                      "border-r-0",
                      isActive && activeSegmentClass,
                    )}
                    onClick={() => onSortChange(option.value)}
                    type="button"
                  >
                    <Icon className="size-4" />
                  </button>
                </Tooltip>
              );
            })}
            <Tooltip
              className="flex-1 sm:flex-none"
              content={
                dateSort === "desc"
                  ? "Newest tasks first"
                  : "Oldest tasks first"
              }
            >
              <button
                aria-label={
                  dateSort === "desc"
                    ? "Sort by date descending"
                    : "Sort by date ascending"
                }
                className={cx(
                  segmentedButtonClass,
                  "rounded-r-xl border-l border-slate-700/80 border-r-0 text-slate-200",
                )}
                onClick={onDateSortToggle}
                type="button"
              >
                <DateSortIcon className="size-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </Card>
  );
}
