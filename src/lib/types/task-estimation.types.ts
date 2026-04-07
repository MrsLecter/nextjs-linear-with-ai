import type { TaskEstimationValue } from "@/lib/constants/task.constants";
import type { TaskWorkType } from "@/lib/types/task.types";

export type EstimateTaskRequest = {
  title: string;
  description: string;
  type?: TaskWorkType;
};

export type EstimationConfidence = "low" | "medium" | "high";

export type EstimateTaskReadyResult = {
  status: "ready";
  estimate: TaskEstimationValue;
  confidence: EstimationConfidence;
  reason: string;
  similarTasksUsed: Array<{
    taskId: number;
    title: string;
    estimation: TaskEstimationValue;
  }>;
};

export type EstimateTaskClarificationResult = {
  status: "needs_clarification";
  reason: string;
  questions: string[];
};

export type EstimateTaskResult =
  | EstimateTaskReadyResult
  | EstimateTaskClarificationResult;

export type EstimateTaskApiResponse =
  | {
    success: true;
    data: EstimateTaskResult;
  }
  | {
    success: false;
    error: string;
    code?: string;
  };
