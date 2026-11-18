import Link from "next/link";

import { cn } from "cn";
import { ChevronsUp, ChevronUp, MessageCircle, Minus, PartyPopper, SquarePen } from "lucide-react";
import type { Metadata } from "next";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { Notice } from "@/components/mdp/notice";
import { PageHeader } from "@/components/mdp/page-header";
import { SectionCard } from "@/components/mdp/section-card";
import { StatusBadge } from "@/components/mdp/status-badge";
import { Button } from "@/components/ui/button";
import { rupiah, tanggal } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { daftarFollowUp, daftarPengingat, type Prioritas } from "@/server/data/follow-up";

import { PengingatList } from "../_components/pengingat-list";

export const metadata: Metadata = { title: "Follow-up Pembayaran" };

const PRIO: Record<Prioritas, { Icon: typeof ChevronsUp; kelas: string }> = {
  Tinggi: { Icon: ChevronsUp, kelas: "bg-status-danger text-status-danger-foreground" },
  Sedang: { Icon: ChevronUp, kelas: "bg-status-orange text-status-orange-foreground" },
  Rendah: { Icon: Minus, kelas: "bg-status-neutral text-status-neutral-foreground" },
};

export default async function Page() {
  await wajibAkses("followUp");
  const [item, pengingat] = await Promise.all([daftarFollowUp(), daftarPengingat()]);
  const baru = pengingat.filter((p) => p.baru).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Follow-up Pembayaran"
        description="Tagihan yang perlu ditindaklanjuti. Tagihan lunas otomatis hilang dari daftar."
      />
      <Notice nada="info" icon={MessageCircle} title="Sistem tidak mengirim pesan ke pelanggan">
        Hubungi pelanggan lewat WhatsApp di luar sistem, lalu catat hasilnya di sini.
      </Notice>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        {item.length === 0 ? (
          <div className="bg-card rounded-xl border">
            <EmptyState
              icon={PartyPopper}
              title="Tidak ada tagihan yang perlu follow-up"
              description="Tagihan muncul di sini mulai H-3 sebelum jatuh tempo sampai lunas."
            />
          </div>
        ) : (
          <TableWrap label="Tagihan perlu follow-up">
            <thead>
              <tr>
                <Th width={112}>Prioritas</Th>
                <Th>Tagihan</Th>
                <Th width={120}>Penanda</Th>
                <Th align="right" width={140}>
                  Sisa
                </Th>
                <Th width={96}>
                  <span className="sr-only">Aksi</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {item.map((i) => {
                const { Icon, kelas } = PRIO[i.prioritas];
                return (
                  <tr key={i.idNota} className="hover:bg-muted/40">
                    <Td className="h-14">
                      <span
                        className={cn(
                          "inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-xs font-medium",
                          kelas,
                        )}
                      >
                        <Icon className="size-3" aria-hidden="true" />
                        {i.prioritas}
                      </span>
                    </Td>
                    <Td>
                      <Stack
                        utama={<span className="font-medium">{i.nomor}</span>}
                        ket={`${i.pelanggan} · ${i.terakhirDihubungi ? `terakhir dihubungi ${tanggal(i.terakhirDihubungi)}` : "belum pernah dihubungi"}`}
                        className="min-w-48"
                      />
                    </Td>
                    <Td>
                      <StatusBadge status={i.penanda} />
                    </Td>
                    <Td align="right" className="font-medium whitespace-nowrap tabular-nums">
                      {rupiah(i.sisa)}
                    </Td>
                    <Td>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/follow-up/${encodeURIComponent(i.idNota)}`}
                          aria-label={`Catat tindak lanjut ${i.nomor}`}
                        >
                          <SquarePen aria-hidden="true" />
                          Catat
                        </Link>
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
        <SectionCard
          title="Pengingat"
          description="Pengingat dalam aplikasi untuk Admin"
          actions={baru > 0 && <StatusBadge status={`${baru} baru`} nada="info" />}
        >
          <PengingatList items={pengingat} />
        </SectionCard>
      </div>
    </div>
  );
}
