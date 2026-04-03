import type { TaskFormInput } from "@/lib/validation/task.schemas";
import type { TaskWithParent } from "@/lib/types/task.types";

export type TaskFormFieldErrors = Partial<Record<keyof TaskFormInput, string>>;

export type TaskMutationSuccess = {
  success: true;
  message: string;
  task: TaskWithParent;
};

export type TaskMutationError = {
  success: false;
  formError?: string;
  fieldErrors?: TaskFormFieldErrors;
};

export type TaskMutationResult = TaskMutationSuccess | TaskMutationError;
