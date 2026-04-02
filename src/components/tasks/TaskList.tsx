import type { Task } from "#prisma/browser";
import { TaskCard } from "@/components/tasks/TaskCard";

type TaskListProps = {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
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
