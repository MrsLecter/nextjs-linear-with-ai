"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Bot, Sparkles } from "lucide-react";
import type { Task } from "#prisma/browser";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PrioritizeButton } from "@/components/tasks/PrioritizeButton";

const PrioritizationModal = dynamic(() =>
  import("@/components/tasks/PrioritizationModal").then(
    (mod) => mod.PrioritizationModal,
  ),
);

type AiPanelProps = {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
};

export function AiPanel({ tasks, onOpenTask }: AiPanelProps) {
  const [isPrioritizationOpen, setIsPrioritizationOpen] = useState(false);

  return (
    <>
      <Card className="border-slate-800/95 bg-slate-900/70 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <div className="flex size-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/12 text-blue-200">
                <Bot className="size-4" />
              </div>
              <span>AI Assistant</span>
            </div>
            <p className="text-sm text-slate-300">
              Run practical actions on the current task queue.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              className="w-full justify-center border-blue-500/30 bg-blue-500/10 text-blue-100 hover:border-blue-400/40 hover:bg-blue-500/15 hover:text-white sm:w-auto"
              leadingIcon={<Sparkles className="size-4" />}
              variant="ghost"
            >
              Summarize backlog
            </Button>
            <PrioritizeButton
              onClick={() => {
                setIsPrioritizationOpen(true);
              }}
            />
          </div>
        </div>
      </Card>

      <PrioritizationModal
        onClose={() => {
          setIsPrioritizationOpen(false);
        }}
        onOpenTask={onOpenTask}
        open={isPrioritizationOpen}
        tasks={tasks}
      />
    </>
  );
}
