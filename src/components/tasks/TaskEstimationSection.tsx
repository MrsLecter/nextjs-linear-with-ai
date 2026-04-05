"use client";

import { TriangleDashed, Sparkles } from "lucide-react";
import { AiActionRow } from "@/components/tasks/AiActionRow";

type TaskEstimationSectionProps = {
  onGenerateEstimate: () => void;
};

export function TaskEstimationSection({
  onGenerateEstimate,
}: TaskEstimationSectionProps) {
  return (
    <AiActionRow
      actionIcon={<Sparkles className="size-4" />}
      actionLabel=""
      className="border border-slate-800/80 bg-slate-950/30"
      description="Estimate effort from similar tasks"
      icon={<TriangleDashed className="size-4" />}
      onClick={onGenerateEstimate}
      title="AI estimation"
    />
  );
}
