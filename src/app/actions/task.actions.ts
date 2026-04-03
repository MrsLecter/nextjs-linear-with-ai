"use server";

import type { ZodIssue } from "zod";
import { Prisma } from "#prisma/client";
import {
  createTask,
  deleteTask,
  getTaskById,
  updateTask,
} from "@/services/task.service";
import {
  createTaskSchema,
  deleteTaskSchema,
  taskFormSchema,
  taskIdParamSchema,
  type TaskFormInput,
} from "@/lib/validation/task.schemas";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "@/lib/constants/ui.constants";
import type {
  TaskMutationError,
  TaskFormFieldErrors,
  TaskMutationResult,
} from "@/lib/types/task-mutation.types";

function getFieldErrors(issues: ZodIssue[]): TaskFormFieldErrors {
  return issues.reduce<TaskFormFieldErrors>((errors, issue) => {
    const fieldName = issue.path[0];

    if (typeof fieldName !== "string" || fieldName in errors) {
      return errors;
    }

    return {
      ...errors,
      [fieldName]: issue.message,
    };
  }, {});
}

function getMutationError(
  error: unknown,
  fallbackMessage: string,
): Omit<TaskMutationError, "success"> {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      formError: fallbackMessage,
      fieldErrors: {
        title: "A task with this title already exists.",
      },
    };
  }

  if (error instanceof Error && error.message) {
    return {
      formError: error.message,
    };
  }

  return {
    formError: fallbackMessage,
  };
}

export async function createTaskAction(
  input: TaskFormInput,
): Promise<TaskMutationResult> {
  const parsedInput = createTaskSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      fieldErrors: getFieldErrors(parsedInput.error.issues),
    };
  }

  try {
    const task = await createTask(parsedInput.data);

    return {
      success: true,
      task,
      message: SUCCESS_MESSAGES.TASK_CREATED,
    };
  } catch (error) {
    return {
      success: false,
      ...getMutationError(error, ERROR_MESSAGES.CREATE_TASK_FAILED),
    };
  }
}

export async function getTaskByIdAction(id: number) {
  const parsedId = taskIdParamSchema.safeParse({ id });

  if (!parsedId.success) {
    return null;
  }

  return getTaskById(parsedId.data.id);
}

export async function updateTaskAction(
  id: number,
  input: TaskFormInput,
): Promise<TaskMutationResult> {
  const parsedInput = taskFormSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false,
      fieldErrors: getFieldErrors(parsedInput.error.issues),
    };
  }

  try {
    const task = await updateTask(id, parsedInput.data);

    if (!task) {
      return {
        success: false,
        formError: ERROR_MESSAGES.TASK_NOT_FOUND,
      };
    }

    return {
      success: true,
      task,
      message: SUCCESS_MESSAGES.TASK_UPDATED,
    };
  } catch (error) {
    return {
      success: false,
      ...getMutationError(error, ERROR_MESSAGES.UPDATE_TASK_FAILED),
    };
  }
}

export async function deleteTaskAction(
  id: number,
): Promise<{ success: true } | { success: false; formError: string }> {
  const parsedId = deleteTaskSchema.safeParse({ id });

  if (!parsedId.success) {
    return {
      success: false,
      formError: parsedId.error.issues[0]?.message ?? ERROR_MESSAGES.DELETE_TASK_FAILED,
    };
  }

  try {
    const result = await deleteTask(parsedId.data.id);

    if (!result.deleted) {
      return {
        success: false,
        formError: ERROR_MESSAGES.TASK_NOT_FOUND,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      formError: getMutationError(error, ERROR_MESSAGES.DELETE_TASK_FAILED).formError
        ?? ERROR_MESSAGES.DELETE_TASK_FAILED,
    };
  }
}
