import "server-only";

import { asc, desc, eq, isNull } from "drizzle-orm";

import { hariIni } from "@/lib/format";
import {
  hitungTagihan,
  type PenandaJatuhTempo,
  penandaJatuhTempo,
  type RingkasanTagihan,
  type StatusPengirimanPesanan,
  statusPengirimanPesanan,
} from "@/lib/status";
import { db } from "@/server/db";
import { faktur, pembayaran, pengiriman, pesanan } from "@/server/db/schema";

export type StatusTagihanTampil = RingkasanTagihan["status"] | "Lebih Bayar";

export type NotaRingkas = {
  id: string;
  nomor: string;
  tanggal: string | null;
  total: number;
  ringkasan: RingkasanTagihan;
  penanda: PenandaJatuhTempo | null;
  koreksiAlasan: string | null;
};

export type PesananRingkas = Awaited<ReturnType<typeof muatPesanan>>[number];

/** Label status tagihan untuk daftar: Lunas dengan kelebihan ditampilkan "Lebih Bayar" (PRD 9.3). */
export function labelTagihan(r: RingkasanTagihan): StatusTagihanTampil {
  return r.status === "Lunas" && r.lebihBayar > 0 && !r.dikoreksi ? "Lebih Bayar" : r.status;
}

/**
 * Semua pesanan aktif beserta tagihan, pembayaran, dan pengirimannya, dengan status dihitung.
 * shortcut: memuat semua PO ke memori lalu memfilter di JS; cukup untuk ratusan PO, pindah ke query SQL
 * berhalaman bila data melewati beberapa ribu PO (NFR-04).
 */
export async function muatPesanan(opsi: { id?: string } = {}) {
  const hari = hariIni();
  const baris = await db.query.pesanan.findMany({
    where: opsi.id ? eq(pesanan.id_pesanan, opsi.id) : isNull(pesanan.dihapus_pada),
    orderBy: [desc(pesanan.tanggal_po), desc(pesanan.id_pesanan)],
    with: {
      barang: { orderBy: (b) => [asc(b.urutan)] },
      faktur: {
        where: isNull(faktur.dihapus_pada),
        orderBy: [asc(faktur.tanggal_faktur), asc(faktur.dibuat_pada)],
        with: { pembayaran: { where: isNull(pembayaran.dihapus_pada) } },
      },
      pengiriman: {
        where: isNull(pengiriman.dihapus_pada),
        orderBy: [asc(pengiriman.tanggal_pengiriman), asc(pengiriman.dibuat_pada)],
      },
      riwayatProduksi: { orderBy: (r) => [desc(r.dibuat_pada)], limit: 1, columns: { dibuat_pada: true } },
    },
  });

  return baris.map((p) => {
    const nota: NotaRingkas[] = p.faktur.map((f) => {
      const ringkasan = hitungTagihan({
        total: f.nominal_faktur ?? 0,
        pembayaran: f.pembayaran.map((b) => ({ nominal: b.nominal_pembayaran ?? 0, status: b.status_verifikasi })),
        jatuhTempo: p.tanggal_jatuh_tempo,
        hariIni: hari,
        koreksi: f.koreksi_status,
      });
      return {
        id: f.id_faktur,
        nomor: f.nomor_nota,
        tanggal: f.tanggal_faktur,
        total: f.nominal_faktur ?? 0,
        ringkasan,
        penanda:
          ringkasan.status !== "Lunas" && p.tanggal_jatuh_tempo ? penandaJatuhTempo(p.tanggal_jatuh_tempo, hari) : null,
        koreksiAlasan: f.alasan_koreksi,
      };
    });

    const semuaBayar = p.faktur.flatMap((f) =>
      f.pembayaran.map((b) => ({ nominal: b.nominal_pembayaran ?? 0, status: b.status_verifikasi })),
    );
    let tagihan = hitungTagihan({
      total: p.total,
      pembayaran: semuaBayar,
      jatuhTempo: p.tanggal_jatuh_tempo,
      hariIni: hari,
    });
    const totalNota = nota.reduce((s, n) => s + n.total, 0);
    if (nota.length > 0 && totalNota >= p.total && nota.every((n) => n.ringkasan.status === "Lunas")) {
      tagihan = { ...tagihan, status: "Lunas" };
    }

    const statusKirim: StatusPengirimanPesanan = statusPengirimanPesanan(p.pengiriman.map((k) => k.status_pengiriman));

    return {
      id: p.id_pesanan,
      nomorSp: p.nomor_surat_pemesanan,
      idPelanggan: p.id_pelanggan,
      pelanggan: p.nama_pelanggan,
      tanggalPo: p.tanggal_po,
      jatuhTempo: p.tanggal_jatuh_tempo,
      lokasi: p.lokasi_pengiriman,
      total: p.total,
      termasukPpn: p.termasuk_ppn,
      produksi: p.status_produksi,
      alasanTertunda: p.alasan_tertunda,
      diperbaruiPada: p.diperbarui_pada,
      produksiDiperbarui: p.riwayatProduksi[0]?.dibuat_pada ?? null,
      barang: p.barang,
      nota,
      tagihan,
      statusTagihan: labelTagihan(tagihan),
      penanda:
        tagihan.status !== "Lunas" && p.tanggal_jatuh_tempo ? penandaJatuhTempo(p.tanggal_jatuh_tempo, hari) : null,
      pengiriman: p.pengiriman,
      statusKirim,
      dihapus: Boolean(p.dihapus_pada),
    };
  });
}

/** Pencarian US-14: no. PO, no. surat pemesanan, pelanggan, no. nota, no. resi atau TTB. */
export function cocok(p: PesananRingkas, q: string) {
  const kata = q.trim().toLowerCase();
  if (!kata) return true;
  const teks = [
    p.id,
    p.nomorSp,
    p.pelanggan,
    ...p.nota.map((n) => n.nomor),
    ...p.pengiriman.flatMap((k) => [k.nomor_resi ?? "", k.nomor_tanda_terima ?? ""]),
  ]
    .join(" ")
    .toLowerCase();
  return teks.includes(kata);
}
