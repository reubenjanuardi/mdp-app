import { cn } from "cn";

/** Pasangan label-nilai seperti di kartu "Data Pesanan". */
export function Kv({
  label,
  children,
  mono,
  className,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <dt className="text-muted-foreground text-xs leading-4">{label}</dt>
      <dd className={cn("break-words", mono ? "font-mono text-xs leading-4" : "text-sm leading-5 font-medium")}>
        {children}
      </dd>
    </div>
  );
}

export function KvGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>{children}</dl>;
}

/** Baris ringkasan: label kiri abu-abu, nilai kanan tebal. */
export function SumRow({ label, value, strong }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm leading-5">
      <span className={cn("min-w-0 flex-1", strong ? "font-medium" : "text-muted-foreground")}>{label}</span>
      <span className={cn("shrink-0 tabular-nums", strong ? "text-lg leading-7 font-semibold" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}

/** Garis waktu vertikal (Aktivitas, Riwayat produksi, Riwayat tindak lanjut). */
export function Timeline({
  items,
}: {
  items: { key: string; judul: React.ReactNode; meta?: React.ReactNode; isi?: React.ReactNode; aksen?: boolean }[];
}) {
  return (
    <ol className="flex flex-col">
      {items.map((it, i) => (
        <li key={it.key} className="flex gap-3">
          <div className="flex flex-col items-center pt-[5px]" aria-hidden="true">
            <span className={cn("size-2.5 shrink-0 rounded-full", it.aksen ? "bg-chart-3" : "bg-primary")} />
            {i < items.length - 1 && <span className="bg-border mt-1 w-px flex-1" />}
          </div>
          <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", i < items.length - 1 && "pb-4")}>
            <p className="text-sm leading-5 font-medium">{it.judul}</p>
            {it.meta && <p className="text-muted-foreground text-xs leading-4">{it.meta}</p>}
            {it.isi && <div className="text-sm leading-5">{it.isi}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
