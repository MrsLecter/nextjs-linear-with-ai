import {
  TaskPriority,
  TaskStatus,
  type PrismaClient,
} from "#prisma/client";

type SeedTaskInput = {
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: string;
};

const prioritizationTasks: SeedTaskInput[] = [
  {
    title: "Fix typo in onboarding tooltip",
    description:
      "The tooltip on the onboarding screen says 'teh' instead of 'the'. Small UX polish, no functional impact.",
    status: "todo",
    priority: "low",
    createdAt: "2026-03-20T09:00:00Z",
  },
  {
    title: "Investigate intermittent checkout failures for EU customers",
    description:
      "Multiple reports from support indicate that some EU customers cannot complete payment during checkout. This may directly affect revenue and should be investigated before the next release.",
    status: "todo",
    priority: "medium",
    createdAt: "2026-03-20T09:00:00Z",
  },
  {
    title: "Refactor billing service logging",
    description:
      "Clean up duplicated log statements and standardize structured logging fields across billing service handlers.",
    status: "todo",
    priority: "medium",
    createdAt: "2026-03-20T09:00:00Z",
  },
  {
    title: "URGENT: Release is blocked by failing migration on production",
    description:
      "The database migration for the release candidate fails in production-like environment. Deployment is blocked until this is fixed. This affects today's release train.",
    status: "todo",
    priority: "medium",
    createdAt: "2026-03-20T09:00:00Z",
  },
  {
    title: "Improve platform experience",
    description:
      "We should improve some areas of the product and make things smoother for users over time. Needs further discussion.",
    status: "todo",
    priority: "high",
    createdAt: "2026-03-15T10:00:00Z",
  },
  {
    title: "Customers cannot reset passwords from mobile app",
    description:
      "Reset password flow returns 500 for mobile users. Support already has several tickets. This blocks account recovery and affects active customers.",
    status: "todo",
    priority: "medium",
    createdAt: "2026-03-15T10:00:00Z",
  },
  {
    title: "Prepare Q2 dashboard cleanup",
    description:
      "Review dashboard widgets and remove unused cards. Internal analytics cleanup, no customer-facing impact.",
    status: "in-progress",
    priority: "medium",
    createdAt: "2026-03-10T08:30:00Z",
  },
  {
    title: "Fix broken admin export for finance reports",
    description:
      "Finance team cannot export monthly CSV reports from admin. This is blocking their close process for the month.",
    status: "in-progress",
    priority: "high",
    createdAt: "2026-03-10T08:30:00Z",
  },
  {
    title: "URGENT: Fix payment outage affecting all new subscriptions",
    description:
      "Critical production issue. New customers cannot subscribe. Revenue impact confirmed.",
    status: "done",
    priority: "high",
    createdAt: "2026-03-01T12:00:00Z",
  },
  {
    title: "Investigate elevated API latency on search endpoint",
    description:
      "P95 latency on search endpoint increased by 40%. No confirmed incidents yet, but this may degrade user experience if it continues.",
    status: "todo",
    priority: "high",
    createdAt: "2026-02-28T16:00:00Z",
  },
  {
    title: "Migrate legacy avatar uploads to new storage bucket",
    description:
      "Technical migration of old avatar assets to new bucket. Planned maintenance work, low immediate user impact.",
    status: "todo",
    priority: "medium",
    createdAt: "2026-02-25T11:15:00Z",
  },
  {
    title: "Blocker: mobile release cannot proceed without crash fix",
    description:
      "App crashes on startup for iOS users in latest release candidate. Mobile team marked release as blocked until root cause is fixed.",
    status: "todo",
    priority: "high",
    createdAt: "2026-03-22T07:45:00Z",
  },
  {
    title: "Update internal runbook for staging environment",
    description:
      "Documentation refresh for staging incident response. Useful but not urgent.",
    status: "todo",
    priority: "low",
    createdAt: "2026-02-10T14:20:00Z",
  },
  {
    title: "IMPORTANT!!! check auth thing",
    description:
      "Something seems wrong with auth. Need to look into it maybe. Not sure how often it happens.",
    status: "todo",
    priority: "high",
    createdAt: "2026-03-18T13:00:00Z",
  },
  {
    title: "SSO login fails for enterprise customers after domain redirect",
    description:
      "Enterprise customers using SSO are unable to log in after redirect from custom domain. This affects paid accounts and onboarding of new enterprise users.",
    status: "todo",
    priority: "high",
    createdAt: "2026-03-18T13:00:00Z",
  },
  {
    title: "Add skeleton loaders to settings page",
    description:
      "UI polish for perceived performance on the settings page. Not tied to any incident or KPI target.",
    status: "todo",
    priority: "low",
    createdAt: "2026-03-05T09:40:00Z",
  },
  {
    title: "Fix bug causing duplicate invoices for retried webhooks",
    description:
      "Webhook retries can create duplicate invoices in rare cases. Finance flagged this as high risk because it may lead to incorrect billing for customers.",
    status: "todo",
    priority: "high",
    createdAt: "2026-03-12T10:10:00Z",
  },
  {
    title: "Research alternative search ranking ideas",
    description:
      "Explore possible ranking improvements for search relevance. Early discovery work, no immediate deliverable.",
    status: "todo",
    priority: "medium",
    createdAt: "2026-02-18T15:45:00Z",
  },
  {
    title: "Fix flaky CI test in billing pipeline",
    description:
      "A flaky CI test occasionally fails and slows down merges, but there is a known retry workaround and no production impact.",
    status: "todo",
    priority: "medium",
    createdAt: "2026-03-21T10:00:00Z",
  },
  {
    title: "Today: restore webhook delivery before partner demo",
    description:
      "Partner integration demo is scheduled today. Webhook delivery is currently broken in demo environment, and the demo will fail unless this is fixed in time.",
    status: "todo",
    priority: "medium",
    createdAt: "2026-03-21T10:00:00Z",
  },
];

const statusMap: Record<SeedTaskInput["status"], TaskStatus> = {
  todo: TaskStatus.TODO,
  "in-progress": TaskStatus.IN_PROGRESS,
  done: TaskStatus.DONE,
};

const priorityMap: Record<SeedTaskInput["priority"], TaskPriority> = {
  low: TaskPriority.LOW,
  medium: TaskPriority.MEDIUM,
  high: TaskPriority.HIGH,
};

export async function seedTaskPrioritizationTest(prisma: PrismaClient) {
  const results = await Promise.all(
    prioritizationTasks.map((task) =>
      prisma.task.upsert({
        where: { title: task.title },
        update: {
          description: task.description,
          status: statusMap[task.status],
          priority: priorityMap[task.priority],
          createdAt: new Date(task.createdAt),
        },
        create: {
          title: task.title,
          description: task.description,
          status: statusMap[task.status],
          priority: priorityMap[task.priority],
          createdAt: new Date(task.createdAt),
        },
      }),
    ),
  );

  console.log(`Seeded ${results.length} prioritization tasks.`);

  return results;
}
