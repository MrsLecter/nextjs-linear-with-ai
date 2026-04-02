export const TASK_DATE_SORT_DIRECTION_VALUES = ["desc", "asc"] as const;
export type TaskDateSortDirection =
  (typeof TASK_DATE_SORT_DIRECTION_VALUES)[number];
