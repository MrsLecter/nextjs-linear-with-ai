import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  decompositionPreviewRequestSchema,
  decompositionPreviewResponseSchema,
} from "@/lib/ai/schemas/task-decomposition";
import { taskDecompositionAgent } from "@/services/task-decomposition-agent";
import {
  isOpenAIErrorWithStatus,
  isTaskDecompositionError,
} from "@/services/task-decomposition.errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = decompositionPreviewRequestSchema.parse(await request.json());
    const previewResult = await taskDecompositionAgent.preview({
      title: payload.title,
      description: payload.description,
      maxSubtasks: payload.maxSubtasks,
    });
    const preview = decompositionPreviewResponseSchema.safeParse(previewResult);

    if (!preview.success) {
      console.error("Task decomposition preview response validation error:", preview.error.flatten());

      return NextResponse.json(
        {
          error: "Failed to generate subtask preview.",
          code: "invalid_preview_response",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: preview.data });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON payload.",
          code: "invalid_json_payload",
        },
        { status: 400 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid task draft.",
          code: "invalid_task_draft",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (isOpenAIErrorWithStatus(error)) {
      console.error("AI task decomposition preview error:", error.status, error.message);

      return NextResponse.json(
        {
          error: "Failed to generate subtask preview.",
          code: "openai_preview_failed",
        },
        { status: 502 },
      );
    }

    if (isTaskDecompositionError(error)) {
      const serviceError = error;

      console.error(
        "Task decomposition preview service error:",
        serviceError.code,
        serviceError.message,
      );

      return NextResponse.json(
        {
          error: serviceError.statusCode >= 500
            ? "Failed to generate subtask preview."
            : serviceError.message,
          code: serviceError.code,
        },
        { status: serviceError.statusCode },
      );
    }

    console.error("Task decomposition preview route error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate subtask preview.",
        code: "task_decomposition_preview_failed",
      },
      { status: 500 },
    );
  }
}
