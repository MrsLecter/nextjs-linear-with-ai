import type { Task, Prisma } from "#prisma/client";
import prisma from "@/lib/db/prisma";
import type { TaskWithParent } from "@/lib/types/task.types";
import { sortTasks } from "@/lib/utils/task.utils";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksInput,
} from "@/lib/validation/task.schemas";
import {
  createTaskSchema,
  deleteTaskSchema,
  listTasksSchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "@/lib/validation/task.schemas";

const taskWithParentInclude = {
  parentTask: {
    select: {
      id: true,
      title: true,
    },
  },
} satisfies Prisma.TaskInclude;

export type CreateSubtaskRecordInput = {
  title: string;
  description: string;
  order: number;
};

export async function listTasks(
  options: ListTasksInput
): Promise<TaskWithParent[]> {
  const parsedOptions = listTasksSchema.parse(options);
  const tasks = await prisma.task.findMany({
    include: taskWithParentInclude,
    where: {
      ...(parsedOptions.status ? { status: parsedOptions.status } : {}),
    },
    orderBy: { createdAt: parsedOptions.dateSort ?? "desc" },
  });

  if (parsedOptions.prioritySort) {
    return sortTasks(
      tasks,
      parsedOptions.prioritySort,
      parsedOptions.dateSort ?? "desc",
    );
  }

  return tasks;
}

export async function getTaskById(id: Task["id"]): Promise<TaskWithParent | null> {
  const parsedId = taskIdParamSchema.parse({ id });

  return prisma.task.findUnique({
    include: taskWithParentInclude,
    where: { id: parsedId.id },
  });
}

export async function getSubtasksByParentTaskId(
  parentTaskId: Task["id"],
): Promise<Task[]> {
  const parsedParentTaskId = taskIdParamSchema.parse({ id: parentTaskId });

  return prisma.task.findMany({
    where: { parentTaskId: parsedParentTaskId.id },
    orderBy: { createdAt: "asc" },
  });
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const parsedInput = createTaskSchema.parse(input);

  return prisma.task.create({
    data: parsedInput,
  });
}

export async function createSubtasksForParentTask(params: {
  parentTaskId: Task["id"];
  priority: Task["priority"];
  subtasks: CreateSubtaskRecordInput[];
}): Promise<Task[]> {
  const orderedSubtasks = [...params.subtasks].sort((left, right) => left.order - right.order);

  return prisma.$transaction(
    orderedSubtasks.map((subtask) =>
      prisma.task.create({
        data: {
          title: subtask.title,
          description: subtask.description,
          status: "TODO",
          priority: params.priority,
          parentTaskId: params.parentTaskId,
        },
      }),
    ),
  );
}

export async function updateTask(
  id: Task["id"],
  input: UpdateTaskInput,
): Promise<Task | null> {
  const parsedId = taskIdParamSchema.parse({ id });
  const parsedInput = updateTaskSchema.parse(input);
  const existingTask = await getTaskById(parsedId.id);

  if (!existingTask) {
    return null;
  }

  if (Object.keys(parsedInput).length === 0) {
    return existingTask;
  }

  return prisma.task.update({
    where: { id: parsedId.id },
    data: parsedInput,
  });
}

export async function deleteTask(
  id: Task["id"],
): Promise<{ deleted: boolean }> {
  const parsedId = deleteTaskSchema.parse({ id });
  const result = await prisma.task.deleteMany({
    where: { id: parsedId.id },
  });

  return {
    deleted: result.count > 0,
  };
}
