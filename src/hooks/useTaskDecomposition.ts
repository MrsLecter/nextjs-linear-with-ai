"use client";

import { useCallback, useRef, useState } from "react";
import type {
  DecompositionPreviewRequest,
  DecompositionPreviewResult,
} from "@/lib/ai/features/generate-subtask/types";
import {
  createSubtasksRequestBodySchema,
  createSubtasksResponseSchema,
  decompositionPreviewRequestSchema,
  decompositionPreviewResponseSchema,
} from "@/lib/validation/task-decomposition.schemas";

type DecompositionState =
  | {
    status: "idle";
    data: null;
    error: null;
    saveStatus: "idle";
    saveError: null;
    saveSuccessMessage: null;
  }
  | {
    status: "loading";
    data: null;
    error: null;
    saveStatus: "idle";
    saveError: null;
    saveSuccessMessage: null;
  }
  | {
    status: "error";
    data: null;
    error: string;
    saveStatus: "idle";
    saveError: null;
    saveSuccessMessage: null;
  }
  | {
    status: DecompositionPreviewResult["status"];
    data: DecompositionPreviewResult;
    error: null;
    saveStatus: "idle" | "saving" | "success" | "error";
    saveError: string | null;
    saveSuccessMessage: string | null;
  };

type GeneratePreviewSuccessResponse = {
  data: unknown;
};

type CreateSubtasksSuccessResponse = {
  data: unknown;
};

type ReadyTaskDecompositionPreview = Extract<
  DecompositionPreviewResult,
  {
    status: "ready";
  }
>;

const DEFAULT_GENERATE_ERROR_MESSAGE = "Failed to generate subtask preview.";
const DEFAULT_SAVE_ERROR_MESSAGE = "Failed to create subtasks.";

function getErrorMessage(value: unknown, fallbackMessage: string): string {
  if (!value || typeof value !== "object") {
    return fallbackMessage;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.error === "string" && candidate.error.trim().length > 0
    ? candidate.error
    : fallbackMessage;
}

export function useTaskDecomposition(taskId: number | null) {
  const activePreviewRequestIdRef = useRef(0);
  const [state, setState] = useState<DecompositionState>({
    status: "idle",
    data: null,
    error: null,
    saveStatus: "idle",
    saveError: null,
    saveSuccessMessage: null,
  });

  const resetDecomposition = useCallback(() => {
    activePreviewRequestIdRef.current += 1;
    setState({
      status: "idle",
      data: null,
      error: null,
      saveStatus: "idle",
      saveError: null,
      saveSuccessMessage: null,
    });
  }, []);

  const clearSaveFeedback = useCallback(() => {
    setState((currentState) => {
      if (
        currentState.status === "idle" ||
        currentState.status === "loading" ||
        currentState.status === "error"
      ) {
        return currentState;
      }

      return {
        ...currentState,
        saveStatus: "idle",
        saveError: null,
        saveSuccessMessage: null,
      };
    });
  }, []);

  const generatePreview = useCallback(
    async (draft: DecompositionPreviewRequest) => {
      setState({
        status: "loading",
        data: null,
        error: null,
        saveStatus: "idle",
        saveError: null,
        saveSuccessMessage: null,
      });

      const requestId = activePreviewRequestIdRef.current + 1;
      activePreviewRequestIdRef.current = requestId;

      try {
        const parsedDraft = decompositionPreviewRequestSchema.parse(draft);
        const response = await fetch("/api/ai/decompose-preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsedDraft),
        });
        const payload = (await response.json()) as unknown;

        if (activePreviewRequestIdRef.current !== requestId) {
          return;
        }

        if (!response.ok) {
          setState({
            status: "error",
            data: null,
            error: getErrorMessage(payload, DEFAULT_GENERATE_ERROR_MESSAGE),
            saveStatus: "idle",
            saveError: null,
            saveSuccessMessage: null,
          });
          return;
        }

        const data = decompositionPreviewResponseSchema.safeParse(
          (payload as GeneratePreviewSuccessResponse).data,
        );

        if (!data.success) {
          setState({
            status: "error",
            data: null,
            error: DEFAULT_GENERATE_ERROR_MESSAGE,
            saveStatus: "idle",
            saveError: null,
            saveSuccessMessage: null,
          });
          return;
        }

        setState({
          status: data.data.status,
          data: data.data,
          error: null,
          saveStatus: "idle",
          saveError: null,
          saveSuccessMessage: null,
        });
      } catch {
        if (activePreviewRequestIdRef.current !== requestId) {
          return;
        }

        setState({
          status: "error",
          data: null,
          error: DEFAULT_GENERATE_ERROR_MESSAGE,
          saveStatus: "idle",
          saveError: null,
          saveSuccessMessage: null,
        });
      }
    },
    [],
  );

  const createSubtasks = useCallback(async () => {
    if (!taskId || state.status !== "ready") {
      return false;
    }

    const readyData = state.data as ReadyTaskDecompositionPreview;

    setState((currentState) => {
      if (currentState.status !== "ready") {
        return currentState;
      }

      return {
        ...currentState,
        saveStatus: "saving",
        saveError: null,
        saveSuccessMessage: null,
      };
    });

    try {
      const requestBody = createSubtasksRequestBodySchema.parse({
        subtasks: readyData.subtasks,
      });
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setState((currentState) => {
          if (currentState.status !== "ready") {
            return currentState;
          }

          return {
            ...currentState,
            saveStatus: "error",
            saveError: getErrorMessage(payload, DEFAULT_SAVE_ERROR_MESSAGE),
            saveSuccessMessage: null,
          };
        });

        return false;
      }

      const parsedResponse = createSubtasksResponseSchema.safeParse(
        (payload as CreateSubtasksSuccessResponse).data,
      );
      const createdCount = parsedResponse.success
        ? parsedResponse.data.createdCount
        : readyData.subtasks.length;
      const subtaskLabel = createdCount === 1 ? "subtask" : "subtasks";

      setState((currentState) => {
        if (currentState.status !== "ready") {
          return currentState;
        }

        return {
          ...currentState,
          saveStatus: "success",
          saveError: null,
          saveSuccessMessage: `Created ${createdCount} ${subtaskLabel}.`,
        };
      });

      return true;
    } catch {
      setState((currentState) => {
        if (currentState.status !== "ready") {
          return currentState;
        }

        return {
          ...currentState,
          saveStatus: "error",
          saveError: DEFAULT_SAVE_ERROR_MESSAGE,
          saveSuccessMessage: null,
        };
      });

      return false;
    }
  }, [state, taskId]);

  return {
    state,
    generatePreview,
    createSubtasks,
    resetDecomposition,
    clearSaveFeedback,
  };
}
