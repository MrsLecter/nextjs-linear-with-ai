"use client";

import { useCallback, useState } from "react";

type PrioritizationConfidence = "low" | "medium" | "high";

export type PrioritizationData = {
  recommendedTaskId: string;
  recommendedTaskTitle: string;
  explanation: string;
  confidence: PrioritizationConfidence;
} | null;

type PrioritizationSuccessResponse = {
  data: Exclude<PrioritizationData, null>;
};

type PrioritizationEmptyResponse = {
  data: null;
  message?: string;
};

type PrioritizationErrorResponse = {
  error?: string;
};

const DEFAULT_ERROR_MESSAGE =
  "Failed to generate prioritization recommendation.";

function isPrioritizationConfidence(
  value: unknown,
): value is PrioritizationConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function isPrioritizationResult(
  value: unknown,
): value is Exclude<PrioritizationData, null> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.recommendedTaskId === "string" &&
    typeof candidate.recommendedTaskTitle === "string" &&
    typeof candidate.explanation === "string" &&
    isPrioritizationConfidence(candidate.confidence)
  );
}

function isSuccessResponse(
  value: unknown,
): value is PrioritizationSuccessResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return isPrioritizationResult(candidate.data);
}

function isEmptyResponse(value: unknown): value is PrioritizationEmptyResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return candidate.data === null;
}

function getErrorMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return DEFAULT_ERROR_MESSAGE;
  }

  const candidate = value as PrioritizationErrorResponse;

  return typeof candidate.error === "string" && candidate.error.trim()
    ? candidate.error
    : DEFAULT_ERROR_MESSAGE;
}

export function usePrioritization() {
  const [data, setData] = useState<PrioritizationData>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPrioritization = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/prioritize", {
        method: "POST",
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setData(null);
        setError(getErrorMessage(payload));
        return;
      }

      if (isSuccessResponse(payload)) {
        setData(payload.data);
        return;
      }

      if (isEmptyResponse(payload)) {
        setData(null);
        return;
      }

      setData(null);
      setError(getErrorMessage(payload));
    } catch {
      setData(null);
      setError(DEFAULT_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    runPrioritization,
  };
}
