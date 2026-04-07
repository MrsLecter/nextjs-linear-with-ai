import {
  TASK_ESTIMATION_MODEL,
  TASK_ESTIMATION_TIMEOUT_MS,
} from "@/lib/ai/features/task-estimation/constants";
import {
  buildTaskEstimationPrompt,
  TASK_ESTIMATION_SYSTEM_PROMPT,
} from "@/lib/ai/features/task-estimation/prompts";
import { OPENAI_MAX_OUTPUT_TOKENS } from "@/lib/ai/openai";
import type {
  EstimateTaskRequest,
  EstimateTaskClarificationResult,
  EstimateTaskResult,
} from "@/lib/types/task-estimation.types";
import type { DecompositionAssessment } from "@/lib/ai/features/task-decomposition/types";
import type { RetrievedHistoricalTaskMatch } from "@/lib/vector-search/historical-task-retrieval";
import {
  estimateTaskModelResponseSchema,
  estimateTaskResultSchema,
  type EstimateTaskModelResponse,
} from "@/lib/validation/task-estimation.schemas";
import { TaskEstimationError } from "@/services/task-estimation.errors";
import type { Responses } from "openai/resources/responses/responses";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TaskEstimationError(
        `Task estimation timed out after ${timeoutMs}ms.`,
        {
          statusCode: 504,
          code: "task_estimation_timeout",
        },
      ));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function parseJsonOutput(rawOutput: string): EstimateTaskModelResponse {
  try {
    return estimateTaskModelResponseSchema.parse(JSON.parse(rawOutput));
  } catch {
    throw new TaskEstimationError(
      "The model returned an invalid estimation response.",
      {
        statusCode: 502,
        code: "invalid_estimation_response",
      },
    );
  }
}

function normalizeConfidence(
  requestedConfidence: Extract<
    EstimateTaskModelResponse,
    { status: "ready" }
  >["confidence"],
  similarTaskCount: number,
): Extract<EstimateTaskResult, { status: "ready" }>["confidence"] {
  if (similarTaskCount <= 1) {
    return "low";
  }

  if (similarTaskCount === 2 && requestedConfidence === "high") {
    return "medium";
  }

  return requestedConfidence;
}

function normalizeSimilarTasksUsed(
  modelResponse: Extract<EstimateTaskModelResponse, { status: "ready" }>,
  retrievedTasks: RetrievedHistoricalTaskMatch[],
): Extract<EstimateTaskResult, { status: "ready" }>["similarTasksUsed"] {
  const tasksById = new Map(retrievedTasks.map((task) => [task.taskId, task]));
  const seenIds = new Set<number>();

  return modelResponse.similarTasksUsed.map((taskRef) => {
    const matchedTask = tasksById.get(taskRef.taskId);

    if (!matchedTask) {
      throw new TaskEstimationError(
        `The model referenced a similar task that was not retrieved: ${taskRef.taskId}.`,
        {
          statusCode: 502,
          code: "invalid_estimation_response",
        },
      );
    }

    if (seenIds.has(matchedTask.taskId)) {
      throw new TaskEstimationError(
        `The model referenced duplicate similar tasks: ${matchedTask.taskId}.`,
        {
          statusCode: 502,
          code: "invalid_estimation_response",
        },
      );
    }

    seenIds.add(matchedTask.taskId);

    return {
      taskId: matchedTask.taskId,
      title: matchedTask.title,
      estimation: matchedTask.estimation,
    };
  });
}

async function callTaskEstimationModel(params: {
  input: EstimateTaskRequest;
  similarTasks: RetrievedHistoricalTaskMatch[];
  responsesClient: Pick<Responses, "create">;
}): Promise<EstimateTaskModelResponse> {
  const prompt = buildTaskEstimationPrompt({
    currentTask: params.input,
    similarTasks: params.similarTasks,
  });

  let responseText: string;

  try {
    const response = await withTimeout(
      params.responsesClient.create({
        model: TASK_ESTIMATION_MODEL,
        instructions: TASK_ESTIMATION_SYSTEM_PROMPT,
        input: prompt,
        max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
        text: {
          format: {
            type: "json_schema",
            name: "task_estimation_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                status: {
                  type: "string",
                  enum: ["needs_clarification", "ready"],
                },
                reason: {
                  type: "string",
                },
                questions: {
                  type: ["array", "null"],
                  items: {
                    type: "string",
                  },
                },
                estimate: {
                  type: ["integer", "null"],
                  enum: [0, 1, 2, 3, 5, 8, null],
                },
                confidence: {
                  type: ["string", "null"],
                  enum: ["low", "medium", "high", null],
                },
                similarTasksUsed: {
                  type: ["array", "null"],
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      taskId: {
                        type: "integer",
                      },
                    },
                    required: ["taskId"],
                  },
                },
              },
              required: [
                "status",
                "reason",
                "questions",
                "estimate",
                "confidence",
                "similarTasksUsed",
              ],
            },
          },
          verbosity: "low",
        },
      }),
      TASK_ESTIMATION_TIMEOUT_MS,
    );

    responseText = response.output_text?.trim() ?? "";
  } catch (error) {
    if (error instanceof TaskEstimationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown estimation model error.";

    throw new TaskEstimationError(
      `Failed to estimate the task. ${message}`,
      {
        statusCode: 502,
        code: "estimation_model_failed",
      },
    );
  }

  if (responseText.length === 0) {
    throw new TaskEstimationError(
      "The model returned an empty estimation response.",
      {
        statusCode: 502,
        code: "invalid_estimation_response",
      },
    );
  }

  return parseJsonOutput(responseText);
}

type EstimateTaskDependencies = {
  assessTaskClarification: (
    input: Pick<EstimateTaskRequest, "title" | "description">
  ) => Promise<DecompositionAssessment>;
  buildCurrentTaskEmbedding: (input: EstimateTaskRequest) => Promise<number[]>;
  retrieveSimilarTasks: (embedding: number[]) => Promise<RetrievedHistoricalTaskMatch[]>;
  responsesClient: Pick<Responses, "create">;
};

function toEstimationClarificationResult(
  assessment: Extract<DecompositionAssessment, { status: "needs_clarification" }>,
): EstimateTaskClarificationResult {
  return estimateTaskResultSchema.parse({
    status: "needs_clarification",
    reason: assessment.reason,
    questions: assessment.questions,
  }) as EstimateTaskClarificationResult;
}

export function createTaskEstimator(
  dependencies: EstimateTaskDependencies,
) {
  return async function estimateTaskWithDependencies(
    input: EstimateTaskRequest,
  ): Promise<EstimateTaskResult> {
    const assessment = await dependencies.assessTaskClarification({
      title: input.title,
      description: input.description,
    });

    if (assessment.status === "needs_clarification") {
      return toEstimationClarificationResult(assessment);
    }

    const embedding = await dependencies.buildCurrentTaskEmbedding(input);
    const similarTasks = await dependencies.retrieveSimilarTasks(embedding);
    const modelResponse = await callTaskEstimationModel({
      input,
      similarTasks,
      responsesClient: dependencies.responsesClient,
    });

    if (modelResponse.status === "needs_clarification") {
      return estimateTaskResultSchema.parse({
        status: "needs_clarification",
        reason: modelResponse.reason,
        questions: modelResponse.questions,
      });
    }

    return estimateTaskResultSchema.parse({
      status: "ready",
      estimate: modelResponse.estimate,
      confidence: normalizeConfidence(modelResponse.confidence, similarTasks.length),
      reason: modelResponse.reason,
      similarTasksUsed: normalizeSimilarTasksUsed(modelResponse, similarTasks),
    });
  };
}
