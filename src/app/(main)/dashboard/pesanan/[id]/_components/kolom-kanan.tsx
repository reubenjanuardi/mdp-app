import Link from "next/link";

import { Clock, Plus } from "lucide-react";

import { SumRow, Timeline } from "@/components/mdp/kv";
import { Notice } from "@/components/mdp/notice";
import { SectionCard } from "@/components/mdp/section-card";
import { StatusBadge } from "@/components/mdp/status-badge";
import { Button } from "@/components/ui/button";
import { rupiah, tanggal, tanggalJam } from "@/lib/format";
import type { DetailPesanan } from "@/server/data/detail";

import { KoreksiDialog } from "./koreksi-dialog";

export function RingkasanPembayaran({
  d,
  bisaBayar,
  bisaKoreksi,
}: {
  d: DetailPesanan;
  bisaBayar: boolean;
  bisaKoreksi: boolean;
}) {
  const t = d.ringkas.tagihan;
  const jumlahMenunggu = d.pembayaran.filter((b) => b.status_verifikasi === "Menunggu Verifikasi").length;
  const persen = t.total > 0 ? Math.min(100, Math.round((t.terverifikasi / t.total) * 100)) : 0;
  const notaBelumLunas = d.ringkas.nota.find((n) => n.ringkasan.status !== "Lunas");

  return (
    <SectionCard title="Ringkasan Pembayaran">
      <div className="flex flex-col gap-1.5">
        <p className="text-muted-foreground text-xs leading-4">Sisa tagihan</p>
        <p className="text-3xl leading-9 font-semibold tracking-[-0.75px] tabular-nums">{rupiah(t.sisa)}</p>
      </div>
      <div
        role="progressbar"
        aria-label="Bagian tagihan yang sudah terverifikasi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={persen}
        className="bg-muted h-2 overflow-hidden rounded-full"
      >
        <div className="bg-primary h-full rounded-full" style={{ width: `${persen}%` }} />
      </div>
      <div className="flex flex-col gap-2">
        <SumRow label="Total tagihan" value={rupiah(t.total)} />
        <SumRow label="Terverifikasi" value={rupiah(t.terverifikasi)} />
        <SumRow label="Menunggu verifikasi" value={rupiah(t.menunggu)} />
        {t.lebihBayar > 0 && <SumRow label="Lebih bayar" value={rupiah(t.lebihBayar)} />}
      </div>
      {jumlahMenunggu > 0 && (
        <Notice nada="warning" icon={Clock} title={`${jumlahMenunggu} pembayaran menunggu verifikasi`}>
          Belum dihitung ke sisa tagihan sampai Admin mencocokkan bukti setor.
        </Notice>
      )}
      {d.ringkas.nota.length === 0 && (
        <p className="text-muted-foreground text-sm">Pembayaran dapat dicatat setelah Nota Faktur dibuat.</p>
      )}
      {(bisaBayar || bisaKoreksi) && d.ringkas.nota.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {bisaBayar && notaBelumLunas && (
            <Button asChild>
              <Link
                href={`/dashboard/pesanan/${encodeURIComponent(d.ringkas.id)}/pembayaran?nota=${encodeURIComponent(notaBelumLunas.id)}`}
              >
                <Plus aria-hidden="true" />
                Catat Pembayaran
              </Link>
            </Button>
          )}
          {bisaKoreksi && (
            <KoreksiDialog
              pelanggan={d.ringkas.pelanggan}
              nota={d.ringkas.nota.map((n) => ({
                id: n.id,
                nomor: n.nomor,
                status: n.ringkasan.status,
                otomatis: n.ringkasan.status,
                dikoreksi: n.ringkasan.dikoreksi,
                sisa: n.ringkasan.sisa,
              }))}
            />
          )}
        </div>
      )}
    </SectionCard>
  );
}

export function KartuProduksi({ d }: { d: DetailPesanan }) {
  const terakhir = d.produksi[0];
  return (
    <SectionCard title="Status Produksi">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={d.ringkas.produksi} />
        {terakhir && (
          <span className="text-muted-foreground text-xs">
            Diperbarui {tanggal(terakhir.dibuat_pada)}
            {terakhir.oleh ? ` oleh ${terakhir.oleh.split(" (")[0]}` : ""}
          </span>
        )}
      </div>
    </SectionCard>
  );
}

export function KartuAktivitas({ d }: { d: DetailPesanan }) {
  const item = d.aktivitas.slice(0, 6);
  return (
    <SectionCard title="Aktivitas">
      {item.length === 0 ? (
        <p className="text-muted-foreground text-sm">Belum ada aktivitas.</p>
      ) : (
        <Timeline
          items={item.map((a, i) => ({
            key: `${a.waktu.getTime()}-${i}`,
            judul: a.judul,
            meta: `${tanggalJam(a.waktu)}${a.oleh ? ` · ${a.oleh}` : ""}`,
            aksen: a.aksen,
          }))}
        />
      )}
    </SectionCard>
  );
}

export function RingkasanPengiriman({ d, bisaCatat }: { d: DetailPesanan; bisaCatat: boolean }) {
  const dalam = d.pengiriman.filter((k) => k.status_pengiriman === "Dalam Kirim").length;
  return (
    <SectionCard title="Ringkasan Pengiriman">
      <div className="flex flex-col gap-0.5">
        <p className="text-muted-foreground text-xs">Lokasi pengiriman</p>
        <p className="text-sm font-medium">{d.po.lokasi_pengiriman}</p>
      </div>
      <div className="flex flex-col gap-2">
        <SumRow label="Pengiriman tercatat" value={d.pengiriman.length} />
        <SumRow label="Dalam kirim" value={dalam} />
        <SumRow label="Selesai" value={d.pengiriman.length - dalam} />
      </div>
      {bisaCatat && (
        <div>
          <Button asChild>
            <Link href={`/dashboard/pengiriman/baru?pesanan=${encodeURIComponent(d.ringkas.id)}`}>
              <Plus aria-hidden="true" />
              Catat Pengiriman
            </Link>
          </Button>
        </div>
      )}
    </SectionCard>
  );
}
