import "server-only";
import { env } from "@/lib/env";
import {
  PINECONE_INDEX_METRIC,
  TASK_EMBEDDING_DIMENSION,
  TASK_EMBEDDING_MODEL,
} from "@/lib/vector-search/vector-search.constants";

export const pineconeIndexConfig = {
  name: env.PINECONE_INDEX_NAME,
  host: env.PINECONE_HOST,
  metric: PINECONE_INDEX_METRIC,
  dimension: TASK_EMBEDDING_DIMENSION,
  embeddingModel: TASK_EMBEDDING_MODEL,
} as const;
