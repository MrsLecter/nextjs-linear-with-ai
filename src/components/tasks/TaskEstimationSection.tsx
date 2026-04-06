"use client";

import {
  AlertCircle,
  HelpCircle,
  Sparkles,
  TriangleAlert,
  TriangleDashed,
} from "lucide-react";
import { AiActionRow } from "@/components/tasks/AiActionRow";
import { TASK_ESTIMATION_RULES } from "@/lib/constants/task.constants";
import type { EstimateTaskResult } from "@/lib/types/task-estimation.types";

type TaskEstimationSectionProps = {
  notice: string | null;
  result: EstimateTaskResult | null;
  isEstimating: boolean;
  canGenerate: boolean;
  generateLabel: string;
  error: string | null;
  onGenerateEstimate: () => void;
};

function ConfidenceBadge({
  confidence,
}: {
  confidence: Extract<EstimateTaskResult, { status: "ready" }>["confidence"];
}) {
  const styles = confidence === "high"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
    : confidence === "medium"
      ? "border-blue-500/20 bg-blue-500/10 text-blue-100"
      : "border-amber-500/20 bg-amber-500/10 text-amber-100";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${styles}`}>
      {confidence} confidence
    </span>
  );
}

function EstimateResult({
  result,
}: {
  result: Extract<EstimateTaskResult, { status: "ready" }>;
}) {
  const estimateRule = TASK_ESTIMATION_RULES[result.estimate];
  const isLowConfidence = result.confidence === "low";

  return (
    <div className="space-y-4">
      <div className={isLowConfidence
        ? "rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4"
        : "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4"}
      >
        <div className="flex items-start gap-3">
          {isLowConfidence ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-200" />
          ) : (
            <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-200" />
          )}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-slate-50">
                Estimate {result.estimate}
              </p>
              <ConfidenceBadge confidence={result.confidence} />
            </div>
            <p className="text-sm text-slate-300">
              {estimateRule.label}. {estimateRule.timebox}.
            </p>
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Explanation
              </p>
              <p className="text-sm leading-6 text-slate-300">{result.reason}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Similar tasks used
        </p>

        {result.similarTasksUsed.length > 0 ? (
          <div className="space-y-2">
            {result.similarTasksUsed.map((task) => (
              <div
                key={task.taskId}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">Task ID: {task.taskId}</p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-medium text-slate-300">
                  {task.estimation}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No strong historical matches were found, so this estimate is based mainly on the current task description
          </p>
        )}
      </div>
    </div>
  );
}

export function TaskEstimationSection({
  notice,
  result,
  isEstimating,
  canGenerate,
  generateLabel,
  error,
  onGenerateEstimate,
}: TaskEstimationSectionProps) {
  const hasDetails =
    Boolean(notice) ||
    Boolean(result) ||
    Boolean(error) ||
    isEstimating;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/30">
      <AiActionRow
        actionIcon={<Sparkles className="size-4" />}
        actionLabel={generateLabel}
        className="border-none bg-transparent"
        description="Estimate effort from similar tasks"
        disabled={!canGenerate}
        icon={<TriangleDashed className="size-4" />}
        onClick={onGenerateEstimate}
        title="AI estimation"
      />

      {hasDetails ? (
        <div className="space-y-4 border-t border-slate-800/80 px-4 py-4">
          {notice ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {notice}
            </div>
          ) : null}

          {isEstimating ? (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-transparent" />
                <div>
                  <p className="text-sm font-medium text-slate-50">Estimating effort...</p>
                  <p className="text-sm text-slate-400">
                    Searching similar tasks and preparing a grounded estimate.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-200" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-50">Estimation unavailable</p>
                  <p className="text-sm leading-6 text-red-100">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          {result?.status === "needs_clarification" && !isEstimating && !error ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-amber-200" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-50">Needs clarification</p>
                  <p className="text-sm leading-6 text-slate-300">{result.reason}</p>
                  <div className="space-y-1 pt-1">
                    {result.questions.map((question, index) => (
                      <p key={`${question}:${index}`} className="text-sm leading-6 text-amber-100">
                        {index + 1}. {question}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {result?.status === "ready" && !isEstimating && !error ? (
            <EstimateResult result={result} />
          ) : null}

        </div>
      ) : null}
    </div>
  );
}
