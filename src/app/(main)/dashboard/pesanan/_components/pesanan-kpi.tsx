import {
  Check,
  CircleAlert,
  Clock,
  Loader,
  Package,
  PackageCheck,
  Pause,
  ShoppingCart,
  Truck,
  Wallet,
} from "lucide-react";

import { KpiCard } from "@/components/mdp/kpi-card";
import { rupiahSingkat } from "@/lib/format";
import type { PesananRingkas } from "@/server/data/pesanan";
import type { Peran } from "@/server/db/schema";

export type Kolom = "po" | "pelanggan" | "tanggal" | "total" | "tagihan" | "produksi" | "kirim" | "lokasi" | "barang";
export type Filter = "tagihan" | "produksi" | "kirim";

// Kolom dan filter per peran mengikuti prototype Figma (P-03 per peran) dan hak akses PRD bagian 5.
const KONFIG: Record<Peran, { kolom: Kolom[]; filter: Filter[] }> = {
  Owner: {
    kolom: ["po", "pelanggan", "tanggal", "total", "tagihan", "produksi", "kirim"],
    filter: ["tagihan", "produksi", "kirim"],
  },
  Admin: {
    kolom: ["po", "pelanggan", "tanggal", "total", "tagihan", "produksi", "kirim"],
    filter: ["tagihan", "produksi", "kirim"],
  },
  "Staf Operasional": {
    kolom: ["po", "pelanggan", "tanggal", "total", "tagihan", "produksi"],
    filter: ["tagihan", "produksi"],
  },
  "Staf Pengiriman": { kolom: ["po", "pelanggan", "tanggal", "lokasi", "kirim"], filter: ["kirim"] },
  "Staf Produksi": { kolom: ["po", "pelanggan", "tanggal", "barang", "produksi"], filter: ["produksi"] },
};

export function kolomUntuk(peran: Peran) {
  return KONFIG[peran];
}

export function PesananKpi({ peran, semua }: { peran: Peran; semua: PesananRingkas[] }) {
  const total = semua.length;
  const belumLunas = semua.filter((p) => p.tagihan.status !== "Lunas");
  const sisa = belumLunas.reduce((s, p) => s + p.tagihan.sisa, 0);
  const notaBelumLunas = semua.flatMap((p) => p.nota).filter((n) => n.ringkasan.status !== "Lunas").length;
  const terlambat = semua.filter((p) => p.tagihan.status === "Terlambat").length;
  const dalamKirim = semua.filter((p) => p.statusKirim === "Dalam Kirim");
  const bertahap = dalamKirim.filter((p) => p.pengiriman.length > 1).length;
  const hint = (n: number) => (n === 0 ? "Belum ada data" : undefined);

  const totalPo = (
    <KpiCard key="total" label="Total PO" value={total} hint={hint(total) ?? "PO aktif tercatat"} icon={ShoppingCart} />
  );

  const kartu: Record<Peran, React.ReactNode[]> = {
    Owner: [
      totalPo,
      <KpiCard
        key="bl"
        label="Belum Lunas"
        value={rupiahSingkat(sisa)}
        hint={`${notaBelumLunas} tagihan`}
        icon={Wallet}
      />,
      <KpiCard key="tl" label="Terlambat" value={terlambat} hint="Lewat jatuh tempo" icon={CircleAlert} />,
      <KpiCard
        key="dk"
        label="Dalam Kirim"
        value={dalamKirim.length}
        hint={`${bertahap} pengiriman bertahap`}
        icon={Truck}
      />,
    ],
    Admin: [
      totalPo,
      <KpiCard
        key="bl"
        label="Belum Lunas"
        value={rupiahSingkat(sisa)}
        hint={`${notaBelumLunas} tagihan`}
        icon={Wallet}
      />,
      <KpiCard key="tl" label="Terlambat" value={terlambat} hint="Perlu follow-up" icon={CircleAlert} />,
      <KpiCard
        key="dk"
        label="Dalam Kirim"
        value={dalamKirim.length}
        hint={`${bertahap} pengiriman bertahap`}
        icon={Truck}
      />,
    ],
    "Staf Operasional": [
      totalPo,
      <KpiCard
        key="bl"
        label="Belum Lunas"
        value={rupiahSingkat(sisa)}
        hint={`${notaBelumLunas} tagihan`}
        icon={Wallet}
      />,
      <KpiCard key="tl" label="Terlambat" value={terlambat} hint="Lewat jatuh tempo" icon={CircleAlert} />,
      <KpiCard
        key="mv"
        label="Menunggu Verifikasi"
        value={semua.flatMap((p) => p.nota).filter((n) => n.ringkasan.menunggu > 0).length}
        hint="Pembayaran belum dicek Admin"
        icon={Clock}
      />,
    ],
    "Staf Pengiriman": [
      totalPo,
      <KpiCard
        key="bd"
        label="Belum Dikirim"
        value={semua.filter((p) => p.statusKirim === "Belum Dikirim").length}
        hint="Siap dijadwalkan"
        icon={Package}
      />,
      <KpiCard
        key="dk"
        label="Dalam Kirim"
        value={dalamKirim.length}
        hint={`${bertahap} pengiriman bertahap`}
        icon={Truck}
      />,
      <KpiCard
        key="sl"
        label="Selesai"
        value={semua.filter((p) => p.statusKirim === "Selesai").length}
        hint="Pengiriman diterima"
        icon={PackageCheck}
      />,
    ],
    "Staf Produksi": [
      totalPo,
      <KpiCard
        key="dp"
        label="Dalam Proses"
        value={semua.filter((p) => p.produksi === "Dalam Proses").length}
        hint="Sedang diproduksi"
        icon={Loader}
      />,
      <KpiCard
        key="td"
        label="Tertunda"
        value={semua.filter((p) => p.produksi === "Tertunda").length}
        hint="Perlu tindak lanjut"
        icon={Pause}
      />,
      <KpiCard
        key="sl"
        label="Selesai"
        value={semua.filter((p) => p.produksi === "Selesai").length}
        hint="Produksi selesai"
        icon={Check}
      />,
    ],
  };

  return <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">{kartu[peran]}</div>;
}
