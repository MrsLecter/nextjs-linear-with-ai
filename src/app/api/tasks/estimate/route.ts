import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { EstimateTaskApiResponse } from "@/lib/types/task-estimation.types";
import { estimateTaskRequestSchema } from "@/lib/validation/task-estimation.schemas";
import {
  isTaskEstimationError,
  TaskEstimationError,
} from "@/services/task-estimation.errors";
import { estimateTask } from "@/services/task-estimation.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = estimateTaskRequestSchema.parse(await request.json());
    const estimation = await estimateTask(payload);

    const response: EstimateTaskApiResponse = {
      success: true,
      data: estimation,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const response: EstimateTaskApiResponse = {
        success: false,
        error: "Invalid JSON payload.",
        code: "invalid_json_payload",
      };

      return NextResponse.json(
        response,
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      const response: EstimateTaskApiResponse = {
        success: false,
        error: "Invalid task estimation request.",
        code: "invalid_task_estimation_request",
      };

      return NextResponse.json(
        response,
        { status: 400 },
      );
    }

    if (isTaskEstimationError(error)) {
      const serviceError = error as TaskEstimationError;

      console.error(
        "Task estimation service error:",
        serviceError.code,
        serviceError.message,
      );

      const response: EstimateTaskApiResponse = {
        success: false,
        error: serviceError.statusCode >= 500
          ? "Failed to estimate task."
          : serviceError.message,
        code: serviceError.code,
      };

      return NextResponse.json(
        response,
        { status: serviceError.statusCode },
      );
    }

    console.error("Task estimation route error:", error);

    const response: EstimateTaskApiResponse = {
      success: false,
      error: "Failed to estimate task.",
      code: "task_estimation_failed",
    };

    return NextResponse.json(
      response,
      { status: 500 },
    );
  }
}
