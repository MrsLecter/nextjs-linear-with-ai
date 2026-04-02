import type { Task } from "#prisma/browser";
import type { TaskFormInput } from "@/lib/validation/task.schemas";

export type TaskFormFieldErrors = Partial<Record<keyof TaskFormInput, string>>;

export type TaskMutationSuccess = {
  success: true;
  message: string;
  task: Task;
};

export type TaskMutationError = {
  success: false;
  formError?: string;
  fieldErrors?: TaskFormFieldErrors;
};

export type TaskMutationResult = TaskMutationSuccess | TaskMutationError;
