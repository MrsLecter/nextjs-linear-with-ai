import type { Task } from "#prisma/browser";

export type ParentTaskSummary = {
  id: Task["id"];
  title: Task["title"];
};

export type TaskWithParent = Task & {
  parentTask?: ParentTaskSummary | null;
};
