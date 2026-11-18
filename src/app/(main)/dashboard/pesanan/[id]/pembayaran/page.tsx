import Link from "next/link";
import { notFound } from "next/navigation";

import { FileText, Info } from "lucide-react";
import type { Metadata } from "next";

import { Stack } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { Kv, SumRow } from "@/components/mdp/kv";
import { Notice } from "@/components/mdp/notice";
import { PageHeader } from "@/components/mdp/page-header";
import { SectionCard } from "@/components/mdp/section-card";
import { StatusBadge } from "@/components/mdp/status-badge";
import { Button } from "@/components/ui/button";
import { rupiah, tanggal } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { detailPesanan } from "@/server/data/detail";
import { labelTagihan } from "@/server/data/pesanan";

import { PembayaranForm } from "./pembayaran-form";

export const metadata: Metadata = { title: "Catat Pembayaran" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nota?: string }>;
}) {
  await wajibAkses("pembayaran", "T");
  const id = decodeURIComponent((await params).id);
  const { nota: idNota } = await searchParams;
  const d = await detailPesanan(id);
  if (!d) notFound();

  const terbuka = d.ringkas.nota.filter((n) => n.ringkasan.status !== "Lunas");
  const pilihan = terbuka.length ? terbuka : d.ringkas.nota;
  const n = pilihan.find((x) => x.id === idNota) ?? pilihan[0];

  if (!n) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Catat Pembayaran" description={`Pesanan ${id}`} />
        <div className="bg-card rounded-xl border">
          <EmptyState
            icon={FileText}
            title="Belum ada Nota Faktur"
            description="Pembayaran dicatat terhadap nota. Buat tagihan untuk pesanan ini terlebih dahulu."
            action={
              <Button asChild>
                <Link href={`/dashboard/pesanan/${encodeURIComponent(id)}/tagihan/baru`}>Tambah Tagihan</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const r = n.ringkasan;
  const riwayat = d.pembayaran.filter((b) => b.id_faktur === n.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catat Pembayaran"
        description={`Isian mengikuti bukti transaksi bank untuk Nota ${n.nomor}.`}
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        <div className="min-w-0">
          <PembayaranForm
            idPesanan={id}
            nota={pilihan.map((x) => ({ id: x.id, nomor: x.nomor }))}
            awal={n.id}
            pelanggan={d.ringkas.pelanggan}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard title="Ringkasan Tagihan">
            <dl className="grid grid-cols-2 gap-4">
              <Kv label="Nota" mono>
                <span className="text-primary">{n.nomor}</span>
              </Kv>
              <Kv label="Status">
                <StatusBadge status={labelTagihan(r)} />
              </Kv>
            </dl>
            <div className="flex flex-col gap-2">
              <SumRow label="Total tagihan" value={rupiah(r.total)} />
              <SumRow label="Terverifikasi" value={rupiah(r.terverifikasi)} />
              <SumRow label="Menunggu verifikasi" value={rupiah(r.menunggu)} />
              <div className="bg-border h-px" />
              <SumRow label="Sisa tagihan" value={rupiah(r.sisa)} strong />
            </div>
            <Notice nada="info" icon={Info} title="Setelah diverifikasi">
              Pembayaran baru dihitung ke sisa tagihan setelah Admin memverifikasinya. Kelebihan bayar dicatat sebagai
              Lebih Bayar.
            </Notice>
          </SectionCard>
          <SectionCard title="Riwayat Pembayaran" bodyClassName="px-0">
            {riwayat.length === 0 ? (
              <p className="text-muted-foreground px-4 text-sm">Belum ada pembayaran untuk nota ini.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th scope="col" className="h-10 px-3 text-left font-medium">
                      Tanggal
                    </th>
                    <th scope="col" className="h-10 px-3 text-right font-medium">
                      Nominal
                    </th>
                    <th scope="col" className="h-10 px-3 text-left font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {riwayat.map((b) => (
                    <tr key={b.id_pembayaran} className="border-t">
                      <td className="h-14 px-3">
                        <Stack
                          utama={<span className="font-medium">{tanggal(b.waktu_pembayaran)}</span>}
                          ket={b.metode}
                        />
                      </td>
                      <td className="px-3 text-right font-medium tabular-nums">{rupiah(b.nominal_pembayaran ?? 0)}</td>
                      <td className="px-3">
                        <StatusBadge status={b.status_verifikasi} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
