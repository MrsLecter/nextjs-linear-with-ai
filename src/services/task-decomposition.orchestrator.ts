import type {
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseFunctionToolCall,
  ResponseInput,
  ResponseInputItem,
  ToolChoiceFunction,
} from "openai/resources/responses/responses";
import { clientOpenAI, OPENAI_MAX_OUTPUT_TOKENS } from "@/lib/ai/openai";
import {
  TASK_DECOMPOSITION_AGENT_SYSTEM_PROMPT,
  TASK_DECOMPOSITION_ASSESSMENT_SYSTEM_PROMPT,
  TASK_DECOMPOSITION_GENERATION_SYSTEM_PROMPT,
} from "@/lib/ai/features/task-decomposition/prompts";
import {
  ASSESS_TASK_DECOMPOSITION_TOOL_NAME,
  GENERATE_SUBTASKS_TOOL_NAME,
  TASK_DECOMPOSITION_MODEL,
  TASK_DECOMPOSITION_TIMEOUT_MS,
} from "@/lib/ai/features/task-decomposition/constants";
import {
  assessmentToolInputSchema,
  assessmentToolOutputSchema,
  decompositionPreviewResponseSchema,
  generateSubtasksToolInputSchema,
  generateSubtasksToolOutputSchema,
  type AssessmentToolInput,
  type AssessmentToolOutput,
  type DecompositionPreviewResponse,
  type GenerateSubtasksToolInput,
  type GenerateSubtasksToolOutput,
} from "@/lib/validation/task-decomposition.schemas";
import { TaskDecompositionError } from "@/services/task-decomposition.errors";

type TaskDraftInput = {
  title: string;
  description: string;
  maxSubtasks: number;
};
type ReadyAssessmentOutput = {
  status: "ready";
  reason: string;
};
type TaskDecompositionToolName =
  | typeof ASSESS_TASK_DECOMPOSITION_TOOL_NAME
  | typeof GENERATE_SUBTASKS_TOOL_NAME;

type TaskDecompositionToolState = {
  assessment: AssessmentToolOutput | null;
  generatedSubtasks: GenerateSubtasksToolOutput | null;
};

type ToolDispatchOutcome = {
  finalResult: DecompositionPreviewResponse | null;
  nextInput: ResponseInput | null;
};

export const DEFAULT_MAX_SUBTASKS = 7;
const MAX_DECOMPOSITION_TOOL_STEPS = 2;

const assessmentTool = {
  type: "function" as const,
  name: ASSESS_TASK_DECOMPOSITION_TOOL_NAME,
  description:
    "Assess whether the provided task draft needs clarification, should not be decomposed, or is ready for subtask generation.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: {
        type: "string",
        description: "The current task draft title.",
      },
      description: {
        type: "string",
        description: "The current task draft description.",
      },
    },
    required: ["title", "description"],
  },
};

const generateSubtasksTool = {
  type: "function" as const,
  name: GENERATE_SUBTASKS_TOOL_NAME,
  description:
    "Generate an ordered preview of subtasks for a task draft that has already been assessed as ready.",
  strict: true,
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: {
        type: "string",
        description: "The current task draft title.",
      },
      description: {
        type: "string",
        description: "The current task draft description.",
      },
      maxSubtasks: {
        type: "integer",
        description: "Upper bound for the number of subtasks to generate.",
      },
    },
    required: ["title", "description", "maxSubtasks"],
  },
};

const taskDecompositionTools = [assessmentTool, generateSubtasksTool] as const;

const forcedAssessmentToolChoice: ToolChoiceFunction = {
  type: "function",
  name: ASSESS_TASK_DECOMPOSITION_TOOL_NAME,
};

