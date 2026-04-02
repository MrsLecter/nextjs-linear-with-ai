import {
  TaskPriority as PrismaTaskPriority,
  TaskStatus as PrismaTaskStatus,
  type Task,
} from "#prisma/browser";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/lib/constants/task.constants";
import type { TaskDateSortDirection } from "@/lib/constants/task.constants";

export function getStatusMeta(status: PrismaTaskStatus) {
  return STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[0];
}

export function getPriorityMeta(priority: PrismaTaskPriority) {
  return (
    PRIORITY_OPTIONS.find((option) => option.value === priority) ?? PRIORITY_OPTIONS[1]
  );
}

export function getPriorityOrder(sortBy: PrismaTaskPriority): PrismaTaskPriority[] {
  switch (sortBy) {
    case PrismaTaskPriority.HIGH:
      return [
        PrismaTaskPriority.HIGH,
        PrismaTaskPriority.MEDIUM,
        PrismaTaskPriority.LOW,
      ];
    case PrismaTaskPriority.MEDIUM:
      return [
        PrismaTaskPriority.MEDIUM,
        PrismaTaskPriority.HIGH,
        PrismaTaskPriority.LOW,
      ];
    case PrismaTaskPriority.LOW:
      return [
        PrismaTaskPriority.LOW,
        PrismaTaskPriority.MEDIUM,
        PrismaTaskPriority.HIGH,
      ];
    default:
      return [
        PrismaTaskPriority.HIGH,
        PrismaTaskPriority.MEDIUM,
        PrismaTaskPriority.LOW,
      ];
  }
}

export function sortTasks(
  tasks: Task[],
  prioritySort: PrismaTaskPriority,
  dateSort: TaskDateSortDirection,
) {
  const order = getPriorityOrder(prioritySort);

  return [...tasks].sort((left, right) => {
    const leftIndex = order.indexOf(left.priority);
    const rightIndex = order.indexOf(right.priority);

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    const dateDiff =
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();

    return dateSort === "asc" ? dateDiff : -dateDiff;
  });
}
