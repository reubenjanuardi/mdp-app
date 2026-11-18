import Link from "next/link";

import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

function halamanTampil(sekarang: number, total: number): (number | "…")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, sekarang - 1, sekarang, sekarang + 1]);
  const urut = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const hasil: (number | "…")[] = [];
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) hasil.push("…");
    hasil.push(n);
  });
  return hasil;
}

export function Pagination({
  halaman,
  totalHalaman,
  href,
}: {
  halaman: number;
  totalHalaman: number;
  href: (hal: number) => string;
}) {
  if (totalHalaman <= 1) return null;
  const kelas =
    "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-2.5 text-sm font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 outline-none";
  return (
    <nav aria-label="Halaman" className="flex items-center gap-1">
      {halaman > 1 ? (
        <Link href={href(halaman - 1)} className={kelas} scroll={false}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sebelumnya</span>
          <span className="sr-only sm:hidden">Halaman sebelumnya</span>
        </Link>
      ) : null}
      {halamanTampil(halaman, totalHalaman).map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="text-muted-foreground px-1" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            scroll={false}
            aria-current={n === halaman ? "page" : undefined}
            aria-label={`Halaman ${n}`}
            className={cn(kelas, "px-0", n === halaman && "bg-background border")}
          >
            {n}
          </Link>
        ),
      )}
      {halaman < totalHalaman ? (
        <Link href={href(halaman + 1)} className={kelas} scroll={false}>
          <span className="hidden sm:inline">Berikutnya</span>
          <span className="sr-only sm:hidden">Halaman berikutnya</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
