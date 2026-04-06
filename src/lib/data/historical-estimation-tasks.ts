import { TaskStatus, TaskWorkType } from "#prisma/browser";
import type { HistoricalTaskCandidate } from "@/lib/utils/task-estimation-history.utils";

/**
 * A small sample set of completed tasks for initial populating
 * the rating history and testing the quality of similar task searches.
 *
 * It is assumed that in a real-world scenario, this data will be exported
 * from Linear / Jira.
 *
 * The set contains completed tasks from previous cycles, which will serve as the basis
 * for evaluating new tasks.
 */

export const historicalEstimationSeedCandidates: HistoricalTaskCandidate[] = [
  {
    id: 8101,
    title: "Fix password reset token expiry check",
    description:
      "Correct the backend comparison that rejects valid password reset links near the expiration boundary and add a regression-safe fix for the timezone handling.",
    estimation: 1,
    status: TaskStatus.DONE,
    type: TaskWorkType.BUG,
    createdAt: new Date("2026-01-09T10:00:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8102,
    title: "Add remember-me toggle to login form",
    description:
      "Extend the login form and session creation flow so users can opt into a longer-lived session without changing the default security rules for shared devices.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.FEATURE,
    createdAt: new Date("2026-01-14T09:30:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8103,
    title: "Support SSO domain hint on login screen",
    description:
      "Detect an email domain entered on the login screen and route enterprise users into the correct SSO flow, including fallback messaging for domains without a configured provider.",
    estimation: 3,
    status: TaskStatus.DONE,
    type: TaskWorkType.INTEGRATION,
    createdAt: new Date("2026-01-21T11:15:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8104,
    title: "Add inline validation for billing address form",
    description:
      "Show field-level validation states for postal code, state, and required address lines in the billing form before submission so finance-related errors are easier to fix.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.IMPROVEMENT,
    createdAt: new Date("2026-01-28T08:45:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8105,
    title: "Normalize API validation errors for project settings form",
    description:
      "Refactor the settings API error shape so form fields can map backend validation errors consistently, including nested path handling for webhook and notification settings.",
    estimation: 3,
    status: TaskStatus.DONE,
    type: TaskWorkType.REFACTOR,
    createdAt: new Date("2026-02-03T13:10:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8106,
    title: "Persist collapsed state for dashboard widgets",
    description:
      "Store whether a dashboard widget is collapsed and restore that preference on reload so engineers can keep noisy widgets tucked away between sessions.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.IMPROVEMENT,
    createdAt: new Date("2026-02-07T09:20:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8107,
    title: "Add deploy frequency widget to engineering dashboard",
    description:
      "Create a new dashboard widget that shows weekly deploy frequency from existing release data, including empty-state handling and a compact chart summary for smaller screens.",
    estimation: 3,
    status: TaskStatus.DONE,
    type: TaskWorkType.FEATURE,
    createdAt: new Date("2026-02-11T15:00:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8108,
    title: "Fix duplicate toast after task status update",
    description:
      "Prevent the task list from showing the same success toast twice when a status mutation retries after a slow network response.",
    estimation: 1,
    status: TaskStatus.DONE,
    type: TaskWorkType.BUG,
    createdAt: new Date("2026-02-16T10:40:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8109,
    title: "Add Slack notification when release checklist is completed",
    description:
      "Send a formatted Slack message to the release channel when an engineer completes a release checklist, including release name, owner, and a deep link back to the app.",
    estimation: 5,
    status: TaskStatus.DONE,
    type: TaskWorkType.INTEGRATION,
    createdAt: new Date("2026-02-20T14:35:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8110,
    title: "Validate CSV import headers before processing upload",
    description:
      "Inspect uploaded CSV headers before the import job starts and return a clear mismatch report when required columns are missing or duplicated.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.IMPROVEMENT,
    createdAt: new Date("2026-02-24T12:05:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8111,
    title: "Add drag-and-drop attachments to incident postmortems",
    description:
      "Allow engineers to attach screenshots and log bundles to incident postmortems with drag-and-drop upload, progress feedback, and basic file type restrictions.",
    estimation: 5,
    status: TaskStatus.DONE,
    type: TaskWorkType.FEATURE,
    createdAt: new Date("2026-02-27T16:25:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8112,
    title: "Add customer portal deep link after subscription upgrade",
    description:
      "Expose a direct link to the billing provider's customer portal after a successful upgrade so account owners can immediately review invoices and payment methods.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.INTEGRATION,
    createdAt: new Date("2026-03-03T09:55:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8113,
    title: "Retry Stripe webhook parsing with raw body fallback",
    description:
      "Fix intermittent webhook verification failures by updating the raw body handling path, improving signature diagnostics, and safely retrying parsing for known payload shapes.",
    estimation: 3,
    status: TaskStatus.DONE,
    type: TaskWorkType.BUG,
    createdAt: new Date("2026-03-08T11:50:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8114,
    title: "Sync invoice PDFs to accounting provider",
    description:
      "Build a background sync that uploads generated invoice PDFs to the accounting provider, records sync status, and surfaces actionable failures for finance operations.",
    estimation: 8,
    status: TaskStatus.DONE,
    type: TaskWorkType.INTEGRATION,
    createdAt: new Date("2026-03-12T13:40:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8115,
    title: "Prevent settings modal from closing on save error",
    description:
      "Keep the settings modal open when the save action fails so the entered values and validation guidance remain visible for quick correction.",
    estimation: 1,
    status: TaskStatus.DONE,
    type: TaskWorkType.BUG,
    createdAt: new Date("2026-03-17T08:35:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8116,
    title: "Restore focus to trigger after closing keyboard shortcut modal",
    description:
      "Return keyboard focus to the button that opened the shortcuts modal and preserve the expected tab order for accessibility and power-user navigation.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.IMPROVEMENT,
    createdAt: new Date("2026-03-19T10:10:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8117,
    title: "Add pagination metadata to activity feed endpoint",
    description:
      "Extend the activity feed API response with cursor and total-count metadata so dashboard consumers can paginate predictably without custom response parsing.",
    estimation: 3,
    status: TaskStatus.DONE,
    type: TaskWorkType.FEATURE,
    createdAt: new Date("2026-03-24T14:10:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8118,
    title: "Backfill missing actor ids in audit log API",
    description:
      "Refactor the audit log response assembly to backfill missing actor identifiers from historical records and remove the null-heavy code paths in admin API consumers.",
    estimation: 5,
    status: TaskStatus.DONE,
    type: TaskWorkType.TECH_DEBT,
    createdAt: new Date("2026-03-28T15:45:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8119,
    title: "Fix stale filter state after switching project tabs",
    description:
      "Reset task filter state correctly when engineers switch between project tabs so saved filters from one workspace do not leak into another and hide expected tasks.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.BUG,
    createdAt: new Date("2026-04-01T09:15:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8120,
    title: "Add bulk priority update action to task table",
    description:
      "Introduce a bulk action for updating task priority from the table view, including optimistic UI feedback and disabled states when selected items cannot be changed.",
    estimation: 3,
    status: TaskStatus.DONE,
    type: TaskWorkType.FEATURE,
    createdAt: new Date("2026-04-03T11:05:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8121,
    title: "Improve loading skeletons for task detail sidebar",
    description:
      "Replace the generic sidebar spinner with task-shaped loading placeholders so detail views feel more stable while comments, metadata, and subtasks are loading.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.IMPROVEMENT,
    createdAt: new Date("2026-04-07T10:20:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8122,
    title: "Refactor recurring cleanup job configuration parsing",
    description:
      "Extract and simplify the recurring job configuration parser so retention windows, dry-run flags, and schedule overrides are validated consistently across environments.",
    estimation: 5,
    status: TaskStatus.DONE,
    type: TaskWorkType.REFACTOR,
    createdAt: new Date("2026-04-10T13:30:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8123,
    title: "Connect GitHub PR links in release readiness checklist",
    description:
      "Attach GitHub pull request links to checklist items in the release readiness flow so reviewers can jump directly from blocked deployment steps to the relevant code changes.",
    estimation: 3,
    status: TaskStatus.DONE,
    type: TaskWorkType.INTEGRATION,
    createdAt: new Date("2026-04-14T15:10:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8124,
    title: "Prevent duplicate subtask creation on slow save",
    description:
      "Guard the subtask creation flow against double submission when the network is slow by disabling the action reliably and deduplicating repeated server requests.",
    estimation: 1,
    status: TaskStatus.DONE,
    type: TaskWorkType.BUG,
    createdAt: new Date("2026-04-17T08:50:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8125,
    title: "Add estimate confidence badge to AI suggestion panel",
    description:
      "Show a compact confidence badge next to AI-generated task estimates so engineers can quickly judge whether a suggestion is based on strong historical similarity or weaker matches.",
    estimation: 2,
    status: TaskStatus.DONE,
    type: TaskWorkType.FEATURE,
    createdAt: new Date("2026-04-21T12:25:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8126,
    title: "Clean up legacy task tags no longer used in filters",
    description:
      "Remove outdated task tag mappings from the filter normalization layer and admin seed helpers so only supported tags are indexed, displayed, and suggested going forward.",
    estimation: 3,
    status: TaskStatus.DONE,
    type: TaskWorkType.TECH_DEBT,
    createdAt: new Date("2026-04-24T14:40:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8127,
    title: "Export blocked-task report as CSV from dashboard",
    description:
      "Add a dashboard action that exports currently blocked tasks as CSV with owner, priority, blocker reason, and age so team leads can share planning snapshots outside the app.",
    estimation: 5,
    status: TaskStatus.DONE,
    type: TaskWorkType.FEATURE,
    createdAt: new Date("2026-04-28T16:00:00.000Z"),
    parentTaskId: null,
  },
  {
    id: 8128,
    title: "Cache task similarity search inputs for repeated estimates",
    description:
      "Reduce repeated vector search overhead by caching normalized task similarity search inputs for identical estimate requests while keeping invalidation simple and predictable.",
    estimation: 8,
    status: TaskStatus.DONE,
    type: TaskWorkType.TECH_DEBT,
    createdAt: new Date("2026-05-02T10:35:00.000Z"),
    parentTaskId: null,
  },
];
