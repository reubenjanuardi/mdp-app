import Link from "next/link";
import { redirect } from "next/navigation";

import { cn } from "cn";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  Loader,
  Package,
  Pause,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { KpiCard } from "@/components/mdp/kpi-card";
import { PageHeader } from "@/components/mdp/page-header";
import { SectionCard } from "@/components/mdp/section-card";
import { StatusBadge } from "@/components/mdp/status-badge";
import { Button } from "@/components/ui/button";
import { boleh, halamanAwal } from "@/lib/akses";
import { angka, bulanTahun, hariIni, rupiahSingkat, tanggal } from "@/lib/format";
import { wajibLogin } from "@/server/auth/sesi";
import { type RingkasanDashboard, ringkasanDashboard } from "@/server/data/dashboard";

import { GrafikTagihan } from "./_components/grafik-tagihan";
import { PilihBulan } from "./_components/pilih-bulan";

export const metadata: Metadata = { title: "Dashboard" };

function opsiBulan(akhir: string) {
  const [y, m] = akhir.split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const v = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { value: v, label: bulanTahun(`${v}-01`) };
  });
}

export default async function Page({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const p = await wajibLogin();
  if (!boleh(p.peran, "dashboard")) redirect(halamanAwal(p.peran));
  const ini = hariIni().slice(0, 7);
  const { bulan: b } = await searchParams;
  const bulan = b && /^\d{4}-\d{2}$/.test(b) && b <= ini ? b : ini;
  const r = await ringkasanDashboard(bulan);
  const namaBulan = bulanTahun(`${bulan}-01`);
  const produksiSaja = p.peran === "Staf Produksi";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`${produksiSaja ? "Ringkasan produksi" : "Ringkasan operasional"} ${namaBulan}.`}
        actions={!produksiSaja && <PilihBulan value={bulan} options={opsiBulan(ini)} />}
      />
      {produksiSaja ? (
        <DashboardProduksi r={r} />
      ) : (
        <DashboardOperasional r={r} peran={p.peran} namaBulan={namaBulan} />
      )}
    </div>
  );
}