const forcedGenerationToolChoice: ToolChoiceFunction = {
  type: "function",
  name: GENERATE_SUBTASKS_TOOL_NAME,
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TaskDecompositionError(
        `Task decomposition timed out after ${timeoutMs}ms.`,
        { statusCode: 504, code: "task_decomposition_timeout" },
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

function parseJsonOutput<T>(
  response: Response,
  schema: { parse: (value: unknown) => T },
  errorMessage: string,
): T {
  if (!response.output_text || response.output_text.trim().length === 0) {
    throw new TaskDecompositionError(errorMessage, {
      statusCode: 502,
      code: "invalid_model_output",
    });
  }

  try {
    return schema.parse(JSON.parse(response.output_text));
  } catch {
    throw new TaskDecompositionError(errorMessage, {
      statusCode: 502,
      code: "invalid_model_output",
    });
  }
}

function getRequiredFunctionCall(
  response: Response,
  expectedToolName: TaskDecompositionToolName,
): ResponseFunctionToolCall {
  const toolCalls = response.output.filter(
    (item): item is ResponseFunctionToolCall => item.type === "function_call",
  );

  if (toolCalls.length === 0) {
    throw new TaskDecompositionError(
      `Model did not call ${expectedToolName} when required.`,
      {
        statusCode: 502,
        code: "missing_tool_call",
      },
    );
  }

  if (toolCalls.length > 1) {
    throw new TaskDecompositionError(
      "Model returned too many tool calls in a single step.",
      {
        statusCode: 502,
        code: "unexpected_multiple_tool_calls",
      },
    );
  }

  const [toolCall] = toolCalls;

  if (!toolCall || toolCall.name !== expectedToolName) {
    throw new TaskDecompositionError(
      `Model called ${toolCall?.name ?? "an unexpected tool"} instead of ${expectedToolName}.`,
      {
        statusCode: 502,
        code: "unexpected_tool_call_order",
      },
    );
  }

  return toolCall;
}

function assertToolMatchesDraft(
  toolName: TaskDecompositionToolName,
  draft: TaskDraftInput,
  args: Pick<GenerateSubtasksToolInput, "title" | "description"> & {
    maxSubtasks?: number;
  },
): void {
  const matchesDraft = args.title === draft.title &&
    args.description === draft.description &&
    (toolName !== GENERATE_SUBTASKS_TOOL_NAME || args.maxSubtasks === draft.maxSubtasks);

  if (!matchesDraft) {
    throw new TaskDecompositionError(
      `The model returned invalid arguments for ${toolName}.`,
      {
        statusCode: 502,
        code: "tool_arguments_do_not_match_task_draft",
      },
    );
  }
}

function normalizeAssessmentResult(
  assessment: AssessmentToolOutput,
): DecompositionPreviewResponse {
  return decompositionPreviewResponseSchema.parse(assessment);
}

function normalizeReadyResult(
  assessment: ReadyAssessmentOutput,
  generated: GenerateSubtasksToolOutput,
): DecompositionPreviewResponse {
  const normalizedSubtasks = generateSubtasksToolOutputSchema.parse({
    subtasks: generated.subtasks,
  });

  return decompositionPreviewResponseSchema.parse({
    status: "ready",
    reason: assessment.reason,
    subtasks: normalizedSubtasks.subtasks,
  });
}

function parseFunctionArguments<T>(
  toolCall: ResponseFunctionToolCall,
  schema: { parse: (value: unknown) => T },
  errorCode: string,
): T {
  try {
    return schema.parse(JSON.parse(toolCall.arguments));
  } catch {
    throw new TaskDecompositionError("The model returned invalid tool arguments.", {
      statusCode: 502,
      code: errorCode,
    });
  }
}

function buildAgentInput(input: TaskDraftInput): string {
  return JSON.stringify({
    taskDraft: {
      title: input.title,
      description: input.description,
      maxSubtasks: input.maxSubtasks,
    },
  });
}

async function createAgentResponse(params: {
  input: string | ResponseInput;
  previousResponseId?: string;
  toolChoice: ToolChoiceFunction;
}): Promise<Response> {
  const request: ResponseCreateParamsNonStreaming = {
    model: TASK_DECOMPOSITION_MODEL,
    instructions: TASK_DECOMPOSITION_AGENT_SYSTEM_PROMPT,
    input: params.input,
    previous_response_id: params.previousResponseId,
    tools: [...taskDecompositionTools],
    tool_choice: params.toolChoice,
    parallel_tool_calls: false,
    max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
    stream: false,
  };

  return withTimeout(
    clientOpenAI.responses.create(request),
    TASK_DECOMPOSITION_TIMEOUT_MS,
  );
}

function buildAssessmentPrompt(input: AssessmentToolInput): string {
  return JSON.stringify({
    title: input.title,
    description: input.description,
  });
}

function buildSubtaskGenerationPrompt(input: GenerateSubtasksToolInput): string {
  return JSON.stringify({
    title: input.title,
    description: input.description,
    maxSubtasks: input.maxSubtasks ?? DEFAULT_MAX_SUBTASKS,
  });
}

function buildToolOutputItem(
  callId: string,
  output: unknown,
): ResponseInputItem.FunctionCallOutput {
  return {
    type: "function_call_output",
    call_id: callId,
    output: JSON.stringify(output),
  };
}

function assertReadyAssessment(
  assessment: AssessmentToolOutput | null,
): asserts assessment is ReadyAssessmentOutput {
  if (!assessment || assessment.status !== "ready") {
    throw new TaskDecompositionError(
      "Model attempted to generate subtasks before a ready assessment.",
      {
        statusCode: 502,
        code: "generate_before_ready_assessment",
      },
    );
  }
}

async function runAssessmentTool(
  input: AssessmentToolInput,
): Promise<AssessmentToolOutput> {
  const response = await withTimeout(
    clientOpenAI.responses.create({
      model: TASK_DECOMPOSITION_MODEL,
      instructions: TASK_DECOMPOSITION_ASSESSMENT_SYSTEM_PROMPT,
      input: buildAssessmentPrompt(input),
      max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
      text: {
        format: {
          type: "json_schema",
          name: "task_decomposition_assessment",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              status: {
                type: "string",
                enum: ["needs_clarification", "cannot_decompose", "ready"],
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
            },
            required: ["status", "reason", "questions"],
          },
        },
        verbosity: "low",
      },
    }),
    TASK_DECOMPOSITION_TIMEOUT_MS,
  );

  return parseJsonOutput(
    response,
    assessmentToolOutputSchema,
    "The model returned an invalid task decomposition assessment.",
  );
}

export async function assessTaskDecompositionDraft(
  input: AssessmentToolInput,
): Promise<AssessmentToolOutput> {
  const parsedInput = assessmentToolInputSchema.parse(input);

  return runAssessmentTool(parsedInput);
}

async function runGenerateSubtasksTool(
  input: GenerateSubtasksToolInput,
): Promise<GenerateSubtasksToolOutput> {
  const response = await withTimeout(
    clientOpenAI.responses.create({
      model: TASK_DECOMPOSITION_MODEL,
      instructions: TASK_DECOMPOSITION_GENERATION_SYSTEM_PROMPT,
      input: buildSubtaskGenerationPrompt(input),
      max_output_tokens: OPENAI_MAX_OUTPUT_TOKENS,
      text: {
        format: {
          type: "json_schema",
          name: "task_decomposition_subtasks",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              subtasks: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    order: { type: "integer" },
                  },
                  required: ["title", "description", "order"],
                },
              },
            },
            required: ["subtasks"],
          },
        },
        verbosity: "low",
      },
    }),
    TASK_DECOMPOSITION_TIMEOUT_MS,
  );

  return parseJsonOutput(
    response,
    generateSubtasksToolOutputSchema,
    "The model returned an invalid subtask preview.",
  );
}

