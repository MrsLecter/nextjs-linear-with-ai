import { Trash2, Triangle } from "lucide-react";
import { TaskStatus } from "#prisma/browser";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { cx } from "@/lib/helpers";
import { TASK_WORK_TYPE_LABELS } from "@/lib/constants/task-work-type.constants";
import type { TaskWithParent } from "@/lib/types/task.types";
import { getPriorityMeta, getStatusMeta } from "@/lib/utils/task.utils";

type TaskCardProps = {
  task: TaskWithParent;
  onEdit: (task: TaskWithParent) => void;
  onDelete: (task: TaskWithParent) => void;
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const status = getStatusMeta(task.status);
  const priority = getPriorityMeta(task.priority);
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;
  const estimation = task.estimation;
  const taskTypeLabel = TASK_WORK_TYPE_LABELS[task.type];
  const createdAtLabel = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(task.createdAt));

  return (
    <div className="group flex items-center gap-3 bg-slate-950/10 px-5 py-4 transition-[background-color,border-color] duration-150 hover:bg-slate-900/70 focus-within:bg-slate-900/70">
      <button
        aria-label={`Edit ${task.title}`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left outline-none hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30"
        onClick={() => onEdit(task)}
        type="button"
      >
        <Tooltip content={`Status: ${status.label}`}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-950/90">
            <StatusIcon
              aria-hidden="true"
              className={cx(
                "size-4",
                task.status === TaskStatus.DONE
                  ? "text-emerald-300"
                  : task.status === TaskStatus.IN_PROGRESS
                    ? "text-blue-300"
                    : "text-slate-400",
              )}
            />
          </div>
        </Tooltip>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                <span className="truncate">Task ID: {task.id}</span>
                {task.parentTaskId ? <span>• Subtask</span> : null}
                <Tooltip content={`Type: ${taskTypeLabel}`}>
                  <span className="inline-flex items-center text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
                    <span className="mr-2">●</span>
                    {taskTypeLabel}
                  </span>
                </Tooltip>
              </div>
              <div className="truncate text-sm font-semibold text-slate-50">
                {task.title}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs font-medium">
              {estimation !== null && estimation !== undefined ? (
                <Tooltip content={`Estimate: ${estimation}`}>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-slate-950/90 px-2 py-1 text-slate-300">
                    <Triangle
                      aria-hidden="true"
                      className="size-3.5 shrink-0 fill-current text-slate-400"
                    />
                    <span>{estimation}</span>
                  </span>
                </Tooltip>
              ) : null}
              <Tooltip content={`${priority.label} priority`}>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/80 bg-slate-950/90 px-2 py-1 text-slate-300">
                  <PriorityIcon
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-slate-400"
                  />
                </span>
              </Tooltip>
              <Tooltip content={`Created on ${createdAtLabel}`}>
                <span className="w-16 text-center rounded-md border border-slate-700/80 bg-slate-950/90 px-2 py-1 text-slate-400">
                  {createdAtLabel}
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
      </button>
      <Tooltip content={`Delete task`}>
        <Button
          aria-label={`Delete task`}
          className="shrink-0 opacity-55 transition-[opacity,background-color,border-color,color] duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
          onClick={() => onDelete(task)}
          size="icon"
          variant="danger"
        >
          <Trash2 className="size-4" />
        </Button>
      </Tooltip>
    </div>
  );
}
