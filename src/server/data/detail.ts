import "server-only";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { faktur, pembayaran, penerimaan, pengguna, pengiriman, pesanan, riwayat_produksi } from "@/server/db/schema";

import { muatPesanan } from "./pesanan";

export type Aktivitas = { waktu: Date; judul: string; oleh: string | null; aksen?: boolean };

export async function namaPengguna() {
  const rows = await db.select({ id: pengguna.id_pengguna, nama: pengguna.nama, peran: pengguna.peran }).from(pengguna);
  return new Map(rows.map((r) => [r.id, r]));
}

/** "Sari (Staf Operasional)" seperti di desain. */
export function labelOleh(map: Awaited<ReturnType<typeof namaPengguna>>, id: string | null | undefined) {
  if (!id) return null;
  const u = map.get(id);
  return u ? `${u.nama.split(" ")[0]} (${u.peran})` : null;
}

export async function detailPesanan(id: string) {
  const [ringkas] = await muatPesanan({ id });
  if (!ringkas || ringkas.dihapus) return null;

  const [po, idNota, nama, produksi] = await Promise.all([
    db.query.pesanan.findFirst({ where: eq(pesanan.id_pesanan, id) }),
    db
      .select({ id: faktur.id_faktur })
      .from(faktur)
      .where(and(eq(faktur.id_pesanan, id), isNull(faktur.dihapus_pada))),
    namaPengguna(),
    db.query.riwayat_produksi.findMany({
      where: eq(riwayat_produksi.id_pesanan, id),
      orderBy: [desc(riwayat_produksi.dibuat_pada)],
    }),
  ]);
  if (!po) return null;

  const ids = idNota.map((n) => n.id);
  const [bayar, kirim] = await Promise.all([
    ids.length
      ? db.query.pembayaran.findMany({
          where: and(inArray(pembayaran.id_faktur, ids), isNull(pembayaran.dihapus_pada)),
          orderBy: [desc(pembayaran.waktu_pembayaran)],
        })
      : Promise.resolve([]),
    db.query.pengiriman.findMany({
      where: and(eq(pengiriman.id_pesanan, id), isNull(pengiriman.dihapus_pada)),
      orderBy: [asc(pengiriman.dibuat_pada)],
      with: { penerimaan: { orderBy: [desc(penerimaan.dibuat_pada)] } },
    }),
  ]);

  const nomorNota = new Map(ringkas.nota.map((n) => [n.id, n.nomor]));
  const fakturRows = ids.length ? await db.query.faktur.findMany({ where: inArray(faktur.id_faktur, ids) }) : [];

  const aktivitas: Aktivitas[] = [
    { waktu: po.dibuat_pada, judul: `Pesanan ${po.id_pesanan} dibuat`, oleh: labelOleh(nama, po.dibuat_oleh) },
    ...fakturRows.map((f) => ({
      waktu: f.dibuat_pada,
      judul: `Nota ${f.nomor_nota} dibuat`,
      oleh: labelOleh(nama, f.dibuat_oleh),
    })),
    ...fakturRows
      .filter((f) => f.dikoreksi_pada && f.koreksi_status)
      .map((f) => ({
        waktu: f.dikoreksi_pada as Date,
        judul: `Status ${f.nomor_nota} dikoreksi menjadi ${f.koreksi_status}`,
        oleh: labelOleh(nama, f.dikoreksi_oleh),
      })),
    ...bayar.map((b) => ({
      waktu: b.dibuat_pada,
      judul: `Pembayaran Rp${(b.nominal_pembayaran ?? 0).toLocaleString("id-ID")} dicatat`,
      oleh: labelOleh(nama, b.dicatat_oleh),
      aksen: b.status_verifikasi === "Menunggu Verifikasi",
    })),
    ...bayar
      .filter((b) => b.diverifikasi_pada)
      .map((b) => ({
        waktu: b.diverifikasi_pada as Date,
        judul: `Pembayaran Rp${(b.nominal_pembayaran ?? 0).toLocaleString("id-ID")} diverifikasi`,
        oleh: labelOleh(nama, b.diverifikasi_oleh),
      })),
    ...kirim.map((k, i) => ({
      waktu: k.dibuat_pada,
      judul: `Pengiriman ke-${i + 1} dicatat: Dalam Kirim`,
      oleh: labelOleh(nama, k.dicatat_oleh),
    })),
    ...kirim.flatMap((k, i) =>
      k.penerimaan.map((t) => ({
        waktu: t.dibuat_pada,
        judul: `Pengiriman ke-${i + 1} selesai diterima`,
        oleh: labelOleh(nama, t.dicatat_oleh),
      })),
    ),
    ...produksi.map((r) => ({
      waktu: r.dibuat_pada,
      judul: `Status produksi: ${r.status}`,
      oleh: labelOleh(nama, r.diubah_oleh),
    })),
  ].sort((a, b) => b.waktu.getTime() - a.waktu.getTime());

  return {
    ringkas,
    po,
    dibuatOleh: po.dibuat_oleh ? (nama.get(po.dibuat_oleh)?.nama ?? null) : null,
    pembayaran: bayar.map((b) => ({
      ...b,
      nomorNota: nomorNota.get(b.id_faktur) ?? "-",
      pencatat: b.dicatat_oleh ? (nama.get(b.dicatat_oleh)?.nama.split(" ")[0] ?? null) : null,
      verifikator: b.diverifikasi_oleh ? (nama.get(b.diverifikasi_oleh)?.nama.split(" ")[0] ?? null) : null,
    })),
    // Urutan ke- dihitung dari yang paling awal; tampilan menampilkan yang terbaru di atas.
    pengiriman: kirim.map((k, i) => ({ ...k, ke: i + 1 })).reverse(),
    produksi: produksi.map((r) => ({ ...r, oleh: labelOleh(nama, r.diubah_oleh) })),
    aktivitas,
  };
}

export type DetailPesanan = NonNullable<Awaited<ReturnType<typeof detailPesanan>>>;
