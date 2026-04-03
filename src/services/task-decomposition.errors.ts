import OpenAI from "openai";

export class TaskDecompositionError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, options?: { statusCode?: number; code?: string }) {
    super(message);
    this.name = "TaskDecompositionError";
    this.statusCode = options?.statusCode ?? 500;
    this.code = options?.code ?? "task_decomposition_error";
  }
}

export function isTaskDecompositionError(
  error: unknown,
): error is TaskDecompositionError {
  return error instanceof TaskDecompositionError;
}

export function isOpenAIErrorWithStatus(error: unknown): error is OpenAI.APIError {
  return error instanceof OpenAI.APIError;
}
