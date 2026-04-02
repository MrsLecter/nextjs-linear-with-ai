import OpenAI from "openai";
import { env } from "@/lib/env";

const globalForOpenAI = globalThis as typeof globalThis & {
  openai?: OpenAI;
};

export const clientOpenAI =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

if (env.NODE_ENV !== "production") {
  globalForOpenAI.openai = clientOpenAI;
}
