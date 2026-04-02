"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PrioritizationData = {
  primaryTaskId: string;
  primaryTaskTitle: string;
  explanation: string;
  alternatives: {
    taskId: string;
    whyNotFirst: string;
  }[];
  possiblePrerequisites: {
    taskId: string;
    reason: string;
  }[];
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
const DEFAULT_EXPLANATION =
  "This task appears to be the strongest next step based on the current task data.";
const DEFAULT_ALTERNATIVE_REASON =
  "This was considered, but it was not selected as the first task.";
const DEFAULT_PREREQUISITE_REASON =
  "This may be worth checking first based on the available task details.";

function isAlternative(value: unknown): value is NonNullable<
  PrioritizationData
>["alternatives"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.taskId === "string" &&
    typeof candidate.whyNotFirst === "string"
  );
}

function isPossiblePrerequisite(value: unknown): value is NonNullable<
  PrioritizationData
>["possiblePrerequisites"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.taskId === "string" &&
    typeof candidate.reason === "string"
  );
}

function isPrioritizationResult(
  value: unknown,
): value is Exclude<PrioritizationData, null> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.primaryTaskId === "string" &&
    typeof candidate.primaryTaskTitle === "string" &&
    typeof candidate.explanation === "string" &&
    Array.isArray(candidate.alternatives) &&
    candidate.alternatives.every(isAlternative) &&
    Array.isArray(candidate.possiblePrerequisites) &&
    candidate.possiblePrerequisites.every(isPossiblePrerequisite)
  );
}

function normalizeText(value: string, fallback: string): string {
  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : fallback;
}

function normalizePrioritizationResult(
  value: Exclude<PrioritizationData, null>,
): Exclude<PrioritizationData, null> {
  return {
    primaryTaskId: value.primaryTaskId,
    primaryTaskTitle: normalizeText(value.primaryTaskTitle, value.primaryTaskId),
    explanation: normalizeText(value.explanation, DEFAULT_EXPLANATION),
    alternatives: value.alternatives.map((alternative) => ({
      taskId: alternative.taskId,
      whyNotFirst: normalizeText(
        alternative.whyNotFirst,
        DEFAULT_ALTERNATIVE_REASON,
      ),
    })),
    possiblePrerequisites: value.possiblePrerequisites.map((prerequisite) => ({
      taskId: prerequisite.taskId,
      reason: normalizeText(prerequisite.reason, DEFAULT_PREREQUISITE_REASON),
    })),
  };
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
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelPrioritization = useCallback(() => {
    activeRequestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const runPrioritization = useCallback(async () => {
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    abortControllerRef.current?.abort();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/prioritize", {
        method: "POST",
        signal: abortController.signal,
      });
      const payload = (await response.json()) as unknown;

      if (activeRequestIdRef.current !== requestId) {
        return;
      }

      if (!response.ok) {
        setData(null);
        setError(getErrorMessage(payload));
        return;
      }

      if (isSuccessResponse(payload)) {
        setData(normalizePrioritizationResult(payload.data));
        return;
      }

      if (isEmptyResponse(payload)) {
        setData(null);
        return;
      }

      setData(null);
      setError(getErrorMessage(payload));
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      if (activeRequestIdRef.current !== requestId) {
        return;
      }

      setData(null);
      setError(DEFAULT_ERROR_MESSAGE);
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => cancelPrioritization, [cancelPrioritization]);

  return {
    data,
    isLoading,
    error,
    runPrioritization,
    cancelPrioritization,
  };
}
