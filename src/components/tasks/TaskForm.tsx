"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { FieldErrors, Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "@/lib/constants/task.constants";
import {
  ERROR_MESSAGES,
  LOADING_STATES,
  TASK_MODAL_MESSAGES,
} from "@/lib/constants/ui.constants";
import { cx } from "@/lib/helpers";
import type { TaskMutationResult } from "@/lib/types/task-mutation.types";
import { taskFormSchema, type TaskFormInput } from "@/lib/validation/task.schemas";

type TaskFormProps = {
  initialValues: TaskFormInput;
  submitLabel: string;
  onSubmit: (values: TaskFormInput) => Promise<TaskMutationResult>;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  footerStart?: ReactNode;
};

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

function FormField({ label, error, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
      <p
        aria-live="polite"
        className="min-h-5 text-sm text-red-400"
      >
        {error ?? "\u00A0"}
      </p>
    </label>
  );
}

const taskFormResolver: Resolver<TaskFormInput> = async (values) => {
  const result = taskFormSchema.safeParse(values);

  if (result.success) {
    return {
      values: result.data,
      errors: {},
    };
  }

  const errors: Record<string, { type: string; message: string }> = {};

  for (const issue of result.error.issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName !== "string" || fieldName in errors) {
      continue;
    }

    errors[fieldName] = {
      type: issue.code,
      message: issue.message,
    };
  }

  return {
    values: {},
    errors: errors as FieldErrors<TaskFormInput>,
  };
};

export function TaskForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  onDirtyChange,
  footerStart,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TaskFormInput>({
    resolver: taskFormResolver,
    defaultValues: initialValues,
    reValidateMode: "onChange",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const titleError = errors.title?.message;
  const descriptionError = errors.description?.message;
  const statusError = errors.status?.message;
  const priorityError = errors.priority?.message;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      id="task-form"
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        clearErrors();
        setFormError(null);

        let result: TaskMutationResult;

        try {
          result = await onSubmit(values);
        } catch {
          setFormError(ERROR_MESSAGES.SOMETHING_WRONG);
          return;
        }

        if (result.success) {
          return;
        }

        if (result.formError) {
          setFormError(result.formError);
        }

        if (!result.fieldErrors) {
          return;
        }

        for (const [fieldName, message] of Object.entries(result.fieldErrors)) {
          if (!message) {
            continue;
          }

          setError(fieldName as keyof TaskFormInput, {
            type: "server",
            message,
          });
        }
      })}
    >
      {formError ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {formError}
        </div>
      ) : null}

      <FormField error={titleError} label="Title">
        <Input
          autoFocus
          aria-invalid={titleError ? "true" : "false"}
          className={cx(
            titleError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/25 hover:border-red-400"
              : undefined,
          )}
          placeholder="Enter task title"
          {...register("title")}
        />
      </FormField>

      <FormField error={descriptionError} label="Description">
        <Textarea
          aria-invalid={descriptionError ? "true" : "false"}
          className={cx(
            descriptionError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/25 hover:border-red-400"
              : undefined,
          )}
          rows={4}
          placeholder="Add a short description"
          {...register("description")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField error={statusError} label="Status">
          <Select
            aria-invalid={statusError ? "true" : "false"}
            className={cx(
              statusError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/25 hover:border-red-400"
                : undefined,
            )}
            {...register("status")}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField error={priorityError} label="Priority">
          <Select
            aria-invalid={priorityError ? "true" : "false"}
            className={cx(
              priorityError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/25 hover:border-red-400"
                : undefined,
            )}
            {...register("priority")}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2">
          {footerStart}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onCancel} type="button" variant="ghost">
            {TASK_MODAL_MESSAGES.CANCEL}
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? LOADING_STATES.SAVING : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
