import { z } from "zod";

export const decompositionStatusSchema = z.enum([
  "needs_clarification",
  "cannot_decompose",
  "ready",
]);

const nonEmptyTrimmedString = (message: string) => z
  .string()
  .trim()
  .min(1, message);

const taskTitleSchema = nonEmptyTrimmedString("Title is required.")
  .max(200, "Title is too long.");

const taskDescriptionSchema = nonEmptyTrimmedString("Description is required.")
  .max(2000, "Description is too long.");

const productFacingReasonSchema = nonEmptyTrimmedString("Reason is required.")
  .max(400, "Reason is too long.");

const clarificationQuestionSchema = nonEmptyTrimmedString("Question is required.")
  .max(300, "Question is too long.");

export const decompositionPreviewRequestSchema = z.object({
  taskId: nonEmptyTrimmedString("Task ID is required.").optional(),
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  maxSubtasks: z.number().int().min(2).max(7).optional(),
}).strict();

export const assessmentToolInputSchema = decompositionPreviewRequestSchema;

const clarificationQuestionsSchema = z
  .array(clarificationQuestionSchema)
  .min(1, "At least one clarification question is required.")
  .max(3, "No more than three clarification questions are allowed.");

export const assessmentToolOutputSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("needs_clarification"),
    reason: productFacingReasonSchema,
    questions: clarificationQuestionsSchema,
  }).strict(),
  z.object({
    status: z.literal("cannot_decompose"),
    reason: productFacingReasonSchema,
    questions: z.null(),
  }).strict(),
  z.object({
    status: z.literal("ready"),
    reason: productFacingReasonSchema,
    questions: z.null(),
  }).strict(),
]).transform((value) => {
  if (value.status === "needs_clarification") {
    return {
      ...value,
      reason: value.reason.trim(),
      questions: value.questions.map((question) => question.trim()) as [string, ...string[]],
    };
  }

  return {
    status: value.status,
    reason: value.reason.trim(),
  };
});

export const generatedSubtaskSchema = z.object({
  title: nonEmptyTrimmedString("Subtask title is required.")
    .max(200, "Subtask title is too long."),
  description: nonEmptyTrimmedString("Subtask description is required.")
    .max(2000, "Subtask description is too long."),
  order: z.number().int().positive("Subtask order must be a positive integer."),
}).strict();

export const generateSubtasksToolInputSchema = decompositionPreviewRequestSchema.extend({
  maxSubtasks: z.number().int().min(2).max(7),
}).strict();

const orderedGeneratedSubtasksArraySchema = z
  .array(generatedSubtaskSchema)
  .min(1, "At least one subtask is required.")
  .max(7, "Too many subtasks were generated.")
  .superRefine((subtasks, ctx) => {
    const seenOrders = new Set<number>();
    const seenTitles = new Set<string>();

    subtasks.forEach((subtask, index) => {
      if (seenOrders.has(subtask.order)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Subtask order values must be unique.",
          path: [index, "order"],
        });
      } else {
        seenOrders.add(subtask.order);
      }

      const titleKey = subtask.title.trim().toLocaleLowerCase();

      if (seenTitles.has(titleKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Subtask titles must be unique.",
          path: [index, "title"],
        });
      } else {
        seenTitles.add(titleKey);
      }
    });

    const sortedOrders = [...seenOrders].sort((left, right) => left - right);

    sortedOrders.forEach((order, index) => {
      const expectedOrder = index + 1;

      if (order === expectedOrder) {
        return;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Subtask order values must be sequential starting at 1.",
        path: [],
      });
    });
  })
  .transform((subtasks) => [...subtasks]
    .map((subtask) => ({
      title: subtask.title.trim(),
      description: subtask.description.trim(),
      order: subtask.order,
    }))
    .sort((left, right) => left.order - right.order));

export const generateSubtasksToolOutputSchema = z.object({
  subtasks: orderedGeneratedSubtasksArraySchema,
}).strict();

export const createSubtasksRequestBodySchema = z.object({
  subtasks: orderedGeneratedSubtasksArraySchema,
}).strict();

export const createSubtasksInputSchema = z.object({
  taskId: nonEmptyTrimmedString("Task ID is required."),
  subtasks: orderedGeneratedSubtasksArraySchema,
}).strict();

export const decompositionPreviewResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("needs_clarification"),
    reason: productFacingReasonSchema,
    questions: clarificationQuestionsSchema,
  }).strict(),
  z.object({
    status: z.literal("cannot_decompose"),
    reason: productFacingReasonSchema,
  }).strict(),
  z.object({
    status: z.literal("ready"),
    reason: productFacingReasonSchema,
    subtasks: orderedGeneratedSubtasksArraySchema,
  }).strict(),
]);

export const createSubtasksResponseSchema = z.object({
  createdCount: z.number().int().nonnegative(),
  subtasks: z.array(z.object({
    id: nonEmptyTrimmedString("Subtask ID is required."),
    title: nonEmptyTrimmedString("Subtask title is required."),
    description: nonEmptyTrimmedString("Subtask description is required."),
    order: z.number().int().positive(),
    status: nonEmptyTrimmedString("Subtask status is required."),
    priority: nonEmptyTrimmedString("Subtask priority is required."),
    createdAt: nonEmptyTrimmedString("Created-at timestamp is required."),
    parentTaskId: nonEmptyTrimmedString("Parent task ID is required.").nullable(),
  }).strict()),
}).strict();

export type DecompositionPreviewRequestInput = z.infer<typeof decompositionPreviewRequestSchema>;
export type AssessmentToolInput = z.infer<typeof assessmentToolInputSchema>;
export type AssessmentToolOutput = z.output<typeof assessmentToolOutputSchema>;
export type GeneratedSubtaskInput = z.infer<typeof generatedSubtaskSchema>;
export type GenerateSubtasksToolInput = z.infer<typeof generateSubtasksToolInputSchema>;
export type GenerateSubtasksToolOutput = z.output<typeof generateSubtasksToolOutputSchema>;
export type CreateSubtasksRequestBody = z.output<typeof createSubtasksRequestBodySchema>;
export type CreateSubtasksInput = z.output<typeof createSubtasksInputSchema>;
export type DecompositionPreviewResponse = z.output<typeof decompositionPreviewResponseSchema>;
export type CreateSubtasksResponse = z.output<typeof createSubtasksResponseSchema>;
