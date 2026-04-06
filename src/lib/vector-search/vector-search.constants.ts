export const TASK_EMBEDDING_MODEL = "text-embedding-3-small";

// `text-embedding-3-small` uses 1536 dimensions by default, so the Pinecone
// index must be created with the same dimension for vector writes and queries.
export const TASK_EMBEDDING_DIMENSION = 1536;

// Cosine similarity is the intended metric for future retrieval-based task estimation.
export const PINECONE_INDEX_METRIC = "cosine" as const;