async function dispatchToolCall(params: {
  draft: TaskDraftInput;
  toolCall: ResponseFunctionToolCall;
  state: TaskDecompositionToolState;
}): Promise<ToolDispatchOutcome> {
  const { draft, toolCall, state } = params;

  switch (toolCall.name) {
    case ASSESS_TASK_DECOMPOSITION_TOOL_NAME: {
      if (state.assessment) {
        throw new TaskDecompositionError(
          "Assessment was requested more than once.",
          {
            statusCode: 502,
            code: "duplicate_assessment_tool_call",
          },
        );
      }

      const assessmentArgs = parseFunctionArguments(
        toolCall,
        assessmentToolInputSchema,
        "invalid_assessment_tool_arguments",
      );

      assertToolMatchesDraft(toolCall.name, draft, assessmentArgs);

      const assessment = await runAssessmentTool(assessmentArgs);
      state.assessment = assessment;

      if (assessment.status !== "ready") {
        return {
          finalResult: normalizeAssessmentResult(assessment),
          nextInput: null,
        };
      }

      return {
        finalResult: null,
        nextInput: [buildToolOutputItem(toolCall.call_id, assessment)],
      };
    }

    case GENERATE_SUBTASKS_TOOL_NAME: {
      if (!state.assessment) {
        throw new TaskDecompositionError(
          "Model attempted to generate subtasks before assessment.",
          {
            statusCode: 502,
            code: "generate_before_assessment",
          },
        );
      }

      assertReadyAssessment(state.assessment);

      if (state.generatedSubtasks) {
        throw new TaskDecompositionError(
          "Subtasks were requested more than once.",
          {
            statusCode: 502,
            code: "duplicate_generate_subtasks_tool_call",
          },
        );
      }

      const generationArgs = parseFunctionArguments(
        toolCall,
        generateSubtasksToolInputSchema,
        "invalid_generate_subtasks_arguments",
      );

      assertToolMatchesDraft(toolCall.name, draft, generationArgs);

      const generated = await runGenerateSubtasksTool({
        ...generationArgs,
        maxSubtasks: generationArgs.maxSubtasks ?? DEFAULT_MAX_SUBTASKS,
      });

      state.generatedSubtasks = generated;

      return {
        finalResult: normalizeReadyResult(state.assessment, generated),
        nextInput: [buildToolOutputItem(toolCall.call_id, generated)],
      };
    }

    default: {
      throw new TaskDecompositionError(
        `Unknown tool requested: ${toolCall.name}`,
        {
          statusCode: 502,
          code: "unknown_tool_call",
        },
      );
    }
  }
}

