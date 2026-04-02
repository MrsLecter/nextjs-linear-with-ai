import type { Task } from "#prisma/client";
import { TaskStatus } from "#prisma/browser";
import { z } from "zod";
import { clientOpenAI } from "@/lib/ai/openai";
import { calculateTaskScore } from "@/lib/ai/features/suggest-next-task/utils";
import { listTasks } from "@/services/task.service";

const PRIORITIZATION_MODEL = "gpt-5.4-mini";
const PRIORITIZATION_TIMEOUT_MS = 12_000;
const PRIORITIZATION_SYSTEM_PROMPT = `You are an AI prioritization assistant inside a task management application.

You must choose the single best next task from the provided task list.

Your goal is to identify the most important and appropriate task to work on now.

Use these principles:
- rely only on the provided task data
- never invent facts
- never invent task IDs
- never select a task with status = "done"

How to prioritize:
- title and description are the primary signals of real importance
- look for concrete signs of urgency, blocker risk, bug severity, customer impact, business impact, release impact, or time sensitivity
- prefer tasks with clear, actionable problem statements over vague or exploratory tasks when importance is otherwise similar
- use baselineScore, priority, status, and createdAt as supporting signals and tie-breakers, not as the sole source of truth
- do not overreact to words like "urgent", "critical", or "asap" unless the title/description contains concrete supporting context
- treat vague, generic, or low-actionability tasks as less compelling unless structured signals strongly support them

Output requirements:
- return strict JSON only
- no markdown
- no extra text
- explanation must be grounded only in the provided fields
- explanation must be concise and specific`;

