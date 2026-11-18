// Aturan status dari PRD 4.2 dan 9.3, ditambah keputusan tim 18 November 2026:
// tagihan Belum Bayar atau Sebagian yang melewati jatuh tempo menjadi Terlambat,
// dan sisa 2 hari memakai penanda kuning yang sama dengan H-3 dan H-1.
import { selisihHari } from "./format";

export type StatusTagihan = "Belum Bayar" | "Sebagian" | "Lunas" | "Terlambat";
export type PenandaJatuhTempo = "H-3" | "H-2" | "H-1" | "H-0" | "Terlambat";

export type RingkasanTagihan = {
  total: number;
  terverifikasi: number;
  menunggu: number;
  sisa: number;
  lebihBayar: number;
  status: StatusTagihan;
  dikoreksi: boolean;
};

type Pembayaran = { nominal: number; status: "Menunggu Verifikasi" | "Terverifikasi" };

export function hitungTagihan(input: {
  total: number;
  pembayaran: readonly Pembayaran[];
  jatuhTempo: string | null;
  hariIni: string;
  koreksi?: StatusTagihan | null;
}): RingkasanTagihan {
  const terverifikasi = input.pembayaran.filter((p) => p.status === "Terverifikasi").reduce((s, p) => s + p.nominal, 0);
  const menunggu = input.pembayaran
    .filter((p) => p.status === "Menunggu Verifikasi")
    .reduce((s, p) => s + p.nominal, 0);
  const sisa = Math.max(0, input.total - terverifikasi);
  const lebihBayar = Math.max(0, terverifikasi - input.total);

  let status: StatusTagihan;
  if (sisa === 0 && input.total > 0) status = "Lunas";
  else if (terverifikasi > 0) status = "Sebagian";
  else status = "Belum Bayar";

  if (status !== "Lunas" && input.jatuhTempo && selisihHari(input.hariIni, input.jatuhTempo) < 0) {
    status = "Terlambat";
  }

  if (input.koreksi) {
    return { total: input.total, terverifikasi, menunggu, sisa, lebihBayar, status: input.koreksi, dikoreksi: true };
  }
  return { total: input.total, terverifikasi, menunggu, sisa, lebihBayar, status, dikoreksi: false };
}

/** Penanda hanya untuk tagihan yang belum lunas. null berarti belum perlu ditandai (lebih dari 3 hari). */
export function penandaJatuhTempo(jatuhTempo: string, hariIni: string): PenandaJatuhTempo | null {
  const sisaHari = selisihHari(hariIni, jatuhTempo);
  if (sisaHari < 0) return "Terlambat";
  if (sisaHari === 0) return "H-0";
  if (sisaHari === 1) return "H-1";
  if (sisaHari === 2) return "H-2";
  if (sisaHari === 3) return "H-3";
  return null;
}

/** Urutan prioritas follow-up: Terlambat paling atas. */
export const PRIORITAS_PENANDA: Record<PenandaJatuhTempo, number> = {
  Terlambat: 0,
  "H-0": 1,
  "H-1": 2,
  "H-2": 3,
  "H-3": 4,
};

export type StatusPengirimanPesanan = "Belum Dikirim" | "Dalam Kirim" | "Selesai";

export function statusPengirimanPesanan(status: readonly ("Dalam Kirim" | "Selesai")[]): StatusPengirimanPesanan {
  if (status.length === 0) return "Belum Dikirim";
  return status.some((s) => s === "Dalam Kirim") ? "Dalam Kirim" : "Selesai";
}

export const PPN_PERSEN = 11;

export function hitungTotalPesanan(baris: readonly { jumlah: number; hargaSatuan: number }[], termasukPpn: boolean) {
  const subtotal = baris.reduce((s, b) => s + Math.round(b.jumlah * b.hargaSatuan), 0);
  const ppn = termasukPpn ? Math.round((subtotal * PPN_PERSEN) / 100) : 0;
  return { subtotal, ppn, total: subtotal + ppn };
}
