// Skema mengikuti "ERD Sistem Pengelolaan Transaksi.sql": nama tabel dan kolom ERD dipertahankan,
// lalu diperluas dengan kolom dan tabel yang dibutuhkan PRD. Perluasan tidak mengubah tipe kolom ERD.
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const uang = (name: string) => numeric(name, { precision: 18, scale: 2, mode: "number" });
const kuantitas = (name: string) => numeric(name, { precision: 18, scale: 2, mode: "number" });
const waktu = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

const jejak = {
  dibuat_pada: waktu("dibuat_pada").notNull().defaultNow(),
  diperbarui_pada: waktu("diperbarui_pada")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export * from "@/lib/konstanta";

import type {
  JenisPengiriman,
  Peran,
  StatusKomunikasi,
  StatusPengiriman,
  StatusProduksi,
  StatusTagihan,
  StatusVerifikasi,
} from "@/lib/konstanta";

// ---------- ERD: pelanggan ----------
export const pelanggan = pgTable("pelanggan", {
  id_pelanggan: varchar("id_pelanggan").primaryKey(),
  kode_pelanggan: varchar("kode_pelanggan").unique(),
  nama_perusahaan: varchar("nama_perusahaan").notNull().unique(),
  alamat: text("alamat").notNull(),
  telepon: varchar("telepon"),
  kontak: varchar("kontak"),
  dihapus_pada: waktu("dihapus_pada"),
  ...jejak,
});

export const lokasi_pengiriman = pgTable("lokasi_pengiriman", {
  id_lokasi: varchar("id_lokasi").primaryKey(),
  id_pelanggan: varchar("id_pelanggan")
    .notNull()
    .references(() => pelanggan.id_pelanggan),
  nama_lokasi: varchar("nama_lokasi").notNull(),
  alamat: text("alamat").notNull(),
  dihapus_pada: waktu("dihapus_pada"),
  ...jejak,
});

export const barang = pgTable("barang", {
  id_barang: varchar("id_barang").primaryKey(),
  kode_barang: varchar("kode_barang").notNull().unique(),
  nama: varchar("nama").notNull(),
  spesifikasi: text("spesifikasi"),
  satuan: varchar("satuan").notNull(),
  harga_acuan: uang("harga_acuan").notNull(),
  dihapus_pada: waktu("dihapus_pada"),
  ...jejak,
});

// ---------- ERD: pengguna ----------
export const pengguna = pgTable("pengguna", {
  id_pengguna: varchar("id_pengguna").primaryKey(),
  username: varchar("username").unique(),
  password_hash: varchar("password_hash"),
  peran: varchar("peran").$type<Peran>(),
  nama: varchar("nama").notNull(),
  email: varchar("email").unique(),
  aktif: boolean("aktif").notNull().default(true),
  // Akun baru dan akun yang password-nya direset wajib mengganti password sementara saat login.
  wajib_ganti_password: boolean("wajib_ganti_password").notNull().default(false),
  ...jejak,
});

// Refresh token disimpan sebagai sesi agar logout dan penonaktifan akun mencabut akses.
export const sesi = pgTable("sesi", {
  id_sesi: varchar("id_sesi").primaryKey(),
  id_pengguna: varchar("id_pengguna")
    .notNull()
    .references(() => pengguna.id_pengguna),
  kedaluwarsa_pada: waktu("kedaluwarsa_pada").notNull(),
  dicabut_pada: waktu("dicabut_pada"),
  dibuat_pada: waktu("dibuat_pada").notNull().defaultNow(),
});

// ---------- ERD: pesanan ----------
export const pesanan = pgTable("pesanan", {
  id_pesanan: varchar("id_pesanan").primaryKey(),
  id_pelanggan: varchar("id_pelanggan")
    .notNull()
    .references(() => pelanggan.id_pelanggan),
  tanggal_po: date("tanggal_po"),
  jenis_barang: varchar("jenis_barang"),
  jumlah_pesanan: integer("jumlah_pesanan"),
  nomor_surat_pemesanan: varchar("nomor_surat_pemesanan").notNull(),
  rujukan_penawaran: varchar("rujukan_penawaran"),
  id_lokasi: varchar("id_lokasi").references(() => lokasi_pengiriman.id_lokasi),
  // Salinan saat PO dibuat, agar PO lama tidak berubah ketika data master diubah atau dihapus.
  nama_pelanggan: varchar("nama_pelanggan").notNull(),
  alamat_pelanggan: text("alamat_pelanggan"),
  lokasi_pengiriman: text("lokasi_pengiriman").notNull(),
  ketentuan_pembayaran: varchar("ketentuan_pembayaran"),
  // Wajib di form PO; boleh kosong hanya untuk data lama, yang ditandai "Belum lengkap" (US-07).
  tanggal_jatuh_tempo: date("tanggal_jatuh_tempo"),
  termasuk_ppn: boolean("termasuk_ppn").notNull().default(false),
  subtotal: uang("subtotal").notNull(),
  ppn: uang("ppn").notNull().default(0),
  total: uang("total").notNull(),
  status_produksi: varchar("status_produksi").$type<StatusProduksi>().notNull().default("Dalam Proses"),
  alasan_tertunda: text("alasan_tertunda"),
  dibuat_oleh: varchar("dibuat_oleh").references(() => pengguna.id_pengguna),
  dihapus_pada: waktu("dihapus_pada"),
  ...jejak,
});

export const pesanan_barang = pgTable("pesanan_barang", {
  id_pesanan_barang: varchar("id_pesanan_barang").primaryKey(),
  id_pesanan: varchar("id_pesanan")
    .notNull()
    .references(() => pesanan.id_pesanan),
  id_barang: varchar("id_barang").references(() => barang.id_barang),
  urutan: integer("urutan").notNull(),
  kode_barang: varchar("kode_barang").notNull(),
  nama_barang: varchar("nama_barang").notNull(),
  spesifikasi: text("spesifikasi"),
  satuan: varchar("satuan").notNull(),
  jumlah: kuantitas("jumlah").notNull(),
  harga_satuan: uang("harga_satuan").notNull(),
  subtotal: uang("subtotal").notNull(),
});

export const riwayat_produksi = pgTable("riwayat_produksi", {
  id_riwayat: varchar("id_riwayat").primaryKey(),
  id_pesanan: varchar("id_pesanan")
    .notNull()
    .references(() => pesanan.id_pesanan),
  status: varchar("status").$type<StatusProduksi>().notNull(),
  // Wajib diisi sebagai alasan bila status Tertunda.
  catatan: text("catatan"),
  diubah_oleh: varchar("diubah_oleh").references(() => pengguna.id_pengguna),
  dibuat_pada: waktu("dibuat_pada").notNull().defaultNow(),
});

// Realisasi harian mengikuti kolom laporan Cupseal/Rubber Seal: tanggal, mesin, operator, kode produk, jumlah.
export const produksi_harian = pgTable("produksi_harian", {
  id_produksi_harian: varchar("id_produksi_harian").primaryKey(),
  tanggal: date("tanggal").notNull(),
  mesin: varchar("mesin").notNull(),
  nomor_operator: integer("nomor_operator"),
  operator: varchar("operator").notNull(),
  kode_produk: varchar("kode_produk").notNull(),
  jumlah_hasil: kuantitas("jumlah_hasil").notNull(),
  catatan: text("catatan"),
  dicatat_oleh: varchar("dicatat_oleh").references(() => pengguna.id_pengguna),
  ...jejak,
});

// ---------- ERD: faktur (Nota Faktur) ----------
// UNIQUE pada id_pesanan di ERD dihapus: satu pesanan boleh memiliki beberapa nota (PRD 8.3 no. 2).
export const faktur = pgTable(
  "faktur",
  {
    id_faktur: varchar("id_faktur").primaryKey(),
    id_pesanan: varchar("id_pesanan")
      .notNull()
      .references(() => pesanan.id_pesanan),
    tanggal_faktur: date("tanggal_faktur"),
    nominal_faktur: decimal("nominal_faktur", { mode: "number" }),
    nomor_nota: varchar("nomor_nota").notNull(),
    lampiran: varchar("lampiran"),
    nama_file_lampiran: varchar("nama_file_lampiran"),
    koreksi_status: varchar("koreksi_status").$type<StatusTagihan>(),
    alasan_koreksi: text("alasan_koreksi"),
    dikoreksi_oleh: varchar("dikoreksi_oleh").references(() => pengguna.id_pengguna),
    dikoreksi_pada: waktu("dikoreksi_pada"),
    dibuat_oleh: varchar("dibuat_oleh").references(() => pengguna.id_pengguna),
    dihapus_pada: waktu("dihapus_pada"),
    ...jejak,
  },
  (t) => [uniqueIndex("faktur_nomor_nota_unik").on(t.nomor_nota)],
);

export const faktur_barang = pgTable("faktur_barang", {
  id_faktur_barang: varchar("id_faktur_barang").primaryKey(),
  id_faktur: varchar("id_faktur")
    .notNull()
    .references(() => faktur.id_faktur),
  id_pesanan_barang: varchar("id_pesanan_barang").references(() => pesanan_barang.id_pesanan_barang),
  urutan: integer("urutan").notNull(),
  nama_barang: varchar("nama_barang").notNull(),
  satuan: varchar("satuan").notNull(),
  banyaknya: kuantitas("banyaknya").notNull(),
  harga_satuan: uang("harga_satuan").notNull(),
  jumlah: uang("jumlah").notNull(),
});

// ---------- ERD: pembayaran ----------
export const pembayaran = pgTable("pembayaran", {
  id_pembayaran: varchar("id_pembayaran").primaryKey(),
  id_faktur: varchar("id_faktur")
    .notNull()
    .references(() => faktur.id_faktur),
  tanggal_pembayaran: date("tanggal_pembayaran"),
  nominal_pembayaran: decimal("nominal_pembayaran", { mode: "number" }),
  bukti_pembayaran: varchar("bukti_pembayaran"),
  waktu_pembayaran: waktu("waktu_pembayaran").notNull(),
  metode: varchar("metode").notNull(),
  nomor_referensi: varchar("nomor_referensi"),
  berita_transaksi: text("berita_transaksi"),
  nama_penyetor: varchar("nama_penyetor").notNull(),
  nama_file_bukti: varchar("nama_file_bukti"),
  status_verifikasi: varchar("status_verifikasi").$type<StatusVerifikasi>().notNull().default("Menunggu Verifikasi"),
  diverifikasi_oleh: varchar("diverifikasi_oleh").references(() => pengguna.id_pengguna),
  diverifikasi_pada: waktu("diverifikasi_pada"),
  dicatat_oleh: varchar("dicatat_oleh").references(() => pengguna.id_pengguna),
  // Pembayaran yang ditolak Admin saat verifikasi disembunyikan (soft delete) dengan alasannya.
  alasan_tolak: text("alasan_tolak"),
  ditolak_oleh: varchar("ditolak_oleh").references(() => pengguna.id_pengguna),
  dihapus_pada: waktu("dihapus_pada"),
  ...jejak,
});

// ---------- ERD: pengiriman ----------
// Rekap historis dari spreadsheet perusahaan. Tidak dipaksa ke PO/resi karena kolom tersebut tidak ada pada sumber.
export const rekap_pengiriman = pgTable("rekap_pengiriman", {
  id_rekap_pengiriman: varchar("id_rekap_pengiriman").primaryKey(),
  tanggal: date("tanggal"),
  penerima: varchar("penerima").notNull(),
  barang: varchar("barang").notNull(),
  keterangan: text("keterangan"),
  jumlah_koli: kuantitas("jumlah_koli"),
  jumlah_satuan: kuantitas("jumlah_satuan"),
  harga_per_pcs: uang("harga_per_pcs"),
  total: uang("total"),
  tanggal_pembayaran: date("tanggal_pembayaran"),
  total_pembayaran: uang("total_pembayaran"),
  dicatat_oleh: varchar("dicatat_oleh").references(() => pengguna.id_pengguna),
  ...jejak,
});

export const pengiriman = pgTable("pengiriman", {
  id_pengiriman: varchar("id_pengiriman").primaryKey(),
  id_pesanan: varchar("id_pesanan")
    .notNull()
    .references(() => pesanan.id_pesanan),
  tanggal_pengiriman: date("tanggal_pengiriman"),
  nomor_resi: varchar("nomor_resi"),
  ekspedisi: varchar("ekspedisi"),
  jenis_pengiriman: varchar("jenis_pengiriman").$type<JenisPengiriman>().notNull(),
  jumlah_koli: integer("jumlah_koli"),
  nomor_tanda_terima: varchar("nomor_tanda_terima"),
  dokumen: varchar("dokumen"),
  nama_file_dokumen: varchar("nama_file_dokumen"),
  keterangan: text("keterangan"),
  status_pengiriman: varchar("status_pengiriman").$type<StatusPengiriman>().notNull().default("Dalam Kirim"),
  dicatat_oleh: varchar("dicatat_oleh").references(() => pengguna.id_pengguna),
  dihapus_pada: waktu("dihapus_pada"),
  ...jejak,
});

// ---------- ERD: penerimaan ----------
// Dicatat ketika status pengiriman menjadi Selesai.
export const penerimaan = pgTable("penerimaan", {
  id_penerimaan: varchar("id_penerimaan").primaryKey(),
  id_pengiriman: varchar("id_pengiriman")
    .notNull()
    .references(() => pengiriman.id_pengiriman),
  tanggal_penerimaan: date("tanggal_penerimaan"),
  bukti_penerimaan: varchar("bukti_penerimaan"),
  dicatat_oleh: varchar("dicatat_oleh").references(() => pengguna.id_pengguna),
  dibuat_pada: waktu("dibuat_pada").notNull().defaultNow(),
});

// ---------- Tindak lanjut pembayaran (FR-16) ----------
export const tindak_lanjut = pgTable("tindak_lanjut", {
  id_tindak_lanjut: varchar("id_tindak_lanjut").primaryKey(),
  id_faktur: varchar("id_faktur")
    .notNull()
    .references(() => faktur.id_faktur),
  waktu: waktu("waktu").notNull(),
  status_komunikasi: varchar("status_komunikasi").$type<StatusKomunikasi>().notNull(),
  catatan: text("catatan").notNull(),
  pengingat_berikutnya: waktu("pengingat_berikutnya"),
  dicatat_oleh: varchar("dicatat_oleh").references(() => pengguna.id_pengguna),
  dihapus_pada: waktu("dihapus_pada"),
  dibuat_pada: waktu("dibuat_pada").notNull().defaultNow(),
});

// ---------- Relasi ----------
export const pelangganRelations = relations(pelanggan, ({ many }) => ({
  lokasi: many(lokasi_pengiriman),
  pesanan: many(pesanan),
}));

export const lokasiRelations = relations(lokasi_pengiriman, ({ one }) => ({
  pelanggan: one(pelanggan, { fields: [lokasi_pengiriman.id_pelanggan], references: [pelanggan.id_pelanggan] }),
}));

export const pesananRelations = relations(pesanan, ({ one, many }) => ({
  pelanggan: one(pelanggan, { fields: [pesanan.id_pelanggan], references: [pelanggan.id_pelanggan] }),
  barang: many(pesanan_barang),
  faktur: many(faktur),
  pengiriman: many(pengiriman),
  riwayatProduksi: many(riwayat_produksi),
}));

export const pesananBarangRelations = relations(pesanan_barang, ({ one }) => ({
  pesanan: one(pesanan, { fields: [pesanan_barang.id_pesanan], references: [pesanan.id_pesanan] }),
}));

export const riwayatProduksiRelations = relations(riwayat_produksi, ({ one }) => ({
  pesanan: one(pesanan, { fields: [riwayat_produksi.id_pesanan], references: [pesanan.id_pesanan] }),
  pengguna: one(pengguna, { fields: [riwayat_produksi.diubah_oleh], references: [pengguna.id_pengguna] }),
}));

export const fakturRelations = relations(faktur, ({ one, many }) => ({
  pesanan: one(pesanan, { fields: [faktur.id_pesanan], references: [pesanan.id_pesanan] }),
  barang: many(faktur_barang),
  pembayaran: many(pembayaran),
  tindakLanjut: many(tindak_lanjut),
}));

export const fakturBarangRelations = relations(faktur_barang, ({ one }) => ({
  faktur: one(faktur, { fields: [faktur_barang.id_faktur], references: [faktur.id_faktur] }),
}));

export const pembayaranRelations = relations(pembayaran, ({ one }) => ({
  faktur: one(faktur, { fields: [pembayaran.id_faktur], references: [faktur.id_faktur] }),
  pencatat: one(pengguna, { fields: [pembayaran.dicatat_oleh], references: [pengguna.id_pengguna] }),
  verifikator: one(pengguna, { fields: [pembayaran.diverifikasi_oleh], references: [pengguna.id_pengguna] }),
}));

export const pengirimanRelations = relations(pengiriman, ({ one, many }) => ({
  pesanan: one(pesanan, { fields: [pengiriman.id_pesanan], references: [pesanan.id_pesanan] }),
  penerimaan: many(penerimaan),
}));

export const penerimaanRelations = relations(penerimaan, ({ one }) => ({
  pengiriman: one(pengiriman, { fields: [penerimaan.id_pengiriman], references: [pengiriman.id_pengiriman] }),
}));

export const tindakLanjutRelations = relations(tindak_lanjut, ({ one }) => ({
  faktur: one(faktur, { fields: [tindak_lanjut.id_faktur], references: [faktur.id_faktur] }),
  pencatat: one(pengguna, { fields: [tindak_lanjut.dicatat_oleh], references: [pengguna.id_pengguna] }),
}));
