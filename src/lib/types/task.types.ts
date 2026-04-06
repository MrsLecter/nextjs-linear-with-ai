import type { Task } from "#prisma/browser";
import type { TaskEstimationValue } from "@/lib/constants/task.constants";

export type TaskWorkType = Task["type"];

export type ParentTaskSummary = {
  id: Task["id"];
  title: Task["title"];
};

export type TaskWithParent = Task & {
  estimation?: TaskEstimationValue | null;
  parentTask?: ParentTaskSummary | null;
};

// Normalized historical task shape for retrieval-based estimation and vector DB ingestion.
// This is intentionally estimation-oriented and should not be reused as generic CRUD output.
export type HistoricalTaskRecord = {
  id: Task["id"];
  title: string;
  description: string;
  estimation: TaskEstimationValue;
  status: Task["status"];
  type: TaskWorkType;
  createdAt: Task["createdAt"];
  parentTaskId: Task["parentTaskId"];
};
