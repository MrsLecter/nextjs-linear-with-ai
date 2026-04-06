import "server-only";
import { Pinecone, type Index, type RecordMetadata } from "@pinecone-database/pinecone";
import { env } from "@/lib/env";
import { pineconeIndexConfig } from "@/lib/vector-search/pinecone.config";

const globalForPinecone = globalThis as typeof globalThis & {
  pinecone?: Pinecone;
};

const pineconeClient =
  globalForPinecone.pinecone ??
  new Pinecone({
    apiKey: env.PINECONE_API_KEY,
  });

if (env.NODE_ENV !== "production") {
  globalForPinecone.pinecone = pineconeClient;
}

export function getPineconeClient(): Pinecone {
  return pineconeClient;
}

export function getPineconeIndex<T extends RecordMetadata = RecordMetadata>(): Index<T> {
  // This index is reserved for future retrieval-based task estimation and is
  // expected to use the configured name, cosine metric, and 1536-dim vectors.
  if (pineconeIndexConfig.host) {
    return pineconeClient.index<T>({
      host: pineconeIndexConfig.host,
    });
  }

  return pineconeClient.index<T>({
    name: pineconeIndexConfig.name,
  });
}
