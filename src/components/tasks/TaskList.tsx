import { TaskCard } from "@/components/tasks/TaskCard";
import type { TaskWithParent } from "@/lib/types/task.types";

type TaskListProps = {
  tasks: TaskWithParent[];
  onEdit: (task: TaskWithParent) => void;
  onDelete: (task: TaskWithParent) => void;
};

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="px-5 py-10 text-sm text-slate-400">
        No tasks found. Create a new task or change your filters to see more tasks
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/80 bg-slate-950/20">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
