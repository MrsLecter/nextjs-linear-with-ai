import type { Task } from "#prisma/browser";

type PrioritizationConfidence = "low" | "medium" | "high";

export type PrioritizationResult = {
  recommendedTaskId: Task["id"];
  recommendedTaskTitle: Task["title"];
  explanation: string;
  confidence: PrioritizationConfidence;
  alternatives?: {
    taskId: Task["id"];
    whyNotFirst: string;
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
