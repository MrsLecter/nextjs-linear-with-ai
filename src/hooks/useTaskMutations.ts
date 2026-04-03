"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTaskAction,
  deleteTaskAction,
  getTaskByIdAction,
  updateTaskAction,
} from "@/app/actions/task.actions";
import { ERROR_MESSAGES } from "@/lib/constants/ui.constants";
import type { TaskMutationResult } from "@/lib/types/task-mutation.types";
import type { TaskWithParent } from "@/lib/types/task.types";
import type { TaskFormInput } from "@/lib/validation/task.schemas";

export function useTaskMutations() {
  const router = useRouter();
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTask, setSelectedTask] = useState<TaskWithParent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskPendingDeletion, setTaskPendingDeletion] = useState<TaskWithParent | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskWithParent) => {
    setModalMode("edit");
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const openTaskById = async (taskId: number) => {
    const task = await getTaskByIdAction(taskId);

    if (!task) {
      return;
    }

    setModalMode("edit");
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const saveTask = async (
    values: TaskFormInput,
    taskId?: number,
  ): Promise<TaskMutationResult> => {
    if (taskId) {
      const result = await updateTaskAction(taskId, values);

      if (result.success) {
        router.refresh();
      }

      return result;
    }

    const result = await createTaskAction(values);

    if (result.success) {
      router.refresh();
    }

    return result;
  };

  const requestDeleteTask = (task: TaskWithParent) => {
    setDeleteError(null);
    setTaskPendingDeletion(task);
  };

  const cancelDeleteTask = () => {
    if (isDeletingTask) {
      return;
    }

    setDeleteError(null);
    setTaskPendingDeletion(null);
  };

  const confirmDeleteTask = async () => {
    if (!taskPendingDeletion) {
      return;
    }

    setIsDeletingTask(true);
    setDeleteError(null);

    try {
      const result = await deleteTaskAction(taskPendingDeletion.id);

      if (!result.success) {
        setDeleteError(result.formError);
        return;
      }

      if (selectedTask?.id === taskPendingDeletion.id) {
        closeModal();
      }

      setTaskPendingDeletion(null);
      router.refresh();
    } catch {
      setDeleteError(ERROR_MESSAGES.DELETE_TASK_FAILED);
    } finally {
      setIsDeletingTask(false);
    }
  };

  return {
    modalMode,
    selectedTask,
    isModalOpen,
    openCreateModal,
    openEditModal,
    openTaskById,
    closeModal,
    saveTask,
    taskPendingDeletion,
    isDeletingTask,
    deleteError,
    requestDeleteTask,
    cancelDeleteTask,
    confirmDeleteTask,
  };
}
