import { cn } from "cn";

/** Kartu bagian dengan judul 16px seperti di desain. */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn("bg-card text-card-foreground flex min-w-0 flex-col gap-4 rounded-xl border py-4", className)}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start gap-3 px-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {title && <h2 className="text-base leading-[22px] font-medium">{title}</h2>}
            {description && <div className="text-muted-foreground text-sm leading-5">{description}</div>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("flex flex-col gap-4 px-4", bodyClassName)}>{children}</div>
    </section>
  );
}
