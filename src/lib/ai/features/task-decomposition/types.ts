export type {
  AssessmentToolOutput as DecompositionAssessment,
  DecompositionPreviewRequestInput as DecompositionPreviewRequest,
  DecompositionPreviewResponse as DecompositionPreviewResult,
  DecompositionPreviewResponse as DecompositionResult,
  GenerateSubtasksToolOutput,
  GeneratedSubtaskInput as GeneratedSubtask,
} from "@/lib/validation/task-decomposition.schemas";

export type DecompositionStatus =
  | "needs_clarification"
  | "cannot_decompose"
  | "ready";
