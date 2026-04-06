import "server-only";
import { clientOpenAI } from "@/lib/ai/openai";
import {
  TASK_ESTIMATION_RETRIEVAL_TOP_K,
} from "@/lib/ai/features/task-estimation/constants";
import { DEFAULT_TASK_WORK_TYPE } from "@/lib/constants/task-work-type.constants";
import type { EstimateTaskRequest } from "@/lib/types/task-estimation.types";
import { generateTaskEmbedding } from "@/lib/vector-search/task-embeddings";
import { buildTaskEmbeddingText } from "@/lib/vector-search/task-embedding-text";
import {
  findSimilarHistoricalTasks,
  type RetrievedHistoricalTaskMatch,
} from "@/lib/vector-search/historical-task-retrieval";
import { assessTaskDecompositionDraft } from "@/services/task-decomposition.orchestrator";
import { TaskEstimationError } from "@/services/task-estimation.errors";
import { createTaskEstimator } from "@/services/task-estimation.core";

function normalizeTaskType(type: EstimateTaskRequest["type"]) {
  return type ?? DEFAULT_TASK_WORK_TYPE;
}

async function buildCurrentTaskEmbedding(input: EstimateTaskRequest): Promise<number[]> {
  try {
    const embeddingText = buildTaskEmbeddingText({
      title: input.title,
      description: input.description,
      // The retrieval index stores a concrete work type, so queries without an
      // explicit type use the shared default instead of drifting to ad-hoc text.
      type: normalizeTaskType(input.type),
    });

    return await generateTaskEmbedding(embeddingText);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown embedding error.";

    throw new TaskEstimationError(
      `Failed to generate a task embedding. ${message}`,
      {
        statusCode: 502,
        code: "embedding_generation_failed",
      },
    );
  }
}

async function retrieveSimilarTasks(embedding: number[]): Promise<RetrievedHistoricalTaskMatch[]> {
  try {
    return await findSimilarHistoricalTasks({
      embedding,
      topK: TASK_ESTIMATION_RETRIEVAL_TOP_K,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Pinecone query error.";

    throw new TaskEstimationError(
      `Failed to query similar historical tasks. ${message}`,
      {
        statusCode: 502,
        code: "pinecone_query_failed",
      },
    );
  }
}

export const estimateTask = createTaskEstimator({
  assessTaskClarification: assessTaskDecompositionDraft,
  buildCurrentTaskEmbedding,
  retrieveSimilarTasks,
  responsesClient: clientOpenAI.responses,
});
