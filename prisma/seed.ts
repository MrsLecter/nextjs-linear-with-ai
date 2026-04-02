import { TaskPriority, TaskStatus } from "#prisma/client";
import prisma from "@/lib/db/prisma";

const now = new Date();

const daysAgo = (days: number, hour: number, minute = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const tasks = [
  {
    title: "Fix session refresh bug after tab idle timeout",
    description:
      "Users who leave DevLog open for more than 30 minutes can submit the task modal, but the mutation fails because the session cookie is stale. Reproduce the idle flow, confirm whether refresh happens on focus, and prevent silent data loss when the request is rejected.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    createdAt: daysAgo(18, 9, 15),
  },
  {
    title: "Investigate slow dashboard loading for projects with 100+ tasks",
    description:
      "The dashboard feels sluggish when the seed database gets larger. Measure whether the bottleneck is the initial task query, client-side filtering, or repeated sorting in the toolbar so we know where to optimize first.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    createdAt: daysAgo(16, 10, 20),
  },
  {
    title: "Add status and priority filters to the task dashboard",
    description:
      "Product wants a quick way to narrow the list during standup. Add filter controls that work together with text search and keep the current sort order intact when filters change.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: daysAgo(15, 11, 5),
  },
  {
    title: "Refactor task service validation before adding AI actions",
    description:
      "The current task mutation path mixes validation, persistence, and user-facing messages. Separate the service responsibilities enough that we can plug in AI prioritization or decomposition later without duplicating form logic.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    createdAt: daysAgo(14, 14, 30),
  },
  {
    title: "Write README setup instructions for local Prisma workflow",
    description:
      "Document how to install dependencies, generate the Prisma client, run migrations, seed the database, and reset local data. New contributors should be able to get the app running without asking in Slack.",
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    createdAt: daysAgo(22, 13, 0),
  },
  {
    title: "Debug failing task update request when description includes markdown",
    description:
      "QA reported that editing a task sometimes fails if the description contains checklists or fenced code blocks copied from an issue tracker. Confirm whether the failure is schema validation, request parsing, or a client-side sanitization problem.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    createdAt: daysAgo(12, 16, 10),
  },
  {
    title: "Design copy for the AI prioritization side panel",
    description:
      "We need concise explanatory text for the panel that suggests why a task moved up or down. Draft empty states, loading text, and a short disclaimer that the ranking is advisory rather than automatic.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    createdAt: daysAgo(11, 10, 45),
  },
  {
    title: "Clean up Prisma naming before adding subtasks",
    description:
      "Review whether current model and enum names will still make sense once we introduce subtasks, AI-generated task suggestions, and possible audit history. The goal is to spot awkward names early, not to do a full migration yet.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: daysAgo(10, 9, 50),
  },
  {
    title: "Improve empty state for first-time teams",
    description:
      "Right now the dashboard looks broken when there are no tasks. Replace the blank list with a clearer onboarding state that explains what DevLog is for and gives the user an obvious first action.",
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    createdAt: daysAgo(20, 15, 40),
  },
  {
    title: "Trace duplicate task creation on slow connections",
    description:
      "A teammate managed to create the same task twice by retrying after the UI looked stuck. Figure out whether the issue comes from double form submission, optimistic UI, or the API handling repeated requests poorly.",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    createdAt: daysAgo(9, 17, 5),
  },
  {
    title: "Plan how AI-generated subtasks should appear in the UI",
    description:
      "We know we want decomposition, but we have not agreed whether generated subtasks should be drafts, checklist items, or real child tasks. Outline options, identify edge cases around editing, and propose what should happen when users regenerate suggestions.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: daysAgo(8, 11, 25),
  },
  {
    title: "Create seed data for realistic AI feature evaluation",
    description:
      "Replace placeholder demo tasks with a believable engineering backlog that includes bugs, UI work, docs, investigation items, and ambiguous requests. The dataset should help evaluate prioritization and decomposition behavior rather than just making the UI look populated.",
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    createdAt: daysAgo(2, 9, 0),
  },
  {
    title: "Review whether completed tasks should stay in default dashboard sort",
    description:
      "The current default may bury recently active work under a long list of finished items. Check how the dashboard behaves with a realistic mix of statuses and decide whether completed tasks need their own section or secondary sort rule.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: daysAgo(7, 14, 0),
  },
  {
    title: "Figure out what the onboarding flow should include",
    description:
      "We have broad agreement that first-time users need more guidance, but the exact steps are undefined. Identify the minimum onboarding experience that helps a new team create tasks, understand statuses, and try the AI tools without feeling overwhelmed.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: daysAgo(6, 12, 35),
  },
  {
    title: "Make task cards easier to scan during standup",
    description:
      "People are reading the board live in meetings and want the most important information to pop faster. Revisit hierarchy, spacing, and metadata placement without turning the card into a dense wall of badges.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    createdAt: daysAgo(5, 15, 20),
  },
  {
    title: "Investigate why task search misses recently edited items",
    description:
      "Search results sometimes lag behind after a task is updated in the modal. Confirm whether we have stale client state, an ordering bug in local filtering, or a server response shape that is not replacing the existing item correctly.",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    createdAt: daysAgo(4, 10, 10),
  },
  {
    title: "Decide what a useful weekly summary should contain",
    description:
      "Leadership asked for a lightweight progress summary, but nobody has defined the output yet. Work out whether the summary should focus on completed tasks, blocked work, priority shifts, or AI-generated highlights, and capture the assumptions before implementation starts.",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    createdAt: daysAgo(3, 16, 45),
  },
  {
    title: "Harden task creation form error states",
    description:
      "Validation errors currently feel abrupt and do not always tell the user what to fix next. Improve the inline and form-level feedback so failed submissions are recoverable, especially when the request fails after the user has written a longer description.",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: daysAgo(1, 13, 30),
  },
];

async function main() {
  await prisma.task.deleteMany();
  await prisma.task.createMany({ data: tasks });

  console.log(`Seeded ${tasks.length} tasks`);
}

main()
  .catch((error) => {
    console.error("Failed to seed tasks", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
