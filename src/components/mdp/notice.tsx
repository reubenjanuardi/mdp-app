import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

type Nada = "danger" | "warning" | "info" | "neutral" | "success";

const KELAS: Record<Nada, string> = {
  danger: "border-destructive bg-destructive-subtle text-destructive",
  warning: "border-transparent bg-status-warning text-status-warning-foreground",
  info: "border-transparent bg-status-info text-status-info-foreground",
  success: "border-transparent bg-status-success text-status-success-foreground",
  neutral: "border-transparent bg-muted text-muted-foreground",
};

/** Kotak pesan seperti di desain: judul tebal dan keterangan. role="alert" hanya untuk pesan gagal. */
export function Notice({
  nada,
  icon: Icon,
  title,
  children,
  className,
}: {
  nada: Nada;
  icon: LucideIcon;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={nada === "danger" ? "alert" : "status"}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-5",
        KELAS[nada],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-medium">{title}</p>
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
