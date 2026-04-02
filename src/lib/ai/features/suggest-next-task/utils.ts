import { TaskPriority, TaskStatus } from "#prisma/browser";
import type {
  SuggestedNextTaskResult,
  SuggestedTaskCandidate,
} from "@/lib/ai/features/suggest-next-task/types";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/constants/task.constants";

function getPriorityScore(priority: SuggestedTaskCandidate["priority"]): number {
  switch (priority) {
    case TaskPriority.HIGH:
      return 2;
    case TaskPriority.MEDIUM:
      return 1;
    default:
      return 0;
  }
}

function getStatusScore(status: SuggestedTaskCandidate["status"]): number {
  switch (status) {
    case TaskStatus.TODO:
      return 1;
    case TaskStatus.IN_PROGRESS:
      return 0.5;
    default:
      return 0;
  }
}

export function getAgeScore(
  createdAt: string | Date,
  now: Date = new Date(),
): number {
  const createdAtDate =
    createdAt instanceof Date ? createdAt : new Date(createdAt);

  if (Number.isNaN(createdAtDate.getTime())) {
    throw new Error("Invalid createdAt value passed to getAgeScore");
  }

  const ageMs = now.getTime() - createdAtDate.getTime();
  const ageInDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  if (ageInDays >= 14) return 2;
  if (ageInDays >= 7) return 1;
  if (ageInDays >= 3) return 0.5;
  return 0;
}

export function calculateTaskScore(
  task: Pick<SuggestedTaskCandidate, "priority" | "status" | "createdAt">,
  now: Date = new Date(),
): number {
  return (
    getPriorityScore(task.priority) +
    getStatusScore(task.status) +
    getAgeScore(task.createdAt, now)
  );
}

function compareTasks(
  left: SuggestedTaskCandidate,
  right: SuggestedTaskCandidate,
): number {
  const scoreDifference = calculateTaskScore(right) - calculateTaskScore(left);

  if (scoreDifference !== 0) {
    return scoreDifference;
  }

  const createdAtDifference =
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();

  if (createdAtDifference !== 0) {
    return createdAtDifference;
  }

  return String(left.id).localeCompare(String(right.id));
}

function buildExplanation(task: SuggestedTaskCandidate): string {
  const priorityLabel = TASK_PRIORITY_LABELS[task.priority].toLowerCase();
  const statusLabel = TASK_STATUS_LABELS[task.status].toLowerCase();

  return [
    `This task is recommended because it has the strongest baseline score.`,
    `It is ${priorityLabel} priority and currently ${statusLabel}.`,
  ].join(" ");
}

export async function mockSuggestNextTask(
  tasks: SuggestedTaskCandidate[],
): Promise<SuggestedNextTaskResult | null> {
  const actionableTasks = [...tasks]
    .filter((task) => task.status !== TaskStatus.DONE)
    .sort(compareTasks);

  const recommendedTask = actionableTasks[0];

  if (!recommendedTask) {
    return null;
  }

  return {
    recommendedTaskId: recommendedTask.id,
    recommendedTaskTitle: recommendedTask.title,
    explanation: buildExplanation(recommendedTask),
  };
}