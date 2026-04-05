import type { Task } from "#prisma/browser";
import type { TaskEstimationValue } from "@/lib/constants/task.constants";

export type ParentTaskSummary = {
  id: Task["id"];
  title: Task["title"];
};

export type TaskWithParent = Task & {
  estimation?: TaskEstimationValue | null;
  parentTask?: ParentTaskSummary | null;
};
