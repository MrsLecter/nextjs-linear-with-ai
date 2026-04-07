"use client";

import { useCallback, useRef, useState } from "react";
import type {
  EstimateTaskRequest,
  EstimateTaskResult,
} from "@/lib/types/task-estimation.types";
import {
  estimateTaskApiResponseSchema,
  estimateTaskRequestSchema,
} from "@/lib/validation/task-estimation.schemas";

type TaskEstimationState =
  | {
    status: "idle";
    data: null;
    error: null;
  }
  | {
    status: "loading";
    data: null;
    error: null;
  }
  | {
    status: "success";
    data: EstimateTaskResult;
    error: null;
  }
  | {
    status: "error";
    data: null;
    error: string;
  };

const DEFAULT_ESTIMATION_ERROR_MESSAGE = "Failed to estimate this task. Please try again.";

export function useTaskEstimation() {
  const activeRequestIdRef = useRef(0);
  const isRequestInFlightRef = useRef(false);
  const [state, setState] = useState<TaskEstimationState>({
    status: "idle",
    data: null,
    error: null,
  });

  const estimateTask = useCallback(async (draft: EstimateTaskRequest) => {
    if (isRequestInFlightRef.current) {
      return null;
    }

    isRequestInFlightRef.current = true;
    setState({
      status: "loading",
      data: null,
      error: null,
    });

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    try {
      const requestBody = estimateTaskRequestSchema.parse(draft);
      const response = await fetch("/api/tasks/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const payload = (await response.json()) as unknown;

      if (activeRequestIdRef.current !== requestId) {
        return null;
      }

      const parsedResponse = estimateTaskApiResponseSchema.safeParse(payload);

      if (!parsedResponse.success) {
        setState({
          status: "error",
          data: null,
          error: DEFAULT_ESTIMATION_ERROR_MESSAGE,
        });
        return null;
      }

      if (!parsedResponse.data.success) {
        setState({
          status: "error",
          data: null,
          error: parsedResponse.data.error,
        });
        return null;
      }

      if (!response.ok) {
        setState({
          status: "error",
          data: null,
          error: DEFAULT_ESTIMATION_ERROR_MESSAGE,
        });
        return null;
      }

      setState({
        status: "success",
        data: parsedResponse.data.data,
        error: null,
      });

      return parsedResponse.data.data;
    } catch {
      if (activeRequestIdRef.current !== requestId) {
        return null;
      }

      setState({
        status: "error",
        data: null,
        error: DEFAULT_ESTIMATION_ERROR_MESSAGE,
      });
      return null;
    } finally {
      if (activeRequestIdRef.current === requestId) {
        isRequestInFlightRef.current = false;
      }
    }
  }, []);

  return {
    state,
    estimateTask,
  };
}
