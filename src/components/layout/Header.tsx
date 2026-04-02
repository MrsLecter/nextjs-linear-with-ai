import { Card } from "@/components/ui/Card";

export function Header() {
  return (
    <Card className="border-slate-800/95 bg-slate-900/65 px-5 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Engineering Tracker
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            DevLog
          </h1>
        </div>
      </div>
    </Card>
  );
}
