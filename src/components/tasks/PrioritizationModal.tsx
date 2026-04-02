"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Bot, Sparkles } from "lucide-react";
import type { Task } from "#prisma/browser";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { usePrioritization } from "@/hooks/use-prioritization";
import { cx } from "@/lib/helpers";

type PrioritizationModalProps = {
  open: boolean;
  tasks: Task[];
  onClose: () => void;
  onOpenTask?: (task: Task) => void;
};

function LoadingState() {
  return (
    <div aria-live="polite" className="space-y-5">
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

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
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
  confidence,
  recommendedTaskId,
  explanation,
  recommendedTaskTitle,
}: {
  confidence: "low" | "medium" | "high";
  recommendedTaskId: string;
  explanation: string;
  recommendedTaskTitle: string;
}) {
  return (
    <div aria-live="polite" className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium tracking-[0.02em] text-blue-100">
        <Sparkles className="size-3.5" />
        AI priority suggestion
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_0_0_1px_rgba(148,163,184,0.04)]">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Recommended next task
          </p>
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-50">
            {recommendedTaskTitle}
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Recommended task ID
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">
              {recommendedTaskId}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Confidence
            </p>
            <p className="mt-2 text-sm font-medium capitalize text-slate-200">
              {confidence}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Explanation
          </p>
          <p className="text-sm leading-6 text-slate-300">{explanation}</p>
        </div>
      </div>
    </div>
  );
}

export function PrioritizationModal({
  open,
  tasks,
  onClose,
  onOpenTask,
}: PrioritizationModalProps) {
  const { data, error, isLoading, runPrioritization } = usePrioritization();
  const [hasRequestedRecommendation, setHasRequestedRecommendation] =
    useState(false);

  useEffect(() => {
    if (!open) {
      setHasRequestedRecommendation(false);
      return;
    }

    setHasRequestedRecommendation(true);
    void runPrioritization();
  }, [open, runPrioritization]);

  const recommendedTask = data
    ? tasks.find((task) => String(task.id) === data.recommendedTaskId) ?? null
    : null;

  const showLoading = open && (!hasRequestedRecommendation || isLoading);
  const showError = hasRequestedRecommendation && !isLoading && Boolean(error);
  const showSuccess = hasRequestedRecommendation && !isLoading && Boolean(data);
  const showEmpty =
    hasRequestedRecommendation && !isLoading && !data && !error;

  const handleRetry = () => {
    setHasRequestedRecommendation(true);
    void runPrioritization();
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
              onClick={() => {
                onClose();
                onOpenTask(recommendedTask);
              }}
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
            confidence={data.confidence}
            explanation={data.explanation}
            recommendedTaskId={data.recommendedTaskId}
            recommendedTaskTitle={data.recommendedTaskTitle}
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
