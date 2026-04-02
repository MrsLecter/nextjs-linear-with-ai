"use client";

import { useMemo, useState } from "react";
import { type Task } from "#prisma/browser";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Modal } from "@/components/ui/Modal";
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
};

export function TaskModal({
  open,
  mode,
  task,
  onClose,
  onSave,
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
      <TaskForm
        key={formKey}
        initialValues={initialValues}
        submitLabel={confirmLabel}
        onCancel={handleRequestClose}
        onDirtyChange={setHasUnsavedChanges}
        onSubmit={onSave}
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
