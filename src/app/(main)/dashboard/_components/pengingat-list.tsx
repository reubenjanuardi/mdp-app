import Link from "next/link";

import { cn } from "cn";
import { Bell, CircleAlert, Clock } from "lucide-react";

import { tanggalJam } from "@/lib/format";
import type { Pengingat } from "@/server/data/follow-up";

const IKON = {
  Terlambat: { Icon: CircleAlert, kelas: "bg-status-danger text-status-danger-foreground" },
  "H-0": { Icon: Clock, kelas: "bg-status-orange text-status-orange-foreground" },
  Mendekati: { Icon: Clock, kelas: "bg-status-warning text-status-warning-foreground" },
  Jadwal: { Icon: Bell, kelas: "bg-muted text-muted-foreground" },
} as const;

function waktuPengingat(w: Date) {
  const teks = tanggalJam(w);
  const hari = tanggalJam(new Date()).split(",")[0];
  return teks.startsWith(hari) ? `Hari ini, ${teks.split(", ")[1]}` : teks;
}

export function PengingatList({ items, onPilih }: { items: Pengingat[]; onPilih?: () => void }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Tidak ada pengingat. Tagihan yang mendekati jatuh tempo akan muncul di sini.
      </p>
    );
  }
  return (
    <ul className="divide-y">
      {items.map((p) => {
        const { Icon, kelas } = IKON[p.jenis];
        return (
          <li key={p.id}>
            <Link
              href={p.href}
              onClick={onPilih}
              className="hover:bg-muted/60 focus-visible:ring-ring/50 -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-3 outline-none focus-visible:ring-3"
            >
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", kelas)}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{p.judul}</span>
                <span className="text-muted-foreground text-xs">
                  {p.jenis === "Jadwal" ? `Dijadwalkan ${tanggalJam(p.waktu)}` : waktuPengingat(p.waktu)}
                </span>
              </span>
              {p.baru && (
                <span className="mt-1.5 flex items-center">
                  <span className="bg-primary size-2 rounded-full" aria-hidden="true" />
                  <span className="sr-only">Baru</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
