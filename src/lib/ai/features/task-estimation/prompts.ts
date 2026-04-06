import {
  TASK_ESTIMATION_RULE_LIST,
  TASK_ESTIMATION_VALUES,
} from "@/lib/constants/task.constants";
import type { TaskWorkType } from "@/lib/types/task.types";
import type { RetrievedHistoricalTaskMatch } from "@/lib/vector-search/historical-task-retrieval";

export const TASK_ESTIMATION_SYSTEM_PROMPT = `You estimate the implementation size of engineering tasks for a task management product.

Return only structured JSON that matches the provided schema.

Rules:
- rely only on the provided task and similar historical tasks
- choose exactly one estimate from this fixed scale only: 0, 1, 2, 3, 5, 8
- never invent any other estimate value
- do not invent hidden scope, files, systems, or requirements
- use similar historical tasks as retrieval evidence, not as exact duplicates
- if retrieval evidence is weak or sparse, be conservative and lower confidence
- keep the reason concise, product-facing, and suitable for direct UI display
- do not output chain-of-thought or hidden reasoning
- similarTasksUsed must reference only taskId values from the provided similar historical tasks
- if none of the similar tasks are useful, return an empty similarTasksUsed array`;

type CurrentTaskPromptInput = {
  title: string;
  description: string;
  type?: TaskWorkType;
};

function formatScaleSection(): string {
  return [
    `Allowed estimation values: ${TASK_ESTIMATION_VALUES.join(", ")}`,
    "",
    "Estimation rubric:",
    ...TASK_ESTIMATION_RULE_LIST.map((rule) =>
      `- ${rule.value} -> ${rule.label}: ${rule.description} ${rule.timebox !== "" ? `(${rule.timebox})` : ""}`.trim()
    ),
  ].join("\n");
}

function formatCurrentTask(task: CurrentTaskPromptInput): string {
  return [
    "Current task:",
    `- title: ${task.title}`,
    `- description: ${task.description}`,
    `- type: ${task.type ?? "not provided"}`,
  ].join("\n");
}

function formatSimilarTask(task: RetrievedHistoricalTaskMatch, index: number): string {
  return [
    `${index + 1}. taskId=${task.taskId}`,
    `title: ${task.title}`,
    `description: ${task.description}`,
    `estimation: ${task.estimation}`,
    `type: ${task.type}`,
    `status: ${String(task.status).toLowerCase()}`,
    `similarityScore: ${task.score.toFixed(4)}`,
  ].join("\n");
}

function formatSimilarTasks(tasks: RetrievedHistoricalTaskMatch[]): string {
  if (tasks.length === 0) {
    return [
      "Similar historical tasks:",
      "- none found",
      "- confidence should be low unless the current task is extremely unambiguous on the fixed rubric alone",
    ].join("\n");
  }

  return [
    "Similar historical tasks:",
    ...tasks.map(formatSimilarTask),
  ].join("\n\n");
}

export function buildTaskEstimationPrompt(input: {
  currentTask: CurrentTaskPromptInput;
  similarTasks: RetrievedHistoricalTaskMatch[];
}): string {
  return [
    "Estimate the current engineering task using the fixed scale and retrieved historical examples.",
    "",
    formatScaleSection(),
    "",
    formatCurrentTask(input.currentTask),
    "",
    formatSimilarTasks(input.similarTasks),
    "",
    "Output requirements:",
    "- return strict JSON only",
    "- estimate must be exactly one of 0, 1, 2, 3, 5, 8",
    "- confidence must be one of low, medium, high",
    "- reason must be short and UI-friendly",
    "- similarTasksUsed must be an array of up to 3 objects with only taskId",
    "- do not include any text outside the JSON object",
  ].join("\n");
}
