import "server-only";
import type { QueryResponse, RecordMetadata } from "@pinecone-database/pinecone";
import { getPineconeIndex } from "@/lib/vector-search/pinecone";
import type { HistoricalTaskVectorMetadata } from "@/lib/vector-search/historical-task-vectors";

export type RetrievedHistoricalTaskMatch = HistoricalTaskVectorMetadata & {
  score: number;
};

function isHistoricalTaskMetadata(
  metadata: RecordMetadata | undefined,
): metadata is HistoricalTaskVectorMetadata {
  if (!metadata) {
    return false;
  }

  return typeof metadata.taskId === "number" &&
    typeof metadata.title === "string" &&
    metadata.title.trim().length > 0 &&
    typeof metadata.description === "string" &&
    metadata.description.trim().length > 0 &&
    typeof metadata.estimation === "number" &&
    typeof metadata.type === "string" &&
    typeof metadata.status === "string" &&
    typeof metadata.createdAt === "string" &&
    (typeof metadata.parentTaskId === "number" ||
      typeof metadata.parentTaskId === "undefined");
}

function normalizeQueryMatches(
  response: QueryResponse<HistoricalTaskVectorMetadata>,
): RetrievedHistoricalTaskMatch[] {
  return response.matches.flatMap((match) => {
    if (!isHistoricalTaskMetadata(match.metadata)) {
      return [];
    }

    return [{
      ...match.metadata,
      title: match.metadata.title.trim(),
      description: match.metadata.description.trim(),
      score: match.score ?? 0,
    }];
  });
}

export async function findSimilarHistoricalTasks(params: {
  embedding: number[];
  topK: number;
}): Promise<RetrievedHistoricalTaskMatch[]> {
  const response = await getPineconeIndex<HistoricalTaskVectorMetadata>().query({
    vector: params.embedding,
    topK: params.topK,
    includeMetadata: true,
  });

  return normalizeQueryMatches(response);
}
