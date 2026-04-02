type TaskForPrioritizationSignature = {
  id: string | number;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  createdAt: Date | string;
};

export const PRIORITIZATION_CLIENT_CACHE_TTL_MS = 5 * 60 * 1000;
export const PRIORITIZATION_SERVER_CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeCreatedAt(createdAt: Date | string): string {
  if (createdAt instanceof Date) {
    return createdAt.toISOString();
  }

  const parsedDate = new Date(createdAt);

  return Number.isNaN(parsedDate.getTime()) ? String(createdAt) : parsedDate.toISOString();
}

export function getPrioritizationTasksSignature(
  tasks: TaskForPrioritizationSignature[],
): string {
  return tasks
    .map((task) => ({
      id: String(task.id),
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "",
      priority: task.priority ?? "",
      createdAt: normalizeCreatedAt(task.createdAt),
    }))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(
      (task) =>
        [
          task.id,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.createdAt,
        ].join("::"),
    )
    .join("||");
}
