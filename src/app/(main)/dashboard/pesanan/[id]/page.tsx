import Link from "next/link";
import { notFound } from "next/navigation";

import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/mdp/page-header";
import { StatusBadge } from "@/components/mdp/status-badge";
import { Button } from "@/components/ui/button";
import { boleh } from "@/lib/akses";
import { tanggal } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { detailPesanan } from "@/server/data/detail";

import { BarangCard } from "./_components/barang-card";
import { DataCard } from "./_components/data-card";
import { HapusPesanan } from "./_components/hapus-pesanan";
import { KartuAktivitas, KartuProduksi, RingkasanPembayaran, RingkasanPengiriman } from "./_components/kolom-kanan";
import { Rincian, type TabRincian } from "./_components/rincian";
import { TabPembayaran, TabPengiriman, TabProduksi, TabTagihan } from "./_components/tab-isi";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: decodeURIComponent((await params).id) };
}

export default async function Page({ params }: { params: Params }) {
  const pengguna = await wajibAkses("pesanan");
  const id = decodeURIComponent((await params).id);
  const d = await detailPesanan(id);
  if (!d) notFound();

  const peran = pengguna.peran;
  const lihatTagihan = boleh(peran, "tagihan");
  const lihatKirim = boleh(peran, "pengiriman");
  const lihatProduksi = boleh(peran, "produksi");
  const bisaBayar = boleh(peran, "pembayaran", "T");
  const bisaKoreksi = boleh(peran, "pembayaran", "U");
  const bisaTagihan = boleh(peran, "tagihan", "T");
  const bisaKirim = boleh(peran, "pengiriman", "T");
  const base = `/dashboard/pesanan/${encodeURIComponent(id)}`;

  // Detail hanya menampilkan bagian yang boleh diakses peran (US-03, US-14).
  const tabs: TabRincian[] = [];
  if (lihatTagihan)
    tabs.push({
      value: "tagihan",
      label: "Tagihan",
      deskripsi: "Satu pesanan dapat memiliki beberapa Nota Faktur untuk pengiriman bertahap.",
      aksi: bisaTagihan && (
        <Button asChild variant="outline">
          <Link href={`${base}/tagihan/baru`}>
            <Plus aria-hidden="true" />
            Tambah Tagihan
          </Link>
        </Button>
      ),
      isi: <TabTagihan d={d} bisaBayar={bisaBayar} bisaKoreksi={bisaKoreksi} />,
    });
  if (boleh(peran, "pembayaran"))
    tabs.push({
      value: "pembayaran",
      label: "Pembayaran",
      deskripsi: "Pembayaran baru dihitung ke sisa tagihan setelah diverifikasi Admin.",
      aksi: bisaBayar && d.ringkas.nota.length > 0 && (
        <Button asChild variant="outline">
          <Link href={`${base}/pembayaran`}>
            <Plus aria-hidden="true" />
            Catat Pembayaran
          </Link>
        </Button>
      ),
      isi: (
        <TabPembayaran
          d={d}
          bisaVerifikasi={boleh(peran, "pembayaran", "V")}
          bisaHapus={boleh(peran, "pembayaran", "H")}
        />
      ),
    });
  if (lihatKirim)
    tabs.push({
      value: "pengiriman",
      label: "Pengiriman",
      deskripsi: "Pengiriman bertahap untuk pesanan ini.",
      aksi: bisaKirim && (
        <Button asChild variant="outline">
          <Link href={`/dashboard/pengiriman/baru?pesanan=${encodeURIComponent(id)}`}>
            <Plus aria-hidden="true" />
            Catat Pengiriman
          </Link>
        </Button>
      ),
      isi: <TabPengiriman d={d} />,
    });
  if (lihatProduksi)
    tabs.push({
      value: "produksi",
      label: "Produksi",
      deskripsi: "Riwayat status produksi PO ini.",
      aksi: boleh(peran, "produksi", "U") && (
        <Button asChild variant="outline">
          <Link href={`/dashboard/produksi?pilih=${encodeURIComponent(id)}`}>
            <Pencil aria-hidden="true" />
            Ubah Status
          </Link>
        </Button>
      ),
      isi: <TabProduksi d={d} bisaUbah={boleh(peran, "produksi", "U")} />,
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={d.ringkas.id}
        meta={
          <div className="flex flex-wrap items-center gap-3">
            {lihatTagihan && (
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">Tagihan</span>
                <StatusBadge status={d.ringkas.statusTagihan} />
              </span>
            )}
            {lihatProduksi && (
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">Produksi</span>
                <StatusBadge status={d.ringkas.produksi} />
              </span>
            )}
            {lihatKirim && (
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-xs">Pengiriman</span>
                <StatusBadge status={d.ringkas.statusKirim} />
              </span>
            )}
          </div>
        }
        description={`${d.ringkas.pelanggan} · dibuat ${tanggal(d.po.dibuat_pada)}${d.dibuatOleh ? ` oleh ${d.dibuatOleh}` : ""}`}
        actions={
          boleh(peran, "pesanan", "U") && (
            <>
              <Button asChild variant="outline">
                <Link href={`${base}/ubah`}>
                  <Pencil aria-hidden="true" />
                  Ubah
                </Link>
              </Button>
              {boleh(peran, "pesanan", "H") && <HapusPesanan id={id} />}
            </>
          )
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        <div className="flex min-w-0 flex-col gap-4">
          <DataCard d={d} />
          <BarangCard d={d} />
          {tabs.length > 0 && <Rincian tabs={tabs} judul={tabs.length === 1 ? tabs[0].label : "Rincian Pesanan"} />}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          {lihatTagihan && <RingkasanPembayaran d={d} bisaBayar={bisaBayar} bisaKoreksi={bisaKoreksi} />}
          {!lihatTagihan && lihatKirim && <RingkasanPengiriman d={d} bisaCatat={bisaKirim} />}
          {lihatProduksi && <KartuProduksi d={d} />}
          {lihatTagihan && <KartuAktivitas d={d} />}
        </div>
      </div>
    </div>
  );
}
