// Nilai status dan peran yang dipakai di server dan browser (tanpa dependensi basis data).
export const PERAN = ["Owner", "Admin", "Staf Operasional", "Staf Pengiriman", "Staf Produksi"] as const;
export type Peran = (typeof PERAN)[number];

export const STATUS_PRODUKSI = ["Dalam Proses", "Selesai", "Tertunda"] as const;
export type StatusProduksi = (typeof STATUS_PRODUKSI)[number];

export const STATUS_VERIFIKASI = ["Menunggu Verifikasi", "Terverifikasi"] as const;
export type StatusVerifikasi = (typeof STATUS_VERIFIKASI)[number];

export const STATUS_PENGIRIMAN = ["Dalam Kirim", "Selesai"] as const;
export type StatusPengiriman = (typeof STATUS_PENGIRIMAN)[number];

export const JENIS_PENGIRIMAN = ["Ekspedisi", "Antar Langsung"] as const;
export type JenisPengiriman = (typeof JENIS_PENGIRIMAN)[number];

// Keputusan tim 18 November 2026 (FR-16).
export const STATUS_KOMUNIKASI = [
  "Dihubungi lewat WhatsApp",
  "Dihubungi lewat telepon",
  "Tidak tersambung",
  "Janji bayar",
  "Sudah bayar (menunggu bukti)",
] as const;
export type StatusKomunikasi = (typeof STATUS_KOMUNIKASI)[number];

export const STATUS_TAGIHAN = ["Belum Bayar", "Sebagian", "Lunas", "Terlambat"] as const;
export type StatusTagihan = (typeof STATUS_TAGIHAN)[number];
