export const PRIORITIZATION_SYSTEM_PROMPT = `You are an AI prioritization assistant inside a task management application.

You must choose one primary next task from the provided task list.

Your goal is to identify the most important and appropriate task to work on now, while also reflecting uncertainty and plausible prerequisite relationships without overstating them.

Use these principles:
- rely only on the provided task data
- never invent facts
- never invent task IDs
- never select a task with status = "done"
- do not assume hidden dependencies as facts
- if a dependency is uncertain, say so explicitly
- if a task seems important but may plausibly depend on another shortlisted task, prefer the task that more directly unblocks execution or release flow

How to prioritize:
- title and description are the primary signals of real importance
- look for concrete signs of urgency, blocker risk, bug severity, customer impact, business impact, release impact, or time sensitivity
- prefer tasks with clear, actionable problem statements over vague or exploratory tasks when importance is otherwise similar
- use baselineScore, priority, status, and createdAt as supporting signals and tie-breakers, not as the sole source of truth
- do not overreact to words like "urgent", "critical", or "asap" unless the title/description contains concrete supporting context
- treat vague, generic, or low-actionability tasks as less compelling unless structured signals strongly support them

Output requirements:
- return strict JSON only
- no markdown
- no extra text
- explanation must be grounded only in the provided fields
- explanation must be concise and specific
- return exactly one primary task
- return up to 2 alternatives
- return up to 1 possible prerequisite
- alternatives and possiblePrerequisites must be arrays, even if empty`;

export type PrioritizationPromptTaskInput = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  baselineScore: number;
};

export function buildPrioritizationUserPrompt(
  tasks: PrioritizationPromptTaskInput[],
): string {
  return [
    "Choose one primary next task to work on right now.",
    "",
    "Use all provided fields, but prioritize based mainly on title and description.",
    "",
    "Primary evaluation criteria from title and description:",
    "- urgency",
    "- blocker signals",
    "- customer or business impact",
    "- production or release risk",
    "- actionability and specificity",
    "- whether the task describes a concrete problem or consequence",
    "",
    "Secondary supporting signals:",
    "- baselineScore",
    "- priority",
    "- status",
    "- task age",
    "",
    "Decision rules:",
    '- never choose a task with status = "done"',
    "- treat title and description as the main source of real importance",
    "- use baselineScore as a supporting signal and tie-breaker",
    "- prefer concrete and actionable tasks over vague tasks when importance is otherwise close",
    '- prefer "todo" over "in-progress" when the semantic importance is close',
    '- do not treat words like "urgent", "critical", or "asap" as sufficient by themselves',
    "- if a task appears highly important but may plausibly depend on another shortlisted task, prefer the task that more directly unblocks execution or release flow",
    "- do not assume hidden dependencies as facts",
    "- when dependency is uncertain from the provided fields, reflect that uncertainty in alternatives or possiblePrerequisites",
    "",
    "Return JSON with exactly this shape:",
    '{ "primaryTaskId": "string", "primaryTaskTitle": "string", "explanation": "string", "alternatives": [{ "taskId": "string", "whyNotFirst": "string" }], "possiblePrerequisites": [{ "taskId": "string", "reason": "string" }] }',
    "",
    "Explanation requirements:",
    "- 1-3 sentences",
    "- concise",
    "- specific",
    "- grounded only in the input data",
    "- mention the strongest reason or two for why this task is first now",
    "",
    "Alternatives requirements:",
    "- include up to 2 viable alternative tasks",
    "- explain briefly why each is not first",
    "- do not include the primary task",
    "",
    "Possible prerequisite requirements:",
    "- include at most 1 task",
    "- only include it if a prerequisite relationship seems plausible from the provided fields",
    '- do not present uncertain dependencies as facts; use wording like "may unblock" or "could be needed first" when appropriate',
    "- do not include the primary task",
    "",
    "Tasks:",
    "",
    JSON.stringify(tasks),
  ].join("\n");
}
