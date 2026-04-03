import type { Task } from "#prisma/client";
import prisma from "@/lib/db/prisma";
import type {
  CreateSubtasksInput,
  CreateSubtasksResponse,
} from "@/lib/validation/task-decomposition.schemas";
import {
  createSubtasksInputSchema,
  createSubtasksResponseSchema,
} from "@/lib/validation/task-decomposition.schemas";
import {
  createSubtasksForParentTask,
  getTaskById,
} from "@/services/task.service";
import { TaskDecompositionError, isTaskDecompositionError } from "@/services/task-decomposition.errors";

export async function createTaskSubtasks(
  input: CreateSubtasksInput,
): Promise<CreateSubtasksResponse> {
  const parsedInput = createSubtasksInputSchema.parse(input);
  const taskId = Number(parsedInput.taskId);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    throw new TaskDecompositionError("Parent task not found.", {
      statusCode: 404,
      code: "parent_task_not_found",
    });
  }

  const parentTask = await getTaskById(taskId);

  if (!parentTask) {
    throw new TaskDecompositionError("Parent task not found.", {
      statusCode: 404,
      code: "parent_task_not_found",
    });
  }

  const existingTasks = await prisma.task.findMany({
    where: {
      title: {
        in: parsedInput.subtasks.map((subtask) => subtask.title),
      },
    },
    select: {
      title: true,
    },
  });

  const existingTitleSet = new Set(
    existingTasks.map((task) => task.title.trim().toLocaleLowerCase()),
  );
  const conflictingTitles = parsedInput.subtasks
    .map((subtask) => subtask.title.trim())
    .filter((title, index, titles) => {
      const normalizedTitle = title.toLocaleLowerCase();

      return (
        titles.findIndex((candidate) => candidate.toLocaleLowerCase() === normalizedTitle)
        === index &&
        existingTitleSet.has(normalizedTitle)
      );
    });

  if (conflictingTitles.length > 0) {
    throw new TaskDecompositionError(
      `Cannot create subtasks because these titles already exist: ${conflictingTitles.join(", ")}`,
      {
        statusCode: 409,
        code: "duplicate_subtask_titles",
      },
    );
  }

  try {
    const orderedSubtasks = [...parsedInput.subtasks].sort((left, right) => left.order - right.order);
    const createdSubtasks = await createSubtasksForParentTask({
      parentTaskId: parentTask.id,
      priority: parentTask.priority,
      subtasks: orderedSubtasks,
    });

    return createSubtasksResponseSchema.parse({
      createdCount: createdSubtasks.length,
      subtasks: createdSubtasks.map((subtask, index) => ({
        id: String(subtask.id),
        title: subtask.title,
        description: subtask.description,
        order: orderedSubtasks[index]?.order ?? index + 1,
        status: subtask.status as Task["status"],
        priority: subtask.priority as Task["priority"],
        createdAt: subtask.createdAt.toISOString(),
        parentTaskId: subtask.parentTaskId ? String(subtask.parentTaskId) : null,
      })),
    });
  } catch (error) {
    if (isTaskDecompositionError(error)) {
      throw error;
    }

    throw new TaskDecompositionError("Failed to create subtasks.", {
      statusCode: 500,
      code: "subtask_persistence_failed",
    });
  }
}

export { isTaskDecompositionError };
