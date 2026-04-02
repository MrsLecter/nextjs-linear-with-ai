import { z } from "zod";
import { TaskPriority, TaskStatus } from "#prisma/browser";
import { TASK_DATE_SORT_DIRECTION_VALUES } from "@/lib/constants/task.constants";

export const taskStatusValues = Object.values(TaskStatus) as [TaskStatus, ...TaskStatus[]];
export const taskPriorityValues = Object.values(TaskPriority) as [TaskPriority, ...TaskPriority[]];
const taskDateSortDirectionSchema = z.enum(TASK_DATE_SORT_DIRECTION_VALUES);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long"),
  description: z.string().trim().min(1, "Description is required.").max(2000, "Description is too long"),
  status: z.enum(taskStatusValues).default(TaskStatus.TODO),
  priority: z.enum(taskPriorityValues).default(TaskPriority.MEDIUM),
});

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long"),
  description: z.string().trim().min(1, "Description is required.").max(2000, "Description is too long"),
  status: z.enum(taskStatusValues).default(TaskStatus.TODO),
  priority: z.enum(taskPriorityValues).default(TaskPriority.MEDIUM),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long").optional(),
  description: z.string().trim().min(1, "Description is required.").max(2000, "Description is too long").optional(),
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
});

export const listTasksSchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  prioritySort: z.enum(taskPriorityValues).optional(),
  dateSort: taskDateSortDirectionSchema.optional(),
});

export const deleteTaskSchema = z.object({
  id: z.number().int().positive("Invalid task ID."),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type TaskFormInput = z.infer<typeof taskFormSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

type SearchParamsValue = string | string[] | undefined;

function getSearchParamValue(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseListTasksSearchParams(
  searchParams: Record<string, SearchParamsValue>,
): ListTasksInput {
  const parsed = listTasksSchema.safeParse({
    status: getSearchParamValue(searchParams.status),
    prioritySort: getSearchParamValue(searchParams.prioritySort),
    dateSort: getSearchParamValue(searchParams.dateSort),
  });

  if (parsed.success) {
    return parsed.data;
  }

  return {};
}
