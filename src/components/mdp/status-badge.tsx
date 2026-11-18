import { cn } from "cn";

export type Nada = "neutral" | "warning" | "orange" | "success" | "danger" | "info";

const KELAS: Record<Nada, { latar: string; titik: string }> = {
  neutral: { latar: "bg-status-neutral text-status-neutral-foreground", titik: "bg-status-neutral-foreground" },
  warning: { latar: "bg-status-warning text-status-warning-foreground", titik: "bg-status-warning-foreground" },
  orange: { latar: "bg-status-orange text-status-orange-foreground", titik: "bg-status-orange-foreground" },
  success: { latar: "bg-status-success text-status-success-foreground", titik: "bg-status-success-foreground" },
  danger: { latar: "bg-status-danger text-status-danger-foreground", titik: "bg-status-danger-foreground" },
  info: { latar: "bg-status-info text-status-info-foreground", titik: "bg-status-info-foreground" },
};

// Warna badge mengikuti PRD 9.3. Label selalu tertulis, sehingga warna bukan satu-satunya penanda.
const NADA_STATUS: Record<string, Nada> = {
  "Belum Bayar": "neutral",
  Sebagian: "warning",
  Lunas: "success",
  Terlambat: "danger",
  "Lebih Bayar": "info",
  "H-3": "warning",
  "H-2": "warning",
  "H-1": "warning",
  "H-0": "orange",
  "Menunggu Verifikasi": "warning",
  Terverifikasi: "success",
  "Dalam Proses": "info",
  Selesai: "success",
  Tertunda: "danger",
  "Belum Dikirim": "neutral",
  "Dalam Kirim": "info",
  Aktif: "success",
  Nonaktif: "neutral",
};

export function nadaStatus(status: string): Nada {
  return NADA_STATUS[status] ?? "neutral";
}

export function StatusBadge({
  status,
  nada,
  className,
  children,
}: {
  status: string;
  nada?: Nada;
  className?: string;
  children?: React.ReactNode;
}) {
  const k = KELAS[nada ?? nadaStatus(status)];
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2 text-xs leading-4 font-medium whitespace-nowrap",
        k.latar,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", k.titik)} aria-hidden="true" />
      {children ?? status}
    </span>
  );
}
