import { listTasks } from "@/services/task.service";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";
import {
  DEFAULT_TASK_DATE_SORT_DIRECTION,
  DEFAULT_TASK_PRIORITY_SORT,
} from "@/lib/constants/task.constants";
import { parseListTasksSearchParams } from "@/lib/validation/task.schemas";

type HomePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const filters = parseListTasksSearchParams(await searchParams);
  const initialTasks = await listTasks({
    status: filters.status,
    prioritySort: filters.prioritySort ?? DEFAULT_TASK_PRIORITY_SORT,
    dateSort: filters.dateSort ?? DEFAULT_TASK_DATE_SORT_DIRECTION,
  });

  return (
    <TaskDashboard
      activeStatus={filters.status ?? null}
      dateSort={filters.dateSort ?? DEFAULT_TASK_DATE_SORT_DIRECTION}
      initialTasks={initialTasks}
      prioritySort={filters.prioritySort ?? DEFAULT_TASK_PRIORITY_SORT}
    />
  );
}
