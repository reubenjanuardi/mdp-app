import "server-only";

import { desc, isNull } from "drizzle-orm";

import { hariIni, selisihHari } from "@/lib/format";
import { type PenandaJatuhTempo, PRIORITAS_PENANDA } from "@/lib/status";
import { db } from "@/server/db";
import { tindak_lanjut } from "@/server/db/schema";

import { muatPesanan } from "./pesanan";

export type Prioritas = "Tinggi" | "Sedang" | "Rendah";

const PRIORITAS: Record<PenandaJatuhTempo, Prioritas> = {
  Terlambat: "Tinggi",
  "H-0": "Tinggi",
  "H-1": "Sedang",
  "H-2": "Rendah",
  "H-3": "Rendah",
};

/** Tagihan belum lunas yang perlu follow-up (penanda H-3 sampai Terlambat), urut prioritas (US-08). */
export async function daftarFollowUp() {
  const [semua, riwayat] = await Promise.all([
    muatPesanan(),
    db.query.tindak_lanjut.findMany({
      where: isNull(tindak_lanjut.dihapus_pada),
      orderBy: [desc(tindak_lanjut.waktu)],
    }),
  ]);
  const terakhir = new Map<string, Date>();
  for (const t of riwayat) if (!terakhir.has(t.id_faktur)) terakhir.set(t.id_faktur, t.waktu);

  const hari = hariIni();
  return semua
    .flatMap((p) =>
      p.nota
        .filter((n) => n.ringkasan.status !== "Lunas" && n.penanda)
        .map((n) => {
          const penanda = n.penanda as PenandaJatuhTempo;
          return {
            idNota: n.id,
            nomor: n.nomor,
            idPesanan: p.id,
            pelanggan: p.pelanggan,
            jatuhTempo: p.jatuhTempo as string,
            sisaHari: selisihHari(hari, p.jatuhTempo as string),
            sisa: n.ringkasan.sisa,
            status: n.ringkasan.status,
            penanda,
            prioritas: PRIORITAS[penanda],
            terakhirDihubungi: terakhir.get(n.id) ?? null,
          };
        }),
    )
    .sort((a, b) => PRIORITAS_PENANDA[a.penanda] - PRIORITAS_PENANDA[b.penanda] || a.sisaHari - b.sisaHari);
}

export type ItemFollowUp = Awaited<ReturnType<typeof daftarFollowUp>>[number];

export type Pengingat = {
  id: string;
  jenis: "Terlambat" | "H-0" | "Mendekati" | "Jadwal";
  judul: string;
  waktu: Date;
  baru: boolean;
  href: string;
};

/** Pengingat dalam aplikasi untuk Admin (FR-06). Tidak ada pesan yang dikirim ke pelanggan. */
export async function daftarPengingat(): Promise<Pengingat[]> {
  const [item, jadwal] = await Promise.all([
    daftarFollowUp(),
    db.query.tindak_lanjut.findMany({
      where: isNull(tindak_lanjut.dihapus_pada),
      orderBy: [desc(tindak_lanjut.waktu)],
      with: { faktur: { with: { pesanan: true } } },
    }),
  ]);
  const hari = hariIni();
  // Pengingat harian muncul pukul 07.00 WIB.
  const pagi = new Date(`${hari}T07:00:00+07:00`);
  const awalHari = new Date(`${hari}T00:00:00+07:00`);
  const dihubungiHariIni = new Set(jadwal.filter((t) => t.waktu >= awalHari).map((t) => t.id_faktur));

  const harian: Pengingat[] = item.map((i) => {
    const judul =
      i.penanda === "Terlambat"
        ? `${i.nomor} terlambat ${Math.abs(i.sisaHari)} hari`
        : i.sisaHari === 0
          ? `${i.nomor} jatuh tempo hari ini`
          : i.sisaHari === 1
            ? `${i.nomor} jatuh tempo besok`
            : `${i.nomor} jatuh tempo ${i.sisaHari} hari lagi`;
    return {
      id: `harian-${i.idNota}`,
      jenis: i.penanda === "Terlambat" ? "Terlambat" : i.penanda === "H-0" ? "H-0" : "Mendekati",
      judul,
      waktu: pagi,
      baru: !dihubungiHariIni.has(i.idNota),
      href: `/dashboard/follow-up/${encodeURIComponent(i.idNota)}`,
    };
  });

  // Jadwal hubungi ulang dari catatan tindak lanjut terbaru per nota, selama belum ada catatan sesudahnya.
  const sudah = new Set<string>();
  const terjadwal: Pengingat[] = [];
  for (const t of jadwal) {
    if (sudah.has(t.id_faktur)) continue;
    sudah.add(t.id_faktur);
    if (!t.pengingat_berikutnya || selisihHari(hari, hariIni(t.pengingat_berikutnya)) > 0) continue;
    if (!item.some((i) => i.idNota === t.id_faktur)) continue;
    terjadwal.push({
      id: `jadwal-${t.id_tindak_lanjut}`,
      jenis: "Jadwal",
      judul: `Jadwal hubungi ulang ${t.faktur.pesanan.nama_pelanggan}`,
      waktu: t.pengingat_berikutnya,
      baru: false,
      href: `/dashboard/follow-up/${encodeURIComponent(t.id_faktur)}`,
    });
  }
  return [...harian, ...terjadwal];
}

/** P-09: semua tagihan belum lunas dengan penanda H-3 sampai Terlambat, termasuk yang belum lengkap. */
export async function daftarJatuhTempo() {
  const hari = hariIni();
  const semua = await muatPesanan();
  return semua
    .flatMap((p) =>
      p.nota
        .filter((n) => n.ringkasan.status !== "Lunas")
        .map((n) => ({
          idNota: n.id,
          nomor: n.nomor,
          idPesanan: p.id,
          pelanggan: p.pelanggan,
          jatuhTempo: p.jatuhTempo,
          sisaHari: p.jatuhTempo ? selisihHari(hari, p.jatuhTempo) : null,
          sisa: n.ringkasan.sisa,
          status: n.ringkasan.status,
          penanda: n.penanda,
        })),
    )
    .sort((a, b) => (a.sisaHari ?? 9999) - (b.sisaHari ?? 9999));
}

export type ItemJatuhTempo = Awaited<ReturnType<typeof daftarJatuhTempo>>[number];
