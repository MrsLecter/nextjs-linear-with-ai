"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { type Task } from "#prisma/browser";
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
import type { TaskFormInput } from "@/lib/validation/task.schemas";
import { TaskForm } from "@/components/tasks/TaskForm";

type TaskModalProps = {
  open: boolean;
  mode: "create" | "edit";
  task?: Task | null;
  onClose: () => void;
  onSave: (values: TaskFormInput) => Promise<TaskMutationResult>;
  onDelete?: (task: Task) => void;
};

export function TaskModal({
  open,
  mode,
  task,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUnsavedChangesModalOpen, setIsUnsavedChangesModalOpen] = useState(false);

  const initialValues = useMemo<TaskFormInput>(() => {
    if (!task) {
      return EMPTY_TASK_VALUES;
    }

    return {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
    };
  }, [task]);

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
    onClose();
  };

  const isCreateMode = mode === "create";
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

  return (
    <Modal
      open={open}
      closeDisabled={open && isUnsavedChangesModalOpen}
      onClose={handleRequestClose}
      title={title}
      description={description}
    >
      {!isCreateMode && task ? (
        <p className="my-4 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Task ID: {task.id}
        </p>
      ) : null}

      <TaskForm
        key={formKey}
        initialValues={initialValues}
        submitLabel={confirmLabel}
        onCancel={handleRequestClose}
        onDirtyChange={setHasUnsavedChanges}
        onSubmit={onSave}
        footerStart={
          !isCreateMode && task && onDelete ? (
            <Tooltip content={`Delete task`}>
              <Button
                aria-label={`Delete task`}
                onClick={() => onDelete(task)}
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
        onClose={() => setIsUnsavedChangesModalOpen(false)}
        onConfirm={handleDiscardChanges}
      />
    </Modal>
  );
}