function ensureLoopEndedInFinalState(
  state: TaskDecompositionToolState,
): never {
  if (!state.assessment) {
    throw new TaskDecompositionError(
      "Task decomposition ended before assessment completed.",
      {
        statusCode: 502,
        code: "missing_assessment_result",
      },
    );
  }

  if (state.assessment.status !== "ready") {
    throw new TaskDecompositionError(
      "Task decomposition ended unexpectedly after assessment.",
      {
        statusCode: 502,
        code: "unexpected_terminal_state",
      },
    );
  }

  throw new TaskDecompositionError(
    "Task decomposition ended before subtask generation completed.",
    {
      statusCode: 502,
      code: "missing_generate_subtasks_result",
    },
  );
}

const decompositionLoopPlan: ReadonlyArray<{
  expectedToolName: TaskDecompositionToolName;
  toolChoice: ToolChoiceFunction;
}> = [
    {
      expectedToolName: ASSESS_TASK_DECOMPOSITION_TOOL_NAME,
      toolChoice: forcedAssessmentToolChoice,
    },
    {
      expectedToolName: GENERATE_SUBTASKS_TOOL_NAME,
      toolChoice: forcedGenerationToolChoice,
    },
  ];

export class TaskDecompositionAgent {
  async preview(input: {
    title: string;
    description: string;
    maxSubtasks?: number;
  }): Promise<DecompositionPreviewResponse> {
    const draft = generateSubtasksToolInputSchema.parse({
      ...input,
      maxSubtasks: input.maxSubtasks ?? DEFAULT_MAX_SUBTASKS,
    });
    const state: TaskDecompositionToolState = {
      assessment: null,
      generatedSubtasks: null,
    };

    let previousResponseId: string | undefined;
    let nextInput: string | ResponseInput = buildAgentInput(draft);

    for (const [stepIndex, step] of decompositionLoopPlan.entries()) {
      if (stepIndex >= MAX_DECOMPOSITION_TOOL_STEPS) {
        break;
      }

      const response = await createAgentResponse({
        input: nextInput,
        previousResponseId,
        toolChoice: step.toolChoice,
      });

      const toolCall = getRequiredFunctionCall(response, step.expectedToolName);
      const outcome = await dispatchToolCall({
        draft,
        toolCall,
        state,
      });

      if (outcome.finalResult) {
        return outcome.finalResult;
      }

      previousResponseId = response.id;
      nextInput = outcome.nextInput ?? [];
    }

    return ensureLoopEndedInFinalState(state);
  }
}

export const taskDecompositionAgent = new TaskDecompositionAgent();
