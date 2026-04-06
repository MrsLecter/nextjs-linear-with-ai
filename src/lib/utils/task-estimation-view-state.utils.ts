type TaskEstimationViewStateInput = {
  currentDraftSignature: string;
  lastEstimatedDraftSignature: string | null;
  hasEstimatedResult: boolean;
  estimationStatus: "idle" | "loading" | "success" | "error";
  isSubmitting: boolean;
};

export function getTaskEstimationViewState({
  currentDraftSignature,
  lastEstimatedDraftSignature,
  hasEstimatedResult,
  estimationStatus,
  isSubmitting,
}: TaskEstimationViewStateInput) {
  const hasEstimatedDraft = Boolean(lastEstimatedDraftSignature && hasEstimatedResult);
  const isEstimateCurrent =
    hasEstimatedDraft && currentDraftSignature === lastEstimatedDraftSignature;
  const generateLabel = estimationStatus === "loading"
    ? "Estimating..."
    : hasEstimatedDraft && !isEstimateCurrent
      ? "Regenerate estimate"
      : "";
  const notice =
    hasEstimatedDraft && !isEstimateCurrent
      ? "Estimate is outdated for the current draft."
      : null;
  const canGenerate =
    !isSubmitting &&
    estimationStatus !== "loading" &&
    (!hasEstimatedDraft || !isEstimateCurrent);

  return {
    hasEstimatedDraft,
    isEstimateCurrent,
    generateLabel,
    notice,
    canGenerate,
  };
}
