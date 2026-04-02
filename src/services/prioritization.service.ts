import type { Task } from "#prisma/client";
import { TaskStatus } from "#prisma/browser";
import { z } from "zod";
import { clientOpenAI } from "@/lib/ai/openai";
import { calculateTaskScore } from "@/lib/ai/features/suggest-next-task/utils";
import { listTasks } from "@/services/task.service";

const PRIORITIZATION_MODEL = "gpt-5.4-mini";
const PRIORITIZATION_TIMEOUT_MS = 12_000;
const PRIORITIZATION_SYSTEM_PROMPT = `You are an AI prioritization assistant inside a task management application.

You must choose one primary next task from the provided task list.

Your goal is to identify the most important and appropriate task to work on now, while also reflecting uncertainty and plausible prerequisite relationships without overstating them.

Use these principles:
- rely only on the provided task data
- never invent facts
- never invent task IDs
- never select a task with status = "done"
- do not assume hidden dependencies as facts
- if a dependency is uncertain, say so explicitly
- if a task seems important but may plausibly depend on another shortlisted task, prefer the task that more directly unblocks execution or release flow

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
- explanation must be concise and specific
- return exactly one primary task
- return up to 2 alternatives
- return up to 1 possible prerequisite
- alternatives and possiblePrerequisites must be arrays, even if empty`;

const prioritizationResponseSchema = z
  .object({
    primaryTaskId: z.string().trim().min(1),
    primaryTaskTitle: z.string().trim().min(1),
    explanation: z.string().trim().min(1),
    alternatives: z
      .array(
        z
          .object({
            taskId: z.string().trim().min(1),
            whyNotFirst: z.string().trim().min(1),
          })
          .strict(),
      )
      .max(2),
    possiblePrerequisites: z
      .array(
        z
          .object({
            taskId: z.string().trim().min(1),
            reason: z.string().trim().min(1),
          })
          .strict(),
      )
      .max(1),
  })
  .strict();

export type ScoredTask = Task & {
  baselineScore: number;
};

export type PrioritizationResult = {
  primaryTaskId: number;
  primaryTaskTitle: string;
  explanation: string;
  alternatives: {
    taskId: number;
    whyNotFirst: string;
  }[];
  possiblePrerequisites: {
    taskId: number;
    reason: string;
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
    "Choose one primary next task to work on right now.",
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
    "- if a task appears highly important but may plausibly depend on another shortlisted task, prefer the task that more directly unblocks execution or release flow",
    "- do not assume hidden dependencies as facts",
    "- when dependency is uncertain from the provided fields, reflect that uncertainty in alternatives or possiblePrerequisites",
    "",
    "Return JSON with exactly this shape:",
    '{ "primaryTaskId": "string", "primaryTaskTitle": "string", "explanation": "string", "alternatives": [{ "taskId": "string", "whyNotFirst": "string" }], "possiblePrerequisites": [{ "taskId": "string", "reason": "string" }] }',
    "",
    "Explanation requirements:",
    "- 1-3 sentences",
    "- concise",
    "- specific",
    "- grounded only in the input data",
    "- mention the strongest reason or two for why this task is first now",
    "",
    "Alternatives requirements:",
    "- include up to 2 viable alternative tasks",
    "- explain briefly why each is not first",
    "- do not include the primary task",
    "",
    "Possible prerequisite requirements:",
    "- include at most 1 task",
    "- only include it if a prerequisite relationship seems plausible from the provided fields",
    '- do not present uncertain dependencies as facts; use wording like "may unblock" or "could be needed first" when appropriate',
    "- do not include the primary task",
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
  const primaryTask = getTaskOrThrow(
    result.primaryTaskId,
    tasksById,
    "primaryTaskId",
  );
  const normalizedPrimaryTaskId = toTaskIdKey(primaryTask.id);
  const usedTaskIds = new Set<string>([normalizedPrimaryTaskId]);
  const normalizedAlternatives = result.alternatives.map((alternative, index) => {
    const fieldPath = `alternatives[${index}].taskId`;
    const alternativeTask = getTaskOrThrow(
      alternative.taskId,
      tasksById,
      fieldPath,
    );

    assertTaskIsOpen(alternativeTask, fieldPath);
    const normalizedAlternativeTaskId = toTaskIdKey(alternativeTask.id);

    if (usedTaskIds.has(normalizedAlternativeTaskId)) {
      throw new Error(
        `Prioritization consistency check failed: ${fieldPath} "${normalizedAlternativeTaskId}" is duplicated or matches the primary task.`,
      );
    }

    usedTaskIds.add(normalizedAlternativeTaskId);

    return {
      taskId: alternativeTask.id,
      whyNotFirst: alternative.whyNotFirst,
    };
  });
  const normalizedPossiblePrerequisites = result.possiblePrerequisites.map(
    (prerequisite, index) => {
      const fieldPath = `possiblePrerequisites[${index}].taskId`;
      const prerequisiteTask = getTaskOrThrow(
        prerequisite.taskId,
        tasksById,
        fieldPath,
      );

      assertTaskIsOpen(prerequisiteTask, fieldPath);

      const normalizedPrerequisiteTaskId = toTaskIdKey(prerequisiteTask.id);

      if (usedTaskIds.has(normalizedPrerequisiteTaskId)) {
        throw new Error(
          `Prioritization consistency check failed: ${fieldPath} "${normalizedPrerequisiteTaskId}" is duplicated or matches another selected task.`,
        );
      }

      usedTaskIds.add(normalizedPrerequisiteTaskId);

      return {
        taskId: prerequisiteTask.id,
        reason: prerequisite.reason,
      };
    },
  );

  assertTaskIsOpen(primaryTask, "primaryTaskId");

  return {
    primaryTaskId: primaryTask.id,
    primaryTaskTitle: primaryTask.title,
    explanation: result.explanation,
    alternatives: normalizedAlternatives,
    possiblePrerequisites: normalizedPossiblePrerequisites,
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

function rankFallbackTasks(tasks: ScoredTask[]): ScoredTask[] {
  const openTasks = tasks.filter((task) => task.status !== TaskStatus.DONE);

  if (openTasks.length === 0) {
    return [];
  }

  return [...openTasks].sort(compareFallbackCandidates);
}

function buildFallbackExplanation(primaryTask: ScoredTask): string {
  return `This task stands out as the strongest next step based on its deterministic baseline score and current execution readiness. "${primaryTask.title}" ranks highest when priority, status, and age are weighed together.`;
}

export function buildFallbackRecommendation(
  tasks: ScoredTask[],
): PrioritizationResult | null {
  const rankedTasks = rankFallbackTasks(tasks);
  const topTask = rankedTasks[0] ?? null;

  if (!topTask) {
    return null;
  }

  return {
    primaryTaskId: topTask.id,
    primaryTaskTitle: topTask.title,
    explanation: buildFallbackExplanation(topTask),
    alternatives: rankedTasks.slice(1, 3).map((task) => ({
      taskId: task.id,
      whyNotFirst:
        "This task is also a strong candidate, but it ranks slightly below the primary task on the deterministic baseline.",
    })),
    possiblePrerequisites: [],
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
