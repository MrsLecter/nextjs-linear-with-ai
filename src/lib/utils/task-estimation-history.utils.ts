import { TaskStatus } from "#prisma/browser";
import {
  TASK_ESTIMATION_VALUES,
  type TaskEstimationValue,
} from "@/lib/constants/task.constants";
import type { HistoricalTaskRecord, TaskWorkType } from "@/lib/types/task.types";

export type HistoricalTaskCandidate = {
  id: number;
  title: string | null;
  description: string | null;
  estimation: number | null;
  status: TaskStatus;
  type: TaskWorkType | null;
  createdAt: Date;
  parentTaskId: number | null;
};

export const HISTORICAL_TASK_SKIP_REASONS = {
  MISSING_TITLE: "missing title",
  MISSING_DESCRIPTION: "missing description",
  ESTIMATION_IS_NULL: "estimation is null",
  INVALID_ESTIMATION: "estimation is invalid",
  MISSING_TYPE: "missing type",
  TASK_NOT_DONE: "task is not done",
  ZERO_ESTIMATION_EXCLUDED: "estimation is 0 and excluded from retrieval pool",
} as const;

export type HistoricalTaskSkipReason =
  (typeof HISTORICAL_TASK_SKIP_REASONS)[keyof typeof HISTORICAL_TASK_SKIP_REASONS];

function hasNonEmptyText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTaskEstimationValue(value: number): value is TaskEstimationValue {
  return TASK_ESTIMATION_VALUES.includes(value as TaskEstimationValue);
}

export function getHistoricalTaskSkipReason(
  task: HistoricalTaskCandidate,
): HistoricalTaskSkipReason | null {
  if (!hasNonEmptyText(task.title)) {
    return HISTORICAL_TASK_SKIP_REASONS.MISSING_TITLE;
  }

  if (!hasNonEmptyText(task.description)) {
    return HISTORICAL_TASK_SKIP_REASONS.MISSING_DESCRIPTION;
  }

  if (task.estimation === null) {
    return HISTORICAL_TASK_SKIP_REASONS.ESTIMATION_IS_NULL;
  }

  if (!isTaskEstimationValue(task.estimation)) {
    return HISTORICAL_TASK_SKIP_REASONS.INVALID_ESTIMATION;
  }

  if (!task.type) {
    return HISTORICAL_TASK_SKIP_REASONS.MISSING_TYPE;
  }

  if (task.status !== TaskStatus.DONE) {
    return HISTORICAL_TASK_SKIP_REASONS.TASK_NOT_DONE;
  }

  if (task.estimation === 0) {
    return HISTORICAL_TASK_SKIP_REASONS.ZERO_ESTIMATION_EXCLUDED;
  }

  return null;
}

export function normalizeHistoricalTask(
  task: HistoricalTaskCandidate,
): HistoricalTaskRecord | null {
  if (getHistoricalTaskSkipReason(task) !== null) {
    return null;
  }

  const title = task.title!;
  const description = task.description!;
  const estimation = task.estimation as TaskEstimationValue;
  const type = task.type as TaskWorkType;

  return {
    ...task,
    title: title.trim(),
    description: description.trim(),
    estimation,
    type,
  };
}

export function isEligibleHistoricalTask(task: HistoricalTaskRecord): boolean {
  return getHistoricalTaskSkipReason(task) === null;
}

export function filterEligibleHistoricalTasks(
  tasks: HistoricalTaskCandidate[],
): HistoricalTaskRecord[] {
  return tasks
    .map(normalizeHistoricalTask)
    .filter((task): task is HistoricalTaskRecord => task !== null)
    .filter(isEligibleHistoricalTask);
}
