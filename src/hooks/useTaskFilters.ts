"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_TASK_DATE_SORT_DIRECTION,
  DEFAULT_TASK_PRIORITY_SORT,
  type TaskDateSortDirection,
} from "@/lib/constants/task.constants";
import type { TaskPriority, TaskStatus } from "#prisma/browser";

type UseTaskFiltersOptions = {
  activeStatus: TaskStatus | null;
  prioritySort: TaskPriority;
  dateSort: TaskDateSortDirection;
};

type TaskFilterKey = "status" | "prioritySort" | "dateSort";

export function useTaskFilters({
  activeStatus,
  prioritySort,
  dateSort,
}: UseTaskFiltersOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateSearchParams = (
    key: TaskFilterKey,
    value: string | null,
    defaultValue?: string | null,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return {
    activeStatus,
    setActiveStatus: (status: TaskStatus | null) => {
      updateSearchParams("status", status, null);
    },
    prioritySort,
    setPrioritySort: (priority: TaskPriority) => {
      updateSearchParams(
        "prioritySort",
        priority,
        DEFAULT_TASK_PRIORITY_SORT,
      );
    },
    dateSort,
    toggleDateSort: () => {
      updateSearchParams(
        "dateSort",
        dateSort === "desc" ? "asc" : "desc",
        DEFAULT_TASK_DATE_SORT_DIRECTION,
      );
    },
  };
}
