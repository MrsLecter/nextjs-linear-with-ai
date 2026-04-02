import type { Task } from "#prisma/browser";

export type PrioritizationResult = {
  primaryTaskId: Task["id"];
  primaryTaskTitle: Task["title"];
  explanation: string;
  alternatives: {
    taskId: Task["id"];
    whyNotFirst: string;
  }[];
  possiblePrerequisites: {
    taskId: Task["id"];
    reason: string;
  }[];
};

export type SuggestedNextTaskResult = {
  recommendedTaskId: Task["id"];
  recommendedTaskTitle: Task["title"];
  explanation: string;
};

export type PrioritizationModalStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error";

export type SuggestedTaskCandidate = Pick<
  Task,
  "id" | "title" | "status" | "priority" | "createdAt"
>;
