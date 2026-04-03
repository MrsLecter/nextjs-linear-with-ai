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

const decompositionTasks: SeedTaskInput[] = [
  {
    "title": "Add task status filter to the list page",
    "description": "Implement filtering on the tasks list so users can view only todo, in-progress, or done tasks. The filter should work instantly on the page and be easy to reset.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "title": "Fix task creation form validation",
    "description": "The create task form currently allows submitting empty title and invalid priority values in some cases. Add proper client-side and server-side validation and show clear error messages.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-20T09:15:00.000Z"
  },
  {
    "title": "Persist tasks between page reloads",
    "description": "Tasks disappear after refreshing the page. Add persistent storage so created and edited tasks remain available after reload.",
    "status": "in-progress",
    "priority": "high",
    "createdAt": "2026-03-18T14:30:00.000Z"
  },
  {
    "title": "Add AI task decomposition action",
    "description": "Add an action on the task details page that sends the current task title and description to the AI backend and returns a structured list of subtasks for preview before saving.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-28T11:45:00.000Z"
  },
  {
    "title": "Create endpoint for saving generated subtasks",
    "description": "Implement a backend endpoint that accepts validated generated subtasks and stores them linked to the parent task.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-29T08:20:00.000Z"
  },
  {
    "title": "Improve task list loading performance",
    "description": "The task list feels slow when many items are present. Investigate where time is spent and improve rendering or data loading performance.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-12T16:10:00.000Z"
  },
  {
    "title": "Refactor task service layer",
    "description": "Task-related logic is duplicated across multiple API handlers. Extract shared logic into a service layer and reduce repetition.",
    "status": "in-progress",
    "priority": "medium",
    "createdAt": "2026-03-10T13:00:00.000Z"
  },
  {
    "title": "Set up error logging for AI requests",
    "description": "Add logging for failed AI calls, invalid structured responses, and backend validation failures so issues can be debugged more easily.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-27T17:25:00.000Z"
  },
  {
    "title": "Write README for local setup",
    "description": "Document how to install dependencies, configure environment variables, run the app locally, and explain the main architectural decisions.",
    "status": "todo",
    "priority": "low",
    "createdAt": "2026-03-30T12:00:00.000Z"
  },
  {
    "title": "Polish task details page UI",
    "description": "Improve spacing, section hierarchy, and button placement on the task details page so decomposition results and task metadata are easier to read.",
    "status": "done",
    "priority": "low",
    "createdAt": "2026-03-14T15:40:00.000Z"
  },
  {
    "title": "Fix markdown rendering in task description",
    "description": "Descriptions that include markdown syntax are displayed incorrectly in the task view. Ensure markdown is rendered safely and consistently.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-22T10:50:00.000Z"
  },
  {
    "title": "Add optimistic update for task status changes",
    "description": "When a user changes task status, update the UI immediately and rollback if the server request fails.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-26T09:35:00.000Z"
  },
  {
    "title": "Add task status filter to the list page",
    "description": "Implement filtering on the tasks list so users can view only todo, in-progress, or done tasks. The filter should work instantly on the page and be easy to reset.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-25T10:00:00.000Z"
  },
  {
    "title": "Fix task creation form validation",
    "description": "The create task form currently allows submitting empty title and invalid priority values in some cases. Add proper client-side and server-side validation and show clear error messages.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-20T09:15:00.000Z"
  },
  {
    "title": "Persist tasks between page reloads",
    "description": "Tasks disappear after refreshing the page. Add persistent storage so created and edited tasks remain available after reload.",
    "status": "in-progress",
    "priority": "high",
    "createdAt": "2026-03-18T14:30:00.000Z"
  },
  {
    "title": "Add AI task decomposition action",
    "description": "Add an action on the task details page that sends the current task title and description to the AI backend and returns a structured list of subtasks for preview before saving.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-28T11:45:00.000Z"
  },
  {
    "title": "Create endpoint for saving generated subtasks",
    "description": "Implement a backend endpoint that accepts validated generated subtasks and stores them linked to the parent task.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-29T08:20:00.000Z"
  },
  {
    "title": "Improve task list loading performance",
    "description": "The task list feels slow when many items are present. Investigate where time is spent and improve rendering or data loading performance.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-12T16:10:00.000Z"
  },
  {
    "title": "Refactor task service layer",
    "description": "Task-related logic is duplicated across multiple API handlers. Extract shared logic into a service layer and reduce repetition.",
    "status": "in-progress",
    "priority": "medium",
    "createdAt": "2026-03-10T13:00:00.000Z"
  },
  {
    "title": "Set up error logging for AI requests",
    "description": "Add logging for failed AI calls, invalid structured responses, and backend validation failures so issues can be debugged more easily.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-27T17:25:00.000Z"
  },
  {
    "title": "Write README for local setup",
    "description": "Document how to install dependencies, configure environment variables, run the app locally, and explain the main architectural decisions.",
    "status": "todo",
    "priority": "low",
    "createdAt": "2026-03-30T12:00:00.000Z"
  },
  {
    "title": "Polish task details page UI",
    "description": "Improve spacing, section hierarchy, and button placement on the task details page so decomposition results and task metadata are easier to read.",
    "status": "done",
    "priority": "low",
    "createdAt": "2026-03-14T15:40:00.000Z"
  },
  {
    "title": "Fix markdown rendering in task description",
    "description": "Descriptions that include markdown syntax are displayed incorrectly in the task view. Ensure markdown is rendered safely and consistently.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-22T10:50:00.000Z"
  },
  {
    "title": "Add optimistic update for task status changes",
    "description": "When a user changes task status, update the UI immediately and rollback if the server request fails.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-26T09:35:00.000Z"
  },
  {
    "title": "Improve notifications",
    "description": "Make notifications better.",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-03-31T09:00:00.000Z"
  },
  {
    "title": "Fix bug in tasks",
    "description": "Users reported a problem with tasks. Need to fix it soon.",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-03-31T10:00:00.000Z"
  },
  {
    "title": "Update AI flow",
    "description": "Something in the AI flow should work differently.",
    "status": "in-progress",
    "priority": "medium",
    "createdAt": "2026-03-31T11:00:00.000Z"
  },
  {
    "title": "Do backend cleanup",
    "description": "Clean up the backend code where needed.",
    "status": "todo",
    "priority": "low",
    "createdAt": "2026-03-31T12:00:00.000Z"
  }
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

export async function seedTaskDecompositionTest(prisma: PrismaClient) {
  const results = await Promise.all(
    decompositionTasks.map((task) =>
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

  console.log(`Seeded ${results.length} decomposition tasks.`);

  return results;
}
