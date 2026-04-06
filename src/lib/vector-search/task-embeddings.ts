import "server-only";
import { z } from "zod";
import { clientOpenAI } from "@/lib/ai/openai";
import {
  TASK_EMBEDDING_DIMENSION,
  TASK_EMBEDDING_MODEL,
} from "@/lib/vector-search/vector-search.constants";

const taskEmbeddingInputSchema = z.string().trim().min(1, "Task text is required.");

export async function generateTaskEmbedding(text: string): Promise<number[]> {
  const normalizedText = taskEmbeddingInputSchema.parse(text);

  try {
    // This helper is intentionally server-only and scoped to task text so the
    // retrieval pipeline can reuse one consistent embedding shape everywhere.
    const response = await clientOpenAI.embeddings.create({
      model: TASK_EMBEDDING_MODEL,
      input: normalizedText,
      dimensions: TASK_EMBEDDING_DIMENSION,
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      throw new Error("Embedding response did not include a vector.");
    }

    if (embedding.length !== TASK_EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding dimension mismatch: expected ${TASK_EMBEDDING_DIMENSION}, received ${embedding.length}.`,
      );
    }

    return embedding;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown embedding error";

    throw new Error(`Failed to generate task embedding: ${message}`);
  }
}
