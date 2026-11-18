import { cn } from "cn";

// Tabel dengan gaya desain: kepala abu-abu 40px, baris 52px, sudut 10px.
// Pada layar sempit tabel bergulir di dalam wadahnya sendiri, halaman tidak ikut melebar.

export function TableWrap({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      tabIndex={label ? 0 : undefined}
      className={cn(
        "bg-card w-full overflow-x-auto rounded-lg border focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
  width,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
  width?: number;
}) {
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={cn(
        "bg-muted text-foreground h-10 px-3 font-medium whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td className={cn("h-[52px] border-t px-3 py-2 align-middle", align === "right" && "text-right", className)}>
      {children}
    </td>
  );
}

export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-mono text-xs leading-4", className)}>{children}</span>;
}

/** Teks dua baris: utama + keterangan kecil. */
export function Stack({
  utama,
  ket,
  className,
}: {
  utama: React.ReactNode;
  ket?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 flex-col", className)}>
      <span className="truncate">{utama}</span>
      {ket && <span className="text-muted-foreground truncate text-xs leading-4">{ket}</span>}
    </span>
  );
}
