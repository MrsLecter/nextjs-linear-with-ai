import { TaskWorkType as PrismaTaskWorkType } from "#prisma/browser";
import type { TaskWorkType } from "@/lib/types/task.types";

export const TASK_WORK_TYPE_VALUES = [
  PrismaTaskWorkType.FEATURE,
  PrismaTaskWorkType.BUG,
  PrismaTaskWorkType.IMPROVEMENT,
  PrismaTaskWorkType.TECH_DEBT,
  PrismaTaskWorkType.INTEGRATION,
  PrismaTaskWorkType.REFACTOR,
] as const satisfies readonly TaskWorkType[];

export const DEFAULT_TASK_WORK_TYPE: TaskWorkType = PrismaTaskWorkType.FEATURE;

export const TASK_WORK_TYPE_LABELS: Record<TaskWorkType, string> = {
  [PrismaTaskWorkType.FEATURE]: "Feature",
  [PrismaTaskWorkType.BUG]: "Bug",
  [PrismaTaskWorkType.IMPROVEMENT]: "Improvement",
  [PrismaTaskWorkType.TECH_DEBT]: "Tech debt",
  [PrismaTaskWorkType.INTEGRATION]: "Integration",
  [PrismaTaskWorkType.REFACTOR]: "Refactor",
};

export const TASK_WORK_TYPE_OPTIONS = TASK_WORK_TYPE_VALUES.map((value) => ({
  value,
  label: TASK_WORK_TYPE_LABELS[value],
}));
