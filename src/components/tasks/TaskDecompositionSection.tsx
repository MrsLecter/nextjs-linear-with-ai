"use client";

import { Blocks, HelpCircle, Sparkles, Workflow } from "lucide-react";
import { AiActionRow } from "@/components/tasks/AiActionRow";
import { Button } from "@/components/ui/Button";
import type { DecompositionPreviewResult } from "@/lib/ai/features/task-decomposition/types";

type ReadyDecompositionPreview = Extract<
  DecompositionPreviewResult,
  {
    status: "ready";
  }
>;

type TaskDecompositionSectionProps = {
  taskId?: number;
  notice: string | null;
  result: DecompositionPreviewResult | null;
  isGenerating: boolean;
  isSavingSubtasks: boolean;
  isPreviewCurrent: boolean;
  canGenerate: boolean;
  generateLabel: string;
  generationError: string | null;
  saveError: string | null;
  saveSuccessMessage: string | null;
  onGenerateSubtasks: () => void;
  onCreateSubtasks: () => void;
};

function ReadyPreview({
  taskId,
  preview,
  isSavingSubtasks,
  isPreviewCurrent,
  saveError,
  saveSuccessMessage,
  onCreateSubtasks,
}: {
  taskId?: number;
  preview: ReadyDecompositionPreview;
  isSavingSubtasks: boolean;
  isPreviewCurrent: boolean;
  saveError: string | null;
  saveSuccessMessage: string | null;
  onCreateSubtasks: () => void;
}) {
  const hasSavedSubtasks = Boolean(saveSuccessMessage);
  const canCreateSubtasks =
    Boolean(taskId) && isPreviewCurrent && !isSavingSubtasks && !hasSavedSubtasks;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-200" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-50">Preview ready</p>
            <p className="text-sm leading-6 text-slate-300">{preview.reason}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {preview.subtasks.map((subtask, index) => (
          <div
            key={`${subtask.order}:${subtask.title}:${index}`}
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Subtask {subtask.order}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-50">{subtask.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{subtask.description}</p>
          </div>
        ))}
      </div>

      {!taskId ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Save task first to create subtasks.
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {saveError}
        </div>
      ) : null}

      {saveSuccessMessage ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {saveSuccessMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={!canCreateSubtasks}
          onClick={onCreateSubtasks}
          type="button"
          variant="primary"
        >
          {isSavingSubtasks
            ? "Creating subtasks..."
            : hasSavedSubtasks
              ? "Subtasks created"
              : "Create subtasks"}
        </Button>
        <p className="text-sm text-slate-400">
          This step saves the previewed subtasks without regenerating them.
        </p>
      </div>
    </div>
  );
}

export function TaskDecompositionSection({
  taskId,
  notice,
  result,
  isGenerating,
  isSavingSubtasks,
  isPreviewCurrent,
  canGenerate,
  generateLabel,
  generationError,
  saveError,
  saveSuccessMessage,
  onGenerateSubtasks,
  onCreateSubtasks,
}: TaskDecompositionSectionProps) {
  const hasDetails =
    Boolean(notice) ||
    Boolean(result && isPreviewCurrent && !isGenerating && !generationError) ||
    Boolean(generationError) ||
    isGenerating ||
    result?.status === "needs_clarification" ||
    result?.status === "cannot_decompose" ||
    result?.status === "ready";

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/30">
      <AiActionRow
        actionIcon={<Sparkles className="size-4" />}
        actionLabel={generateLabel}
        description="Break it into subtasks"
        disabled={!canGenerate}
        icon={<Blocks className="size-4" />}
        onClick={onGenerateSubtasks}
        title="AI Task decomposition"
      />

      {hasDetails ? (
        <div className="space-y-4 border-t border-slate-800/80 px-4 py-4">
          {notice ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {notice}
            </div>
          ) : null}

          {result && isPreviewCurrent && !isGenerating && !generationError ? (
            <p className="text-sm text-slate-400">Preview is up to date.</p>
          ) : null}

          {generationError ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {generationError}
            </div>
          ) : null}

          {isGenerating ? (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-transparent" />
                <div>
                  <p className="text-sm font-medium text-slate-50">Generating preview</p>
                  <p className="text-sm text-slate-400">
                    Reviewing the current title and description draft.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {result?.status === "needs_clarification" ? (
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

          {result?.status === "cannot_decompose" ? (
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
              <div className="flex items-start gap-3">
                <Workflow className="mt-0.5 size-4 shrink-0 text-slate-300" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-50">Cannot decompose</p>
                  <p className="text-sm leading-6 text-slate-400">{result.reason}</p>
                  <p className="text-sm leading-6 text-slate-400">
                    This task is already small and specific enough to work on directly.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {result?.status === "ready" ? (
            <ReadyPreview
              taskId={taskId}
              preview={result}
              isSavingSubtasks={isSavingSubtasks}
              isPreviewCurrent={isPreviewCurrent}
              saveError={saveError}
              saveSuccessMessage={saveSuccessMessage}
              onCreateSubtasks={onCreateSubtasks}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