const prioritizationResponseSchema = z
  .object({
    recommendedTaskId: z.string().trim().min(1),
    recommendedTaskTitle: z.string().trim().min(1),
    explanation: z.string().trim().min(1),
    confidence: z.enum(["low", "medium", "high"]),
    alternatives: z
      .array(
        z
          .object({
            taskId: z.string().trim().min(1),
            whyNotFirst: z.string().trim().min(1),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export type ScoredTask = Task & {
  baselineScore: number;
};

export type PrioritizationResult = {
  recommendedTaskId: number;
  recommendedTaskTitle: string;
  explanation: string;
  confidence: "low" | "medium" | "high";
  alternatives?: {
    taskId: number;
    whyNotFirst: string;
  }[];
};

type CompactTaskInput = {
  id: string;
  title: ScoredTask["title"];
  description: ScoredTask["description"];
  status: ScoredTask["status"];
  priority: ScoredTask["priority"];
  createdAt: string;
  baselineScore: number;
};

type PrioritizationModelResponse = z.infer<
  typeof prioritizationResponseSchema
>;

function isValidCreatedAt(createdAt: Task["createdAt"]): boolean {
  return !Number.isNaN(new Date(createdAt).getTime());
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Prioritization model timed out after ${timeoutMs}ms`));
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

export async function getOpenTasksWithScores(): Promise<ScoredTask[]> {
  const tasks = await listTasks({});

  return tasks
    .filter((task) => task.status !== TaskStatus.DONE)
    .filter((task) => isValidCreatedAt(task.createdAt))
    .map((task) => ({
      ...task,
      baselineScore: calculateTaskScore(task),
    }))
    .sort((left, right) => right.baselineScore - left.baselineScore);
}

function buildModelInput(tasks: ScoredTask[]): CompactTaskInput[] {
  return tasks.map((task) => ({
    id: String(task.id),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt.toISOString(),
    baselineScore: task.baselineScore,
  }));
}

function buildUserPrompt(tasks: CompactTaskInput[]): string {
  return [
    "Choose the single best next task to work on right now.",
    "",
    "Use all provided fields, but prioritize based mainly on title and description.",
    "",
    "Primary evaluation criteria from title and description:",
    "- urgency",
    "- blocker signals",
    "- customer or business impact",
    "- production or release risk",
    "- actionability and specificity",
    "- whether the task describes a concrete problem or consequence",
    "",
    "Secondary supporting signals:",
    "- baselineScore",
    "- priority",
    "- status",
    "- task age",
    "",
    "Decision rules:",
    '- never choose a task with status = "done"',
    "- treat title and description as the main source of real importance",
    "- use baselineScore as a supporting signal and tie-breaker",
    "- prefer concrete and actionable tasks over vague tasks when importance is otherwise close",
    '- prefer "todo" over "in-progress" when the semantic importance is close',
    '- do not treat words like "urgent", "critical", or "asap" as sufficient by themselves',
    "",
    "Return JSON with exactly this shape:",
    '{ "recommendedTaskId": "string", "recommendedTaskTitle": "string", "explanation": "string", "confidence": "low" | "medium" | "high", "alternatives"?: [{ "taskId": "string", "whyNotFirst": "string" }] }',
    "",
    "Explanation requirements:",
    "- 1-3 sentences",
    "- concise",
    "- specific",
    "- grounded only in the input data",
    "- mention the strongest reason or two for why this task is first now",
    "",
    "Tasks:",
    "",
    JSON.stringify(tasks),
  ].join("\n");
}

function toTaskIdKey(taskId: Task["id"] | string): string {
  return String(taskId);
}

function buildTaskLookup(tasks: ScoredTask[]): Map<string, ScoredTask> {
  return new Map(tasks.map((task) => [toTaskIdKey(task.id), task]));
}

function getTaskOrThrow(
  taskId: string,
  tasksById: Map<string, ScoredTask>,
  fieldPath: string,
): ScoredTask {
  const task = tasksById.get(taskId);

  if (!task) {
    throw new Error(
      `Prioritization consistency check failed: ${fieldPath} "${taskId}" does not exist in the source task list.`,
    );
  }

  return task;
}

function assertTaskIsOpen(task: ScoredTask, fieldPath: string): void {
  if (task.status === TaskStatus.DONE) {
    throw new Error(
      `Prioritization consistency check failed: ${fieldPath} "${toTaskIdKey(task.id)}" references a completed task.`,
    );
  }
}

export function validatePrioritizationConsistency(
  result: PrioritizationModelResponse,
  tasks: ScoredTask[],
): PrioritizationResult {
  const tasksById = buildTaskLookup(tasks);
  const recommendedTask = getTaskOrThrow(
    result.recommendedTaskId,
    tasksById,
    "recommendedTaskId",
  );
  const normalizedAlternatives = result.alternatives?.map((alternative, index) => {
    const fieldPath = `alternatives[${index}].taskId`;
    const alternativeTask = getTaskOrThrow(
      alternative.taskId,
      tasksById,
      fieldPath,
    );

    assertTaskIsOpen(alternativeTask, fieldPath);

    return {
      taskId: alternativeTask.id,
      whyNotFirst: alternative.whyNotFirst,
    };
  });

  assertTaskIsOpen(recommendedTask, "recommendedTaskId");

  return {
    recommendedTaskId: recommendedTask.id,
    recommendedTaskTitle: recommendedTask.title,
    explanation: result.explanation,
    confidence: result.confidence,
    ...(normalizedAlternatives && normalizedAlternatives.length > 0
      ? { alternatives: normalizedAlternatives }
      : {}),
  };
}

function getFallbackCandidateRank(task: ScoredTask): [number, number, string] {
  const createdAtTime = new Date(task.createdAt).getTime();

  return [
    task.baselineScore,
    Number.isNaN(createdAtTime) ? Number.NEGATIVE_INFINITY : -createdAtTime,
    toTaskIdKey(task.id),
  ];
}

function compareFallbackCandidates(left: ScoredTask, right: ScoredTask): number {
  const [leftScore, leftAgeRank, leftId] = getFallbackCandidateRank(left);
  const [rightScore, rightAgeRank, rightId] = getFallbackCandidateRank(right);

  if (leftScore !== rightScore) {
    return rightScore - leftScore;
  }

  if (leftAgeRank !== rightAgeRank) {
    return rightAgeRank - leftAgeRank;
  }

  return leftId.localeCompare(rightId);
}

function selectFallbackTask(tasks: ScoredTask[]): ScoredTask | null {
  const openTasks = tasks.filter((task) => task.status !== TaskStatus.DONE);

  if (openTasks.length === 0) {
    return null;
  }

  return [...openTasks].sort(compareFallbackCandidates)[0] ?? null;
}

function buildFallbackExplanation(): string {
  return "This task is recommended because it ranks highest by the deterministic baseline using priority, status, and age.";
}

export function buildFallbackRecommendation(
  tasks: ScoredTask[],
): PrioritizationResult | null {
  const topTask = selectFallbackTask(tasks);

  if (!topTask) {
    return null;
  }

  return {
    recommendedTaskId: topTask.id,
    recommendedTaskTitle: topTask.title,
    explanation: buildFallbackExplanation(),
    confidence:
      tasks.filter((task) => task.status !== TaskStatus.DONE).length === 1
        ? "high"
        : "medium",
  };
}

async function callPrioritizationModel(
  tasks: ScoredTask[],
): Promise<PrioritizationResult> {
  const candidateTasks = tasks.slice(0, 7);
  const prompt = buildUserPrompt(buildModelInput(candidateTasks));

  const response = await withTimeout(
    clientOpenAI.responses.create({
      model: PRIORITIZATION_MODEL,
      instructions: PRIORITIZATION_SYSTEM_PROMPT,
      input: prompt,
    }),
    PRIORITIZATION_TIMEOUT_MS,
  );

  const rawOutput = response.output_text?.trim();

  if (!rawOutput) {
    throw new Error("AI returned an empty prioritization response");
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawOutput);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("AI returned malformed JSON");
    }

    throw error;
  }

  const parsed = prioritizationResponseSchema.parse(parsedJson);

  return validatePrioritizationConsistency(parsed, candidateTasks);
}

export async function getPrioritizationRecommendation(): Promise<PrioritizationResult | null> {
  const scoredTasks = await getOpenTasksWithScores();

  if (scoredTasks.length === 0) {
    return null;
  }

  if (scoredTasks.length === 1) {
    return buildFallbackRecommendation(scoredTasks);
  }

  try {
    return await callPrioritizationModel(scoredTasks);
  } catch (error) {
    console.error("Prioritization service fell back to baseline scoring:", error);
    return buildFallbackRecommendation(scoredTasks);
  }
}
