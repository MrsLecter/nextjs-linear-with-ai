"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  CONFIRMATION_MESSAGES,
  TASK_MODAL_MESSAGES,
} from "@/lib/constants/ui.constants";
import { EMPTY_TASK_VALUES } from "@/lib/constants/task.constants";
import type { TaskMutationResult } from "@/lib/types/task-mutation.types";
import type { TaskWithParent } from "@/lib/types/task.types";
import type { TaskFormInput } from "@/lib/validation/task.schemas";
import { TaskForm } from "@/components/tasks/TaskForm";

type TaskModalProps = {
  open: boolean;
  mode: "create" | "edit";
  task?: TaskWithParent | null;
  onClose: () => void;
  onOpenTask: (taskId: number) => Promise<void>;
  onSave: (values: TaskFormInput, taskId?: number) => Promise<TaskMutationResult>;
  onDelete?: (task: TaskWithParent) => void;
};

export function TaskModal({
  open,
  mode,
  task,
  onClose,
  onOpenTask,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [modalTask, setModalTask] = useState<TaskWithParent | null>(task ?? null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUnsavedChangesModalOpen, setIsUnsavedChangesModalOpen] = useState(false);
  const [pendingTaskToOpen, setPendingTaskToOpen] = useState<number | null>(null);

  const initialValues = useMemo<TaskFormInput>(() => {
    if (!modalTask) {
      return EMPTY_TASK_VALUES;
    }

    return {
      title: modalTask.title,
      description: modalTask.description,
      status: modalTask.status,
      priority: modalTask.priority,
    };
  }, [modalTask]);

  const handleRequestClose = () => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    setIsUnsavedChangesModalOpen(true);
  };

  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setIsUnsavedChangesModalOpen(false);

    if (pendingTaskToOpen !== null) {
      void onOpenTask(pendingTaskToOpen);
      setPendingTaskToOpen(null);
      return;
    }

    onClose();
  };

  const handleOpenTask = (taskId: number) => {
    if (!hasUnsavedChanges) {
      void onOpenTask(taskId);
      return;
    }

    setPendingTaskToOpen(taskId);
    setIsUnsavedChangesModalOpen(true);
  };

  const effectiveMode = mode === "create" && modalTask ? "edit" : mode;
  const isCreateMode = effectiveMode === "create";
  const title = isCreateMode
    ? TASK_MODAL_MESSAGES.CREATE_TITLE
    : TASK_MODAL_MESSAGES.EDIT_TITLE;
  const description = isCreateMode
    ? TASK_MODAL_MESSAGES.CREATE_DESCRIPTION
    : TASK_MODAL_MESSAGES.EDIT_DESCRIPTION;
  const confirmLabel = isCreateMode
    ? TASK_MODAL_MESSAGES.CREATE_CONFIRM
    : TASK_MODAL_MESSAGES.EDIT_CONFIRM;
  const formKey = `${mode}:${task?.id ?? "new"}`;

  const handleSave = async (values: TaskFormInput) => {
    const hadTaskId = Boolean(modalTask?.id);
    const result = await onSave(values, modalTask?.id);

    if (!result.success) {
      return result;
    }

    setHasUnsavedChanges(false);
    if (hadTaskId) {
      setModalTask({
        ...result.task,
        parentTask: result.task.parentTask ?? modalTask?.parentTask ?? null,
      });
    }
    onClose();

    return result;
  };

  return (
    <Modal
      open={open}
      closeDisabled={open && isUnsavedChangesModalOpen}
      onClose={handleRequestClose}
      title={title}
      description={description}
    >
      {!isCreateMode && modalTask ? (
        <div className="my-4 space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Task ID: {modalTask.id}
          </p>

          {modalTask.parentTask ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                This task is a subtask
              </p>
              {(() => {
                const parentTask = modalTask.parentTask;

                if (!parentTask) {
                  return null;
                }

                return (
              <button
                className="mt-2 text-left text-sm font-medium text-blue-300 transition hover:text-blue-200 hover:underline"
                onClick={() => handleOpenTask(parentTask.id)}
                type="button"
              >
                Parent task: {parentTask.title}
              </button>
                );
              })()}
            </div>
          ) : null}
        </div>
      ) : null}

      <TaskForm
        key={formKey}
        createdAt={modalTask?.createdAt}
        enableSubtaskGeneration
        initialValues={initialValues}
        taskId={modalTask?.id}
        submitLabel={confirmLabel}
        onCancel={handleRequestClose}
        onDirtyChange={setHasUnsavedChanges}
        onSubmit={handleSave}
        footerStart={
          !isCreateMode && modalTask && onDelete ? (
            <Tooltip content={`Delete task`}>
              <Button
                aria-label={`Delete task`}
                onClick={() => onDelete(modalTask)}
                size="icon"
                type="button"
                variant="danger"
              >
                <Trash2 className="size-4" />
              </Button>
            </Tooltip>
          ) : undefined
        }
      />

      <ConfirmationModal
        open={open && isUnsavedChangesModalOpen}
        title={CONFIRMATION_MESSAGES.UNSAVED_CHANGES_TITLE}
        description={CONFIRMATION_MESSAGES.UNSAVED_CHANGES_MESSAGE}
        confirmLabel={CONFIRMATION_MESSAGES.UNSAVED_CHANGES_CONFIRM}
        cancelLabel={CONFIRMATION_MESSAGES.UNSAVED_CHANGES_CANCEL}
        onClose={() => {
          setIsUnsavedChangesModalOpen(false);
          setPendingTaskToOpen(null);
        }}
        onConfirm={handleDiscardChanges}
      />
    </Modal>
  );
}
