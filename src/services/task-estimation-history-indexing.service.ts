import "server-only";
import type { PineconeRecord } from "@pinecone-database/pinecone";
import { historicalEstimationSeedCandidates } from "@/lib/data/historical-estimation-tasks";
import type { HistoricalTaskRecord } from "@/lib/types/task.types";
import {
  getHistoricalTaskSkipReason,
  normalizeHistoricalTask,
  type HistoricalTaskSkipReason,
} from "@/lib/utils/task-estimation-history.utils";
import {
  buildHistoricalTaskVectorId,
  buildHistoricalTaskVectorMetadata,
  type HistoricalTaskVectorMetadata,
} from "@/lib/vector-search/historical-task-vectors";
import { buildTaskEmbeddingText } from "@/lib/vector-search/task-embedding-text";
import { generateTaskEmbedding } from "@/lib/vector-search/task-embeddings";
import { getPineconeIndex } from "@/lib/vector-search/pinecone";

export type HistoricalTaskIndexSkip = {
  taskId: number;
  reason: HistoricalTaskSkipReason;
};

export type HistoricalTaskIndexSummary = {
  success: true;
  inspected: number;
  eligible: number;
  indexed: number;
  skipped: number;
  skippedItems: HistoricalTaskIndexSkip[];
};

async function buildHistoricalTaskVector(
  task: HistoricalTaskRecord,
): Promise<PineconeRecord<HistoricalTaskVectorMetadata>> {
  const values = await generateTaskEmbedding(
    buildTaskEmbeddingText({
      title: task.title,
      description: task.description,
      type: task.type,
    }),
  );

  return {
    id: buildHistoricalTaskVectorId(task.id),
    values,
    metadata: buildHistoricalTaskVectorMetadata(task),
  };
}

export async function indexHistoricalEstimationTasks(): Promise<HistoricalTaskIndexSummary> {
  const inspectionResults = historicalEstimationSeedCandidates.map((task) => {
    const reason = getHistoricalTaskSkipReason(task);

    if (reason) {
      return {
        eligibleTask: null,
        skippedItem: {
          taskId: task.id,
          reason,
        },
      };
    }

    return {
      eligibleTask: normalizeHistoricalTask(task),
      skippedItem: null,
    };
  });

  const eligibleTasks = inspectionResults
    .map((result) => result.eligibleTask)
    .filter((task): task is HistoricalTaskRecord => task !== null);
  const skippedItems = inspectionResults
    .map((result) => result.skippedItem)
    .filter((item): item is HistoricalTaskIndexSkip => item !== null);

  if (eligibleTasks.length > 0) {
    const vectors = await Promise.all(eligibleTasks.map(buildHistoricalTaskVector));
    await getPineconeIndex<HistoricalTaskVectorMetadata>().upsert({
      records: vectors,
    });

    return {
      success: true,
      inspected: historicalEstimationSeedCandidates.length,
      eligible: eligibleTasks.length,
      indexed: vectors.length,
      skipped: skippedItems.length,
      skippedItems,
    };
  }

  return {
    success: true,
    inspected: historicalEstimationSeedCandidates.length,
    eligible: eligibleTasks.length,
    indexed: 0,
    skipped: skippedItems.length,
    skippedItems,
  };
}
