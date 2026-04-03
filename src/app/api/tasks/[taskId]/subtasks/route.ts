import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createSubtasksInputSchema,
  createSubtasksRequestBodySchema,
  createSubtasksResponseSchema,
} from "@/lib/ai/schemas/task-decomposition";
import { taskIdParamSchema } from "@/lib/validation/task.schemas";
import {
  createTaskSubtasks,
  isTaskDecompositionError,
} from "@/services/task-decomposition.service";

type CreateSubtasksRouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(
  request: Request,
  context: CreateSubtasksRouteContext,
) {
  try {
    const { taskId } = await context.params;
    const parsedTaskId = taskIdParamSchema.parse({ id: taskId });
    const payload = createSubtasksRequestBodySchema.parse(await request.json());
    const validatedInput = createSubtasksInputSchema.parse({
      taskId: String(parsedTaskId.id),
      subtasks: payload.subtasks,
    });
    const result = createSubtasksResponseSchema.safeParse(
      await createTaskSubtasks(validatedInput),
    );

    if (!result.success) {
      console.error("Create subtasks response validation error:", result.error.flatten());

      return NextResponse.json(
        {
          error: "Failed to create subtasks.",
          code: "invalid_create_subtasks_response",
        },
        { status: 500 },
      );
    }

    revalidatePath("/");

    return NextResponse.json({
      data: result.data,
    });
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
          error: "Invalid subtask payload.",
          code: "invalid_subtask_payload",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (isTaskDecompositionError(error)) {
      return NextResponse.json(
        {
          error: error.statusCode >= 500 ? "Failed to create subtasks." : error.message,
          code: error.code,
        },
        { status: error.statusCode },
      );
    }

    console.error("Create subtasks route error:", error);

    return NextResponse.json(
      {
        error: "Failed to create subtasks.",
        code: "create_subtasks_failed",
      },
      { status: 500 },
    );
  }
}
