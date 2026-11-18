// Matriks hak akses PRD bagian 5 dan menu per peran PRD 7.1.
// L = lihat, T = tambah, U = ubah, H = hapus (soft delete), V = verifikasi pembayaran.
import type { Peran } from "@/server/db/schema";

export type Modul =
  | "dataMaster"
  | "pesanan"
  | "tagihan"
  | "pembayaran"
  | "jatuhTempo"
  | "followUp"
  | "pengiriman"
  | "produksi"
  | "dashboard"
  | "pengguna";

export type Aksi = "L" | "T" | "U" | "H" | "V";

export const MATRIKS: Record<Modul, Partial<Record<Peran, readonly Aksi[]>>> = {
  dataMaster: {
    Owner: ["L"],
    Admin: ["L", "T", "U", "H"],
    "Staf Operasional": ["L"],
    "Staf Pengiriman": ["L"],
    "Staf Produksi": ["L"],
  },
  pesanan: {
    Owner: ["L"],
    Admin: ["L", "T", "U", "H"],
    "Staf Operasional": ["L"],
    "Staf Pengiriman": ["L"],
    "Staf Produksi": ["L"],
  },
  tagihan: { Owner: ["L"], Admin: ["L", "T", "U", "H"], "Staf Operasional": ["L", "T", "U", "H"] },
  pembayaran: { Owner: ["L"], Admin: ["L", "T", "U", "H", "V"], "Staf Operasional": ["L", "T", "U", "H"] },
  jatuhTempo: { Owner: ["L"], Admin: ["L"], "Staf Operasional": ["L"] },
  followUp: { Admin: ["L", "T", "U", "H"] },
  pengiriman: { Owner: ["L"], Admin: ["L", "T", "U", "H"], "Staf Pengiriman": ["L", "T", "U", "H"] },
  produksi: { Owner: ["L"], Admin: ["L"], "Staf Operasional": ["L"], "Staf Produksi": ["L", "U"] },
  dashboard: { Owner: ["L"], Admin: ["L"], "Staf Operasional": ["L"], "Staf Produksi": ["L"] },
  pengguna: { Admin: ["L", "T", "U"] },
};

export function boleh(peran: Peran, modul: Modul, aksi: Aksi = "L") {
  return MATRIKS[modul][peran]?.includes(aksi) ?? false;
}

/** Halaman awal setelah login (US-15: diarahkan ke halaman sesuai peran). */
export function halamanAwal(peran: Peran) {
  if (peran === "Staf Pengiriman") return "/dashboard/pesanan";
  return "/dashboard";
}

export const LABEL_MODUL: Record<Modul, string> = {
  dataMaster: "Data master",
  pesanan: "Pesanan",
  tagihan: "Tagihan",
  pembayaran: "Pembayaran dan status",
  jatuhTempo: "Jatuh tempo",
  followUp: "Follow-up",
  pengiriman: "Pengiriman",
  produksi: "Status produksi",
  dashboard: "Dashboard",
  pengguna: "Akun dan peran",
};
