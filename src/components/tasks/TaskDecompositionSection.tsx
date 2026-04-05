"use client";

import { Bot, HelpCircle, Sparkles, Workflow } from "lucide-react";
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
  hasGeneratedPreview: boolean;
  notice: string | null;
  result: DecompositionPreviewResult | null;
  isGenerating: boolean;
  isSavingSubtasks: boolean;
  generationError: string | null;
  saveError: string | null;
  saveSuccessMessage: string | null;
  onCreateSubtasks: () => void;
};

function ReadyPreview({
  taskId,
  preview,
  isSavingSubtasks,
  saveError,
  saveSuccessMessage,
  onCreateSubtasks,
}: {
  taskId?: number;
  preview: ReadyDecompositionPreview;
  isSavingSubtasks: boolean;
  saveError: string | null;
  saveSuccessMessage: string | null;
  onCreateSubtasks: () => void;
}) {
  const hasSavedSubtasks = Boolean(saveSuccessMessage);
  const canCreateSubtasks = Boolean(taskId) && !isSavingSubtasks && !hasSavedSubtasks;

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
  hasGeneratedPreview,
  notice,
  result,
  isGenerating,
  isSavingSubtasks,
  generationError,
  saveError,
  saveSuccessMessage,
  onCreateSubtasks,
}: TaskDecompositionSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-200">
          <Bot className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-50">AI task decomposition</p>
          <p className="text-sm leading-6 text-slate-400">
            Generate a preview from the current draft, then decide whether to save subtasks.
          </p>
        </div>
      </div>

      {notice ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {notice}
        </div>
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
          saveError={saveError}
          saveSuccessMessage={saveSuccessMessage}
          onCreateSubtasks={onCreateSubtasks}
        />
      ) : null}

      {hasGeneratedPreview && !isGenerating && !result && !generationError ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-400">
          Generate subtasks to preview the current draft.
        </div>
      ) : null}
    </section>
  );
}
