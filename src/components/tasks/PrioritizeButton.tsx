import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

type PrioritizeButtonProps = {
  onClick: () => void;
};

export function PrioritizeButton({ onClick }: PrioritizeButtonProps) {
  return (
    <Button
      className="w-full justify-center text-slate-200 sm:w-auto"
      leadingIcon={<Sparkles className="size-4" />}
      onClick={onClick}
      variant="ghost"
    >
      Suggest next task
    </Button>
  );
}
