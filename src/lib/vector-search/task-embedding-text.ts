import "server-only";
import { z } from "zod";
import type { TaskWorkType } from "@/lib/types/task.types";

const embeddingTaskInputSchema = z.object({
  title: z.string().trim().min(1, "Task title is required."),
  description: z.string().trim().min(1, "Task description is required."),
  type: z.custom<TaskWorkType>(),
});

export function buildTaskEmbeddingText(input: {
  title: string;
  description: string;
  type: TaskWorkType;
}): string {
  const normalizedInput = embeddingTaskInputSchema.parse(input);

  // Embedding text must stay identical across indexing and querying so vector
  // similarity reflects task content instead of formatting drift between flows.
  return [
    `Title: ${normalizedInput.title}`,
    `Description: ${normalizedInput.description}`,
    `Type: ${normalizedInput.type}`,
  ].join("\n");
}
