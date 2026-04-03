export type {
  AssessmentToolOutput as DecompositionAssessment,
  DecompositionPreviewRequestInput as DecompositionPreviewRequest,
  DecompositionPreviewResponse as DecompositionPreviewResult,
  DecompositionPreviewResponse as DecompositionResult,
  GenerateSubtasksToolOutput,
  GeneratedSubtaskInput as GeneratedSubtask,
} from "@/lib/ai/schemas/task-decomposition";

export type DecompositionStatus =
  | "needs_clarification"
  | "cannot_decompose"
  | "ready";
