import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex min-w-0 flex-col gap-2 rounded-xl border p-4 shadow-xs",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <p className="text-muted-foreground min-w-0 flex-1 truncate text-sm">{label}</p>
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      </div>
      <p className="text-2xl leading-8 font-semibold tracking-[-0.6px] tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground text-xs leading-4">{hint}</p>}
    </div>
  );
}
