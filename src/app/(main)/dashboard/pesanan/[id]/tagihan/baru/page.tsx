import Link from "next/link";
import { notFound } from "next/navigation";

import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";

import { Kv } from "@/components/mdp/kv";
import { Notice } from "@/components/mdp/notice";
import { PageHeader } from "@/components/mdp/page-header";
import { SectionCard } from "@/components/mdp/section-card";
import { StatusBadge } from "@/components/mdp/status-badge";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { labelTagihan, muatPesanan } from "@/server/data/pesanan";
import { sisaPerBaris } from "@/server/data/tagihan";

import { TagihanForm } from "./tagihan-form";

export const metadata: Metadata = { title: "Tambah Tagihan" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await wajibAkses("tagihan", "T");
  const id = decodeURIComponent((await params).id);
  const [p] = await muatPesanan({ id });
  if (!p || p.dihapus) notFound();
  const sisa = await sisaPerBaris(id);
  const sudah = p.nota.reduce((s, n) => s + n.total, 0);
  const habis = sisa.every((b) => b.sisa === 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tambah Tagihan"
        description={`Isian mengikuti Nota Faktur perusahaan. Tagihan tertaut ke ${p.id}.`}
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        <div className="min-w-0">
          {habis ? (
            <div className="flex flex-col gap-4">
              <Notice nada="success" icon={CircleCheck} title="Semua barang sudah ditagihkan">
                Seluruh barang di {p.id} sudah tercantum di Nota Faktur. Tagihan baru tidak diperlukan.
              </Notice>
              <div>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/pesanan/${encodeURIComponent(p.id)}?tab=tagihan`}>Kembali ke pesanan</Link>
                </Button>
              </div>
            </div>
          ) : (
            <TagihanForm
              idPesanan={p.id}
              pelanggan={p.pelanggan}
              jatuhTempo={p.jatuhTempo}
              ppn={p.termasukPpn}
              baris={sisa.map((b) => ({ id: b.id, nama: b.nama, satuan: b.satuan, harga: b.harga, sisa: b.sisa }))}
            />
          )}
        </div>
        <SectionCard title="Pesanan Terkait">
          <dl className="flex flex-col gap-4">
            <Kv label="No. PO" mono>
              <Link href={`/dashboard/pesanan/${encodeURIComponent(p.id)}`} className="text-primary hover:underline">
                {p.id}
              </Link>
            </Kv>
            <Kv label="Total PO">{rupiah(p.total)}</Kv>
            <Kv label="Sudah ditagihkan">{rupiah(sudah)}</Kv>
            <Kv label="Belum ditagihkan">{rupiah(Math.max(0, p.total - sudah))}</Kv>
          </dl>
          {p.nota.length > 0 && (
            <>
              <div className="bg-border h-px" />
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs">Nota sebelumnya</p>
                {p.nota.map((n) => (
                  <div key={n.id} className="flex items-center gap-2">
                    <span className="text-primary font-mono text-xs">{n.nomor}</span>
                    <span className="flex-1" />
                    <StatusBadge status={labelTagihan(n.ringkasan)} />
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
