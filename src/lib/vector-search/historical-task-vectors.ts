import type { TaskEstimationValue } from "@/lib/constants/task.constants";
import type { HistoricalTaskRecord, TaskWorkType } from "@/lib/types/task.types";

export type HistoricalTaskVectorMetadata = {
  taskId: number;
  title: string;
  description: string;
  estimation: TaskEstimationValue;
  type: TaskWorkType;
  status: HistoricalTaskRecord["status"];
  createdAt: string;
  parentTaskId?: number;
};

// Stable IDs make Pinecone writes idempotent, so repeated ingestion runs upsert
// the same historical task instead of creating duplicate vectors.
export function buildHistoricalTaskVectorId(taskId: number): string {
  return `task-${taskId}`;
}

export function buildHistoricalTaskVectorMetadata(
  task: HistoricalTaskRecord,
): HistoricalTaskVectorMetadata {
  return {
    taskId: task.id,
    title: task.title,
    description: task.description,
    estimation: task.estimation,
    type: task.type,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    ...(task.parentTaskId !== null ? { parentTaskId: task.parentTaskId } : {}),
  };
}
