import type { EstimateTaskRequest } from "@/lib/types/task-estimation.types";

type EstimationDraftSignatureInput = Pick<
  EstimateTaskRequest,
  "title" | "description" | "type"
>;

export function getTaskEstimationDraftSignature({
  title,
  description,
  type,
}: EstimationDraftSignatureInput) {
  return JSON.stringify({
    title: title.trim(),
    description: description.trim(),
    type: type?.trim() ?? null,
  });
}
