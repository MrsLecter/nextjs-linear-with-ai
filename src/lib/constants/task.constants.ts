import type { LucideIcon } from "lucide-react";
import {
  Circle,
  CircleArrowUp,
  CircleCheckBig,
  SignalHigh,
  SignalLow,
  SignalMedium,
} from "lucide-react";
import {
  TaskPriority as PrismaTaskPriority,
  TaskStatus as PrismaTaskStatus,
  type Task,
} from "#prisma/browser";
import type {
  TaskPriority as PrismaTaskPriorityValue,
  TaskStatus as PrismaTaskStatusValue,
} from "#prisma/browser";

export const TASK_DATE_SORT_DIRECTION_VALUES = ["desc", "asc"] as const;
export const TASK_ESTIMATION_VALUES = [0, 1, 2, 3, 5, 8] as const;
export type TaskDateSortDirection =
  (typeof TASK_DATE_SORT_DIRECTION_VALUES)[number];
export type TaskEstimationValue = (typeof TASK_ESTIMATION_VALUES)[number];
export const DEFAULT_TASK_PRIORITY_SORT = PrismaTaskPriority.HIGH;
export const DEFAULT_TASK_DATE_SORT_DIRECTION: TaskDateSortDirection = "desc";

export const TASK_STATUS_LABELS: Record<PrismaTaskStatusValue, string> = {
  [PrismaTaskStatus.TODO]: "Todo",
  [PrismaTaskStatus.IN_PROGRESS]: "In Progress",
  [PrismaTaskStatus.DONE]: "Done",
};

export const TASK_PRIORITY_LABELS: Record<PrismaTaskPriorityValue, string> = {
  [PrismaTaskPriority.LOW]: "Low",
  [PrismaTaskPriority.MEDIUM]: "Medium",
  [PrismaTaskPriority.HIGH]: "High",
};

export const STATUS_OPTIONS: Array<{
  value: PrismaTaskStatus;
  label: string;
  icon: LucideIcon;
}> = [
    {
      value: PrismaTaskStatus.TODO,
      label: TASK_STATUS_LABELS[PrismaTaskStatus.TODO],
      icon: Circle,
    },
    {
      value: PrismaTaskStatus.IN_PROGRESS,
      label: TASK_STATUS_LABELS[PrismaTaskStatus.IN_PROGRESS],
      icon: CircleArrowUp,
    },
    {
      value: PrismaTaskStatus.DONE,
      label: TASK_STATUS_LABELS[PrismaTaskStatus.DONE],
      icon: CircleCheckBig,
    },
  ];

export const PRIORITY_OPTIONS: Array<{
  value: PrismaTaskPriority;
  label: string;
  icon: LucideIcon;
}> = [
    {
      value: PrismaTaskPriority.LOW,
      label: TASK_PRIORITY_LABELS[PrismaTaskPriority.LOW],
      icon: SignalLow,
    },
    {
      value: PrismaTaskPriority.MEDIUM,
      label: TASK_PRIORITY_LABELS[PrismaTaskPriority.MEDIUM],
      icon: SignalMedium,
    },
    {
      value: PrismaTaskPriority.HIGH,
      label: TASK_PRIORITY_LABELS[PrismaTaskPriority.HIGH],
      icon: SignalHigh,
    },
  ];

export type TaskFormValues = Omit<Task, "id" | "createdAt" | "parentTaskId"> & {
  estimation: TaskEstimationValue;
};

export const EMPTY_TASK_VALUES: TaskFormValues = {
  title: "",
  description: "",
  status: PrismaTaskStatus.TODO,
  priority: PrismaTaskPriority.MEDIUM,
  estimation: 0,
};
