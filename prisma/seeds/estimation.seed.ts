import {
  TaskPriority,
  TaskStatus,
  TaskWorkType,
  type PrismaClient,
} from "#prisma/client";

type EstimationSeedTask = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimation: 0 | 1 | 2 | 3 | 5 | 8;
  type: TaskWorkType;
  parentTaskId: null;
};

export const estimationSeedTasks: EstimationSeedTask[] = [
  {
    title: "Add resend cooldown to email verification screen",
    description:
      "Prevent users from requesting a new email verification link too frequently by adding a resend cooldown timer, disabled button state, and a short explanatory message in the verification screen.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    estimation: 2,
    type: TaskWorkType.FEATURE,
    parentTaskId: null,
  },
  {
    title: "Fix duplicate success toast after bulk priority update",
    description:
      "After using the bulk priority action in the task table, the UI sometimes shows the same success toast twice when the mutation resolves after a retry. Prevent duplicate notifications without breaking the optimistic update flow.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    estimation: 2,
    type: TaskWorkType.BUG,
    parentTaskId: null,
  },
  {
    title: "Improve validation messages for task creation form",
    description:
      "Rewrite validation copy for required title and invalid priority cases in the task creation form so the messages are easier to understand and consistent between client and server validation.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    estimation: 2,
    type: TaskWorkType.IMPROVEMENT,
    parentTaskId: null,
  },
  {
    title: "Add Slack notification when blocked task is reopened",
    description:
      "Send a formatted Slack message to the project channel when a previously blocked task is moved back to active work, including task title, owner, blocker reason, and a deep link to the task details page.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    estimation: 3,
    type: TaskWorkType.INTEGRATION,
    parentTaskId: null,
  },
  {
    title: "Refactor task estimate badge rendering in list and modal",
    description:
      "Extract duplicated estimate badge rendering logic used in the task list and task modal into a shared UI helper so label formatting, confidence color, and icon usage remain consistent across the app.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    estimation: 2,
    type: TaskWorkType.REFACTOR,
    parentTaskId: null,
  },
  {
    title: "Clean up obsolete AI estimation debug logs",
    description:
      "Remove old console logs and temporary debug helpers left from the AI estimation prototype so only the current structured logging remains in the estimation flow.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    estimation: 1,
    type: TaskWorkType.TECH_DEBT,
    parentTaskId: null,
  },
  {
    title: "Add blocked reason column to blocked-task CSV export",
    description:
      "Extend the blocked-task CSV export so each row includes blocker reason, blocked age, current owner, and task priority, while preserving the existing export format for other fields.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    estimation: 2,
    type: TaskWorkType.FEATURE,
    parentTaskId: null,
  },
  {
    title: "Fix stale task filters after switching dashboard tabs",
    description:
      "When engineers move between dashboard tabs, previously selected filters sometimes remain applied to the new tab and hide expected tasks. Reset or restore filter state correctly per tab.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    estimation: 2,
    type: TaskWorkType.BUG,
    parentTaskId: null,
  },
  {
    title: "Support drag-and-drop upload for task comment attachments",
    description:
      "Allow users to drag files into the task comment area to upload attachments, including progress state, file type validation, and disabled state while upload is in progress.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    estimation: 5,
    type: TaskWorkType.FEATURE,
    parentTaskId: null,
  },
  {
    title: "Retry billing portal redirect when provider session expires",
    description:
      "If the external billing provider session expires before redirect, retry portal session creation once, show a clear recovery message, and keep users in settings instead of sending them to a blank error page.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    estimation: 3,
    type: TaskWorkType.INTEGRATION,
    parentTaskId: null,
  },
  {
    title: "Normalize audit log actor display for legacy records",
    description:
      "Backfill and normalize actor display values in the audit log UI when legacy records have missing actor ids, so admin users see stable names instead of empty or duplicated placeholders.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    estimation: 5,
    type: TaskWorkType.TECH_DEBT,
    parentTaskId: null,
  },
  {
    title: "Improve loading skeletons for AI estimation result panel",
    description:
      "Replace the generic spinner in the AI estimation panel with a result-shaped skeleton that mirrors estimate, confidence, explanation, and similar-task placeholders.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    estimation: 2,
    type: TaskWorkType.IMPROVEMENT,
    parentTaskId: null,
  },
  {
    title: "Validate CSV import duplicate rows before processing",
    description:
      "Extend the CSV import validation step to detect duplicate rows before the import job starts and return a clear summary of duplicates together with existing header mismatch errors.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    estimation: 3,
    type: TaskWorkType.IMPROVEMENT,
    parentTaskId: null,
  },
  {
    title: "Cache similar-task lookup results for repeated AI estimates",
    description:
      "Reduce repeated vector search load by caching normalized similarity lookup results for identical task estimation requests and invalidating the cache when the retrieval index is refreshed.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    estimation: 8,
    type: TaskWorkType.TECH_DEBT,
    parentTaskId: null,
  },
  {
    title: "Add project-specific SSO hint to login flow",
    description:
      "When a user enters an email from a configured enterprise domain, show a project-specific SSO hint and route them into the correct sign-in flow with fallback copy for unsupported domains.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    estimation: 3,
    type: TaskWorkType.INTEGRATION,
    parentTaskId: null,
  },
  {
    title: "Task estimation improvements",
    description:
      "Improve AI estimation.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    estimation: 0,
    type: TaskWorkType.IMPROVEMENT,
    parentTaskId: null,
  },
  {
    title: "Billing issue",
    description:
      "Fix billing bug.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    estimation: 0,
    type: TaskWorkType.BUG,
    parentTaskId: null,
  },
  {
    title: "Release readiness workflow overhaul",
    description:
      "Redesign the release readiness flow so it supports checklist templates, PR link aggregation, blocked-step visibility, owner reassignment, Slack escalation for overdue items, and exportable summaries for weekly release reviews.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    estimation: 8,
    type: TaskWorkType.FEATURE,
    parentTaskId: null,
  },
];

export async function seedHistoricalEstimationTasks(prisma: PrismaClient) {
  const results = await Promise.all(
    estimationSeedTasks.map((task) =>
      prisma.task.upsert({
        where: { title: task.title },
        update: {
          description: task.description,
          status: task.status,
          priority: task.priority,
          estimation: task.estimation,
          type: task.type,
          parentTaskId: task.parentTaskId,
        },
        create: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          estimation: task.estimation,
          type: task.type,
          parentTaskId: task.parentTaskId,
        },
      }),
    ),
  );

  console.log(`Seeded ${results.length} estimation tasks.`);

  return results;
}
