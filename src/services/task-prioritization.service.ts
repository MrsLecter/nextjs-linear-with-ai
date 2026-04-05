import type { Task } from "#prisma/client";
import { TaskStatus } from "#prisma/browser";
import { z } from "zod";
import { clientOpenAI } from "@/lib/ai/openai";
import { calculateTaskScore } from "@/lib/ai/features/task-prioritization/utils";
import {
  getPrioritizationTasksSignature,
  PRIORITIZATION_SERVER_CACHE_TTL_MS,
} from "@/lib/utils/prioritization-cache";
import { listTasks } from "@/services/task.service";
import {
  buildPrioritizationUserPrompt,
  PRIORITIZATION_SYSTEM_PROMPT,
  type PrioritizationPromptTaskInput,
} from "@/lib/ai/features/task-prioritization/prompts";
import { PRIORITIZATION_MODEL, PRIORITIZATION_TIMEOUT_MS } from "@/lib/ai/features/task-prioritization/constants";

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

type PrioritizationModelResponse = z.infer<
  typeof prioritizationResponseSchema
>;

type PrioritizationServerCacheEntry = {
  data: PrioritizationResult | null;
  expiresAt: number;
};

const prioritizationServerCache = new Map<
  string,
  PrioritizationServerCacheEntry
>();

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

function getCachedPrioritizationResult(
  tasksSignature: string,
): PrioritizationResult | null | undefined {
  const cachedEntry = prioritizationServerCache.get(tasksSignature);

  if (!cachedEntry) {
    return undefined;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    prioritizationServerCache.delete(tasksSignature);
    return undefined;
  }

  return cachedEntry.data;
}

function setCachedPrioritizationResult(
  tasksSignature: string,
  data: PrioritizationResult | null,
): void {
  prioritizationServerCache.set(tasksSignature, {
    data,
    expiresAt: Date.now() + PRIORITIZATION_SERVER_CACHE_TTL_MS,
  });
}

function buildModelInput(tasks: ScoredTask[]): PrioritizationPromptTaskInput[] {
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
  const prompt = buildPrioritizationUserPrompt(buildModelInput(candidateTasks));

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
  const tasksSignature = getPrioritizationTasksSignature(scoredTasks);
  const cachedResult = getCachedPrioritizationResult(tasksSignature);

  if (cachedResult !== undefined) {
    return cachedResult;
  }

  if (scoredTasks.length === 0) {
    setCachedPrioritizationResult(tasksSignature, null);
    return null;
  }

  if (scoredTasks.length === 1) {
    const fallbackRecommendation = buildFallbackRecommendation(scoredTasks);
    setCachedPrioritizationResult(tasksSignature, fallbackRecommendation);
    return fallbackRecommendation;
  }

  try {
    const recommendation = await callPrioritizationModel(scoredTasks);
    setCachedPrioritizationResult(tasksSignature, recommendation);
    return recommendation;
  } catch (error) {
    console.error("Prioritization service fell back to baseline scoring:", error);
    const fallbackRecommendation = buildFallbackRecommendation(scoredTasks);
    setCachedPrioritizationResult(tasksSignature, fallbackRecommendation);
    return fallbackRecommendation;
  }
}