function DashboardOperasional({ r, peran, namaBulan }: { r: RingkasanDashboard; peran: string; namaBulan: string }) {
  const ops = peran === "Staf Operasional";
  const kartu = [
    <KpiCard
      key="po"
      label="Total PO"
      value={r.totalPo}
      hint={`${r.poBaruBulanIni} PO baru di ${namaBulan}`}
      icon={ShoppingCart}
    />,
    <KpiCard key="tb" label="Terbayar" value={r.terbayar} hint="Tagihan berstatus Lunas" icon={CircleCheck} />,
    ops && (
      <KpiCard
        key="bl"
        label="Belum Lunas"
        value={rupiahSingkat(r.belumLunas)}
        hint={`${r.jumlahBelumLunas} tagihan`}
        icon={Wallet}
      />
    ),
    <KpiCard
      key="tl"
      label="Terlambat"
      value={r.terlambat}
      hint={`${rupiahSingkat(r.nilaiTerlambat)} belum dibayar`}
      icon={CircleAlert}
    />,
    !ops && (
      <KpiCard
        key="dk"
        label="Dalam Kirim"
        value={r.dalamKirim}
        hint={`Termasuk ${r.bertahap} pengiriman bertahap`}
        icon={Truck}
      />
    ),
    !ops && <KpiCard key="sl" label="Selesai" value={r.kirimSelesai} hint="Pengiriman diterima" icon={Package} />,
    ops && (
      <KpiCard
        key="mv"
        label="Menunggu Verifikasi"
        value={r.menungguVerifikasi}
        hint="Pembayaran belum dicek Admin"
        icon={Clock}
      />
    ),
  ].filter(Boolean);

  const awal = r.grafik[0]?.label;
  const akhir = r.grafik.at(-1)?.label;
  const adaTagihan = r.grafik.some((g) => g.nilai > 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{kartu}</div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        <SectionCard
          title="Nilai Tagihan Terbit per Bulan"
          description={`Total Nota Faktur yang terbit, dalam juta rupiah, ${awal}–${akhir} ${namaBulan.split(" ")[1]}.`}
        >
          {adaTagihan ? (
            <GrafikTagihan data={r.grafik} />
          ) : (
            <EmptyState
              icon={Wallet}
              title="Belum ada Nota Faktur di periode ini"
              description="Grafik terisi setelah tagihan dicatat. Pilih bulan lain untuk melihat periode sebelumnya."
            />
          )}
        </SectionCard>
        <div className="flex min-w-0 flex-col gap-4">
          {ops ? (
            <>
              <JatuhTempoTerdekat r={r} />
              <KartuProduksi r={r} />
            </>
          ) : (
            <>
              <KartuProduksi r={r} />
              <JatuhTempoTerdekat r={r} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

const IKON_PRODUKSI = { "Dalam Proses": Loader, Selesai: Check, Tertunda: Pause } as const;
const BAR_PRODUKSI = {
  "Dalam Proses": "bg-status-info-foreground",
  Selesai: "bg-status-success-foreground",
  Tertunda: "bg-status-danger-foreground",
} as const;

function KartuProduksi({ r }: { r: RingkasanDashboard }) {
  return (
    <SectionCard title="Status Produksi" description={`Dari ${r.totalPo} PO aktif`}>
      <ul className="flex flex-col gap-4">
        {r.produksi.map((x) => {
          const Icon = IKON_PRODUKSI[x.status];
          const persen = r.totalPo ? Math.round((x.jumlah / r.totalPo) * 100) : 0;
          return (
            <li key={x.status} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={x.status}>
                  <Icon className="size-3" aria-hidden="true" />
                  {x.status}
                </StatusBadge>
                <span className="flex-1" />
                <span className="text-sm font-medium tabular-nums">{x.jumlah} PO</span>
              </div>
              <div
                className="bg-muted h-1.5 overflow-hidden rounded-full"
                role="img"
                aria-label={`${x.status}: ${x.jumlah} dari ${r.totalPo} PO (${persen}%)`}
              >
                <div className={cn("h-full rounded-full", BAR_PRODUKSI[x.status])} style={{ width: `${persen}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

function JatuhTempoTerdekat({ r }: { r: RingkasanDashboard }) {
  return (
    <SectionCard
      title="Jatuh Tempo Terdekat"
      actions={
        <Link href="/dashboard/jatuh-tempo" className="text-primary text-sm font-medium hover:underline">
          Lihat semua
        </Link>
      }
    >
      {r.jatuhTempo.length === 0 ? (
        <p className="text-muted-foreground text-sm">Tidak ada tagihan yang mendekati atau melewati jatuh tempo.</p>
      ) : (
        <ul className="divide-y">
          {r.jatuhTempo.map((n) => (
            <li key={n.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Link
                href={`/dashboard/pesanan/${encodeURIComponent(n.idPesanan)}?tab=tagihan`}
                className="min-w-0 flex-1 hover:underline"
              >
                <Stack
                  utama={<span className="text-primary font-mono text-xs">{n.nomor}</span>}
                  ket={`${n.pelanggan} · ${rupiahSingkat(n.ringkasan.sisa)}`}
                />
              </Link>
              {n.penanda && <StatusBadge status={n.penanda} />}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function DashboardProduksi({ r }: { r: RingkasanDashboard }) {
  const hitung = (s: string) => r.produksi.find((x) => x.status === s)?.jumlah ?? 0;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="PO Aktif" value={r.totalPo} hint="Semua PO tercatat" icon={ShoppingCart} />
        <KpiCard label="Dalam Proses" value={hitung("Dalam Proses")} hint="Sedang diproduksi" icon={Loader} />
        <KpiCard label="Tertunda" value={hitung("Tertunda")} hint="Perlu tindak lanjut" icon={Pause} />
        <KpiCard label="Selesai" value={hitung("Selesai")} hint="Produksi selesai" icon={Check} />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        <SectionCard
          title="PO Perlu Diperbarui"
          description="PO yang belum selesai diproduksi."
          actions={
            <Button asChild variant="outline">
              <Link href="/dashboard/produksi">
                <ArrowRight aria-hidden="true" />
                Buka Status Produksi
              </Link>
            </Button>
          }
        >
          {r.perluDiperbarui.length === 0 ? (
            <EmptyState
              icon={CircleCheck}
              title="Semua PO selesai diproduksi"
              description="PO baru akan muncul di sini."
            />
          ) : (
            <TableWrap label="PO yang belum selesai">
              <thead>
                <tr>
                  <Th>Pesanan</Th>
                  <Th width={180}>Barang</Th>
                  <Th width={136}>Status</Th>
                  <Th width={120}>Diperbarui</Th>
                </tr>
              </thead>
              <tbody>
                {r.perluDiperbarui.map((p) => {
                  const b = p.barang[0];
                  return (
                    <tr key={p.id}>
                      <Td className="h-14">
                        <Link
                          href={`/dashboard/produksi?pilih=${encodeURIComponent(p.id)}`}
                          className="hover:underline"
                        >
                          <Stack
                            utama={<span className="font-medium">{p.id}</span>}
                            ket={p.pelanggan}
                            className="min-w-36"
                          />
                        </Link>
                      </Td>
                      <Td>
                        {b && (
                          <Stack
                            utama={<span className="font-medium">{b.nama_barang}</span>}
                            ket={`${angka(b.jumlah)} ${b.satuan}`}
                          />
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={p.produksi} />
                      </Td>
                      <Td className="text-muted-foreground text-xs whitespace-nowrap">
                        {tanggal(p.produksiDiperbarui ?? p.diperbaruiPada)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </SectionCard>
        <KartuProduksi r={r} />
      </div>
    </>
  );
}
