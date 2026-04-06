export class TaskEstimationError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    options: {
      statusCode: number;
      code: string;
    },
  ) {
    super(message);
    this.name = "TaskEstimationError";
    this.statusCode = options.statusCode;
    this.code = options.code;
  }
}

export function isTaskEstimationError(error: unknown): error is TaskEstimationError {
  return error instanceof TaskEstimationError;
}
