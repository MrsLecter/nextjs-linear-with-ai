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
import { DEFAULT_TASK_WORK_TYPE } from "@/lib/constants/task-work-type.constants";

export const TASK_DATE_SORT_DIRECTION_VALUES = ["desc", "asc"] as const;
// Fixed estimation scale shared across validation, prompts, and UI copy.
export const TASK_ESTIMATION_VALUES = [0, 1, 2, 3, 5, 8] as const;
export type TaskDateSortDirection =
  (typeof TASK_DATE_SORT_DIRECTION_VALUES)[number];
// AI estimation output is restricted to this exact union of allowed values.
export type TaskEstimationValue = (typeof TASK_ESTIMATION_VALUES)[number];

export type TaskEstimationRule = {
  value: TaskEstimationValue;
  label: string;
  description: string;
  timebox: string;
  isContainerTask?: boolean;
};

export const DEFAULT_TASK_PRIORITY_SORT = PrismaTaskPriority.HIGH;
export const DEFAULT_TASK_DATE_SORT_DIRECTION: TaskDateSortDirection = "desc";

export const TASK_ESTIMATION_RULES: Record<
  TaskEstimationValue,
  TaskEstimationRule
> = {
  // `0` is reserved for parent/container tasks that have already been decomposed.
  0: {
    value: 0,
    label: "Parent task",
    description: "Already split into subtasks and not estimated as a single delivery unit.",
    timebox: "Decomposed into subtasks",
    isContainerTask: true,
  },
  1: {
    value: 1,
    label: "Tiny fix",
    description: "A very small, low-risk change with limited implementation scope.",
    timebox: "About 1-2 hours",
  },
  2: {
    value: 2,
    label: "Small task",
    description: "A small fix or feature that stays contained within a narrow surface area.",
    timebox: "About 2-4 hours",
  },
  3: {
    value: 3,
    label: "Medium task",
    description: "A medium-sized task that typically spans a full focused workday.",
    timebox: "About 1 day",
  },
  5: {
    value: 5,
    label: "Complex feature",
    description: "A more complex feature that needs coordination across multiple parts of the system.",
    timebox: "About 3 days",
  },
  8: {
    value: 8,
    label: "Large feature",
    description: "A large feature with broader scope, more edge cases, or more delivery risk.",
    timebox: "About 4-5 days",
  },
};

export const TASK_ESTIMATION_RULE_LIST = TASK_ESTIMATION_VALUES.map(
  (value) => TASK_ESTIMATION_RULES[value],
);

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
  type: DEFAULT_TASK_WORK_TYPE,
  estimation: 0,
};
