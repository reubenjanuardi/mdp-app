import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { faktur, pengiriman } from "@/server/db/schema";

import { muatPesanan } from "./pesanan";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function geserBulan(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Ringkasan dashboard (FR-09) untuk bulan terpilih (YYYY-MM). Semua angka dihitung dari data tersimpan. */
export async function ringkasanDashboard(bulan: string) {
  const [semua, notaRows, kirimRows] = await Promise.all([
    muatPesanan(),
    db
      .select({ tanggal: faktur.tanggal_faktur, nominal: faktur.nominal_faktur })
      .from(faktur)
      .where(isNull(faktur.dihapus_pada)),
    db
      .select({ status: pengiriman.status_pengiriman })
      .from(pengiriman)
      .where(and(isNull(pengiriman.dihapus_pada), eq(pengiriman.status_pengiriman, "Selesai"))),
  ]);

  const nota = semua.flatMap((p) =>
    p.nota.map((n) => ({ ...n, pelanggan: p.pelanggan, idPesanan: p.id, jatuhTempo: p.jatuhTempo })),
  );
  const lunas = nota.filter((n) => n.ringkasan.status === "Lunas");
  const terlambat = nota.filter((n) => n.ringkasan.status === "Terlambat");
  const belumLunas = nota.filter((n) => n.ringkasan.status !== "Lunas");
  const dalamKirim = semua.filter((p) => p.statusKirim === "Dalam Kirim");

  // Nilai Nota Faktur terbit per bulan, 6 bulan sampai bulan terpilih.
  const enam = Array.from({ length: 6 }, (_, i) => geserBulan(bulan, i - 5));
  const grafik = enam.map((ym) => ({
    ym,
    label: BULAN[Number(ym.slice(5, 7)) - 1],
    nilai: notaRows.filter((r) => r.tanggal?.startsWith(ym)).reduce((s, r) => s + (r.nominal ?? 0), 0),
  }));

  const produksi = (["Dalam Proses", "Selesai", "Tertunda"] as const).map((s) => ({
    status: s,
    jumlah: semua.filter((p) => p.produksi === s).length,
  }));

  return {
    totalPo: semua.length,
    poBaruBulanIni: semua.filter((p) => p.tanggalPo?.startsWith(bulan)).length,
    terbayar: lunas.length,
    terlambat: terlambat.length,
    nilaiTerlambat: terlambat.reduce((s, n) => s + n.ringkasan.sisa, 0),
    belumLunas: belumLunas.reduce((s, n) => s + n.ringkasan.sisa, 0),
    jumlahBelumLunas: belumLunas.length,
    menungguVerifikasi: nota.filter((n) => n.ringkasan.menunggu > 0).length,
    dalamKirim: dalamKirim.length,
    bertahap: dalamKirim.filter((p) => p.pengiriman.length > 1).length,
    kirimSelesai: kirimRows.length,
    grafik,
    produksi,
    jatuhTempo: belumLunas
      .filter((n) => n.penanda)
      .sort((a, b) => (a.jatuhTempo ?? "").localeCompare(b.jatuhTempo ?? ""))
      .slice(0, 4),
    perluDiperbarui: semua
      .filter((p) => p.produksi !== "Selesai")
      .sort((a, b) => (a.produksi === "Tertunda" ? -1 : 0) - (b.produksi === "Tertunda" ? -1 : 0)),
  };
}

export type RingkasanDashboard = Awaited<ReturnType<typeof ringkasanDashboard>>;
