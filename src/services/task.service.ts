import type { Task, Prisma } from "#prisma/client";
import prisma from "@/lib/db/prisma";
import type { TaskWithParent } from "@/lib/types/task.types";
import { sortTasks } from "@/lib/utils/task.utils";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksInput,
} from "@/lib/validation/task.schemas";
import { deleteTaskSchema } from "@/lib/validation/task.schemas";

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
  const tasks = await prisma.task.findMany({
    include: taskWithParentInclude,
    where: {
      ...(options.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: options.dateSort ?? "desc" },
  });

  if (options.prioritySort) {
    return sortTasks(
      tasks,
      options.prioritySort,
      options.dateSort ?? "desc",
    );
  }

  return tasks;
}

export async function getTaskById(id: Task["id"]): Promise<TaskWithParent | null> {
  return prisma.task.findUnique({
    include: taskWithParentInclude,
    where: { id },
  });
}

export async function getSubtasksByParentTaskId(
  parentTaskId: Task["id"],
): Promise<Task[]> {
  return prisma.task.findMany({
    where: { parentTaskId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return prisma.task.create({
    data: input,
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
  const existingTask = await getTaskById(id);

  if (!existingTask) {
    return null;
  }

  if (Object.keys(input).length === 0) {
    return existingTask;
  }

  return prisma.task.update({
    where: { id },
    data: input,
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
