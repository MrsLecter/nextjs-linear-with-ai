import { z } from "zod";
import {
  TASK_ESTIMATION_VALUES,
  type TaskEstimationValue,
} from "@/lib/constants/task.constants";
import { taskWorkTypeSchema } from "@/lib/validation/task.schemas";

const nonEmptyTrimmedString = (message: string) => z
  .string()
  .trim()
  .min(1, message);

const productFacingReasonSchema = nonEmptyTrimmedString("Reason is required.")
  .max(400, "Reason is too long.");

const clarificationQuestionSchema = nonEmptyTrimmedString("Question is required.")
  .max(300, "Question is too long.");

const taskEstimationLiteralSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
  z.literal(8),
]);

export const estimateTaskRequestSchema = z.object({
  title: nonEmptyTrimmedString("Title is required.")
    .max(200, "Title is too long."),
  description: nonEmptyTrimmedString("Description is required.")
    .max(2000, "Description is too long."),
  type: taskWorkTypeSchema.optional(),
}).strict();

const clarificationQuestionsSchema = z
  .array(clarificationQuestionSchema)
  .min(1, "At least one clarification question is required.")
  .max(3, "No more than three clarification questions are allowed.");

export const estimateTaskModelResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("needs_clarification"),
    reason: productFacingReasonSchema,
    questions: clarificationQuestionsSchema,
    estimate: z.null(),
    confidence: z.null(),
    similarTasksUsed: z.null(),
  }).strict(),
  z.object({
    status: z.literal("ready"),
    reason: productFacingReasonSchema,
    questions: z.null(),
    estimate: taskEstimationLiteralSchema,
    confidence: z.enum(["low", "medium", "high"]),
    similarTasksUsed: z.array(z.object({
      taskId: z.number().int().positive("Task ID must be a positive integer."),
    }).strict()).max(3),
  }).strict(),
]);

export const estimateTaskResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("needs_clarification"),
    reason: productFacingReasonSchema,
    questions: clarificationQuestionsSchema,
  }).strict(),
  z.object({
    status: z.literal("ready"),
    estimate: taskEstimationLiteralSchema,
    confidence: z.enum(["low", "medium", "high"]),
    reason: productFacingReasonSchema,
    similarTasksUsed: z.array(z.object({
      taskId: z.number().int().positive(),
      title: nonEmptyTrimmedString("Task title is required.").max(200),
      estimation: taskEstimationLiteralSchema,
    }).strict()).max(3),
  }).strict(),
]);

export const estimateTaskApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: estimateTaskResultSchema,
}).strict();

export const estimateTaskApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: nonEmptyTrimmedString("Error is required.").max(200),
  code: z.string().trim().min(1).max(100).optional(),
}).strict();

export const estimateTaskApiResponseSchema = z.union([
  estimateTaskApiSuccessResponseSchema,
  estimateTaskApiErrorResponseSchema,
]);

export type EstimateTaskModelResponse = z.infer<typeof estimateTaskModelResponseSchema>;
export type EstimateTaskResultSchema = z.infer<typeof estimateTaskResultSchema>;
export type TaskEstimationLiteral = TaskEstimationValue;
export type EstimateTaskApiResponseSchema = z.infer<typeof estimateTaskApiResponseSchema>;

export const taskEstimationAllowedValues = TASK_ESTIMATION_VALUES;
