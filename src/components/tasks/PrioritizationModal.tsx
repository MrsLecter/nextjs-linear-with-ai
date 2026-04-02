"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Bot,
  CornerDownRight,
  Sparkles,
} from "lucide-react";
import type { Task } from "#prisma/browser";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  usePrioritization,
  type PrioritizationData,
} from "@/hooks/use-prioritization";
import { cx } from "@/lib/helpers";
import { getPrioritizationTasksSignature } from "@/lib/utils/prioritization-cache";

type PrioritizationModalProps = {
  open: boolean;
  tasks: Task[];
  onClose: () => void;
  onOpenTask?: (task: Task) => void;
};

function LoadingState() {
  return (
    <div aria-live="polite" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10 text-blue-200">
          <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-50">
            Analyzing your tasks...
          </p>
          <p className="text-sm text-slate-400">
            Comparing priority, status, and queue age.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="h-3 w-28 animate-pulse rounded-full bg-slate-800" />
        <div className="h-6 w-3/4 animate-pulse rounded-full bg-slate-800/90" />
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-800/80" />
          <div className="h-3 w-[92%] animate-pulse rounded-full bg-slate-800/80" />
          <div className="h-3 w-[74%] animate-pulse rounded-full bg-slate-800/80" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-slate-300">
        <Bot className="size-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-50">
          No recommendation available
        </h3>
        <p className="text-sm leading-6 text-slate-400">
          No open tasks to prioritize.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="space-y-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200">
        <Sparkles className="size-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-50">
          Could not generate recommendation
        </h3>
        <p className="text-sm leading-6 text-slate-400">{message}</p>
      </div>
    </div>
  );
}

