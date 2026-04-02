"use client";

import dynamic from "next/dynamic";
import type { Task, TaskPriority, TaskStatus } from "#prisma/browser";
import { Header } from "@/components/layout/Header";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { AiPanel } from "@/components/tasks/AiPanel";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskToolbar } from "@/components/tasks/TaskToolbar";
import { Card } from "@/components/ui/Card";
import {
  CONFIRMATION_MESSAGES,
  LOADING_STATES,
} from "@/lib/constants/ui.constants";
import type { TaskDateSortDirection } from "@/lib/constants/task.constants";

const TaskModal = dynamic(
  () => import("@/components/tasks/TaskModal").then((mod) => mod.TaskModal),
);
const ConfirmationModal = dynamic(() =>
  import("@/components/ui/ConfirmationModal").then(
    (mod) => mod.ConfirmationModal,
  ),
);

type TaskDashboardProps = {
  initialTasks: Task[];
  activeStatus: TaskStatus | null;
  prioritySort: TaskPriority;
  dateSort: TaskDateSortDirection;
};

export function TaskDashboard({
  initialTasks,
  activeStatus,
  prioritySort,
  dateSort,
}: TaskDashboardProps) {
  const {
    setActiveStatus,
    setPrioritySort,
    toggleDateSort,
  } = useTaskFilters({ activeStatus, prioritySort, dateSort });
  const {
    modalMode,
    selectedTask,
    isModalOpen,
    openCreateModal,
    openEditModal,
    closeModal,
    saveTask,
    taskPendingDeletion,
    isDeletingTask,
    deleteError,
    requestDeleteTask,
    cancelDeleteTask,
    confirmDeleteTask,
  } = useTaskMutations();

  return (
    <>
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <Header />

          <TaskToolbar
            activeStatus={activeStatus}
            prioritySort={prioritySort}
            dateSort={dateSort}
            onCreate={openCreateModal}
            onStatusChange={setActiveStatus}
            onSortChange={setPrioritySort}
            onDateSortToggle={toggleDateSort}
          />

          <AiPanel />

          <Card className="overflow-hidden border-slate-800/95 bg-slate-900/60">
            <TaskList
              tasks={initialTasks}
              onDelete={requestDeleteTask}
              onEdit={openEditModal}
            />
          </Card>
        </div>
      </main>

      <TaskModal
        key={`${modalMode}:${selectedTask?.id ?? "new"}:${isModalOpen ? "open" : "closed"}`}
        open={isModalOpen}
        mode={modalMode}
        task={selectedTask}
        onClose={closeModal}
        onSave={saveTask}
      />

      <ConfirmationModal
        open={taskPendingDeletion !== null}
        title={CONFIRMATION_MESSAGES.DELETE_TASK_TITLE}
        description={CONFIRMATION_MESSAGES.DELETE_TASK_MESSAGE}
        confirmLabel={CONFIRMATION_MESSAGES.DELETE_TASK_CONFIRM}
        cancelLabel={CONFIRMATION_MESSAGES.DELETE_TASK_CANCEL}
        confirmVariant="danger"
        loading={isDeletingTask}
        loadingLabel={LOADING_STATES.DELETING}
        error={deleteError}
        onClose={cancelDeleteTask}
        onConfirm={confirmDeleteTask}
      />
    </>
  );
}