function SuccessState({
  data,
  tasks,
  onOpenTask,
}: {
  data: Exclude<PrioritizationData, null>;
  tasks: Task[];
  onOpenTask?: (task: Task) => void;
}) {
  const tasksById = new Map(tasks.map((task) => [String(task.id), task]));
  const primaryTask = tasksById.get(data.primaryTaskId) ?? null;
  const alternatives = data.alternatives
    .map((alternative) => ({
      ...alternative,
      task: tasksById.get(alternative.taskId) ?? null,
    }))
    .slice(0, 2);
  const possiblePrerequisites = data.possiblePrerequisites
    .map((prerequisite) => ({
      ...prerequisite,
      task: tasksById.get(prerequisite.taskId) ?? null,
    }))
    .slice(0, 1);

  const getTaskLabel = (
    taskId: string,
    task: Task | null,
    fallbackTitle?: string,
  ) => {
    const title = task?.title?.trim() || fallbackTitle?.trim();

    return title && title.length > 0 ? title : `Task #${taskId}`;
  };

  return (
    <div aria-live="polite" className="space-y-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium tracking-[0.02em] text-blue-100">
        <Sparkles className="size-3.5" />
        AI priority suggestion
      </div>

      <TaskCard
        borderClassName="border-blue-500/20"
        className="space-y-5 bg-slate-900/80 shadow-[0_0_0_1px_rgba(96,165,250,0.08)]"
        hint={primaryTask && onOpenTask ? "Open task" : undefined}
        onClick={primaryTask && onOpenTask ? () => onOpenTask(primaryTask) : undefined}
        title={getTaskLabel(data.primaryTaskId, primaryTask, data.primaryTaskTitle)}
      >
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Recommended next task
          </p>
          <p className="mb-4 text-sm text-slate-400">Task ID: {data.primaryTaskId}</p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Explanation
          </p>
          <p className="mt-3 break-words text-sm leading-7 text-slate-300">
            {data.explanation}
          </p>
        </div>
      </TaskCard>

      {alternatives.length > 0 ? (
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Alternatives
            </p>
            <p className="text-sm leading-6 text-slate-400">
              Strong backup options if the primary recommendation is blocked.
            </p>
          </div>

          <div className="space-y-4">
            {alternatives.map((alternative) => (
              <TaskCard
                hint={alternative.task && onOpenTask ? "Open task" : undefined}
                key={alternative.taskId}
                onClick={
                  alternative.task && onOpenTask
                    ? () => onOpenTask(alternative.task)
                    : undefined
                }
                title={getTaskLabel(alternative.taskId, alternative.task)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300">
                    <CornerDownRight className="size-4" />
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">
                        Task ID: {alternative.taskId}
                      </p>
                    </div>
                    <p className="break-words text-sm leading-7 text-slate-400">
                      {alternative.whyNotFirst}
                    </p>
                  </div>
                </div>
              </TaskCard>
            ))}
          </div>
        </section>
      ) : null}

      {possiblePrerequisites.length > 0 ? (
        <section className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-200">
              <AlertCircle className="size-4" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-100/80">
                Possible prerequisite
              </p>
              <p className="text-sm leading-6 text-slate-300">
                This is presented as a tentative dependency, not a confirmed
                requirement.
              </p>
            </div>
          </div>

          {possiblePrerequisites.map((prerequisite) => (
            <TaskCard
              borderClassName="border-amber-500/15"
              hint={prerequisite.task && onOpenTask ? "Open task" : undefined}
              key={prerequisite.taskId}
              onClick={
                prerequisite.task && onOpenTask
                  ? () => onOpenTask(prerequisite.task)
                  : undefined
              }
              title={getTaskLabel(prerequisite.taskId, prerequisite.task)}
            >
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  Task ID: {prerequisite.taskId}
                </p>
              </div>
              <p className="mt-3 break-words text-sm leading-7 text-slate-300">
                {prerequisite.reason}
              </p>
            </TaskCard>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function TaskCard({
  children,
  title,
  onClick,
  hint,
  borderClassName,
  className,
}: {
  children: ReactNode;
  title: string;
  onClick?: () => void;
  hint?: string;
  borderClassName?: string;
  className?: string;
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={cx(
        "rounded-2xl border bg-slate-950/50 p-4 text-left sm:p-5",
        borderClassName ?? "border-slate-800/80",
        className,
        onClick
          ? "w-full cursor-pointer transition-colors duration-150 hover:border-slate-700 hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          : "",
      )}
      {...(onClick ? { onClick, type: "button" as const } : {})}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 text-sm font-semibold text-slate-100">{title}</h4>
        {hint ? <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-slate-500" /> : null}
      </div>
      <div className="mt-3">{children}</div>
    </Component>
  );
}

export function PrioritizationModal({
  open,
  tasks,
  onClose,
  onOpenTask,
}: PrioritizationModalProps) {
  const {
    data,
    error,
    isLoading,
    runPrioritization,
    cancelPrioritization,
  } = usePrioritization();
  const [hasRequestedRecommendation, setHasRequestedRecommendation] =
    useState(false);
  const tasksSignature = getPrioritizationTasksSignature(tasks);

  useEffect(() => {
    if (!open) {
      cancelPrioritization();
      return;
    }

    setHasRequestedRecommendation(true);
    void runPrioritization(tasks);
  }, [cancelPrioritization, open, runPrioritization, tasks, tasksSignature]);

  const recommendedTask = data
    ? tasks.find((task) => String(task.id) === data.primaryTaskId) ?? null
    : null;

  const showLoading = open && (!hasRequestedRecommendation || isLoading);
  const showError = hasRequestedRecommendation && !isLoading && Boolean(error);
  const showSuccess = hasRequestedRecommendation && !isLoading && Boolean(data);
  const showEmpty =
    hasRequestedRecommendation && !isLoading && !data && !error;

  const handleRetry = () => {
    setHasRequestedRecommendation(true);
    void runPrioritization(tasks);
  };

  const handleOpenTask = (task: Task) => {
    onOpenTask?.(task);
  };

  return (
    <Modal
      className="max-w-xl"
      description="Review an AI recommendation for the next task to tackle."
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
          {showError ? (
            <Button onClick={handleRetry} variant="secondary">
              Retry
            </Button>
          ) : null}
          {showSuccess && recommendedTask && onOpenTask ? (
            <Button
              leadingIcon={<ArrowUpRight className="size-4" />}
              onClick={() => handleOpenTask(recommendedTask)}
              variant="primary"
            >
              Open task
            </Button>
          ) : null}
        </div>
      }
      onClose={onClose}
      open={open}
      title="Suggest next task"
    >
      <div
        className={cx(
          "min-h-[260px]",
          showLoading ? "flex items-center" : "flex flex-col justify-center",
        )}
      >
        {showLoading ? <LoadingState /> : null}
        {showSuccess && data ? (
          <SuccessState
            data={data}
            onOpenTask={onOpenTask ? handleOpenTask : undefined}
            tasks={tasks}
          />
        ) : null}
        {showEmpty ? <EmptyState /> : null}
        {showError && error ? (
          <ErrorState message={error} />
        ) : null}
      </div>
    </Modal>
  );
}
