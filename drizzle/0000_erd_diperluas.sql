CREATE TABLE "barang" (
	"id_barang" varchar PRIMARY KEY NOT NULL,
	"kode_barang" varchar NOT NULL,
	"nama" varchar NOT NULL,
	"spesifikasi" text,
	"satuan" varchar NOT NULL,
	"harga_acuan" numeric(18, 2) NOT NULL,
	"dihapus_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "barang_kode_barang_unique" UNIQUE("kode_barang")
);
--> statement-breakpoint
CREATE TABLE "faktur" (
	"id_faktur" varchar PRIMARY KEY NOT NULL,
	"id_pesanan" varchar NOT NULL,
	"tanggal_faktur" date,
	"nominal_faktur" numeric,
	"nomor_nota" varchar NOT NULL,
	"lampiran" varchar,
	"nama_file_lampiran" varchar,
	"koreksi_status" varchar,
	"alasan_koreksi" text,
	"dikoreksi_oleh" varchar,
	"dikoreksi_pada" timestamp with time zone,
	"dibuat_oleh" varchar,
	"dihapus_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faktur_barang" (
	"id_faktur_barang" varchar PRIMARY KEY NOT NULL,
	"id_faktur" varchar NOT NULL,
	"id_pesanan_barang" varchar,
	"urutan" integer NOT NULL,
	"nama_barang" varchar NOT NULL,
	"satuan" varchar NOT NULL,
	"banyaknya" numeric(18, 2) NOT NULL,
	"harga_satuan" numeric(18, 2) NOT NULL,
	"jumlah" numeric(18, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lokasi_pengiriman" (
	"id_lokasi" varchar PRIMARY KEY NOT NULL,
	"id_pelanggan" varchar NOT NULL,
	"nama_lokasi" varchar NOT NULL,
	"alamat" text NOT NULL,
	"dihapus_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pelanggan" (
	"id_pelanggan" varchar PRIMARY KEY NOT NULL,
	"kode_pelanggan" varchar,
	"nama_perusahaan" varchar NOT NULL,
	"alamat" text NOT NULL,
	"telepon" varchar,
	"kontak" varchar,
	"dihapus_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pelanggan_kode_pelanggan_unique" UNIQUE("kode_pelanggan"),
	CONSTRAINT "pelanggan_nama_perusahaan_unique" UNIQUE("nama_perusahaan")
);
--> statement-breakpoint
CREATE TABLE "pembayaran" (
	"id_pembayaran" varchar PRIMARY KEY NOT NULL,
	"id_faktur" varchar NOT NULL,
	"tanggal_pembayaran" date,
	"nominal_pembayaran" numeric,
	"bukti_pembayaran" varchar,
	"waktu_pembayaran" timestamp with time zone NOT NULL,
	"metode" varchar NOT NULL,
	"nomor_referensi" varchar,
	"berita_transaksi" text,
	"nama_penyetor" varchar NOT NULL,
	"nama_file_bukti" varchar,
	"status_verifikasi" varchar DEFAULT 'Menunggu Verifikasi' NOT NULL,
	"diverifikasi_oleh" varchar,
	"diverifikasi_pada" timestamp with time zone,
	"dicatat_oleh" varchar,
	"alasan_tolak" text,
	"ditolak_oleh" varchar,
	"dihapus_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penerimaan" (
	"id_penerimaan" varchar PRIMARY KEY NOT NULL,
	"id_pengiriman" varchar NOT NULL,
	"tanggal_penerimaan" date,
	"bukti_penerimaan" varchar,
	"dicatat_oleh" varchar,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengguna" (
	"id_pengguna" varchar PRIMARY KEY NOT NULL,
	"username" varchar,
	"password_hash" varchar,
	"peran" varchar,
	"nama" varchar NOT NULL,
	"email" varchar,
	"aktif" boolean DEFAULT true NOT NULL,
	"wajib_ganti_password" boolean DEFAULT false NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pengguna_username_unique" UNIQUE("username"),
	CONSTRAINT "pengguna_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pengiriman" (
	"id_pengiriman" varchar PRIMARY KEY NOT NULL,
	"id_pesanan" varchar NOT NULL,
	"tanggal_pengiriman" date,
	"nomor_resi" varchar,
	"ekspedisi" varchar,
	"jenis_pengiriman" varchar NOT NULL,
	"jumlah_koli" integer,
	"nomor_tanda_terima" varchar,
	"dokumen" varchar,
	"nama_file_dokumen" varchar,
	"keterangan" text,
	"status_pengiriman" varchar DEFAULT 'Dalam Kirim' NOT NULL,
	"dicatat_oleh" varchar,
	"dihapus_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pesanan" (
	"id_pesanan" varchar PRIMARY KEY NOT NULL,
	"id_pelanggan" varchar NOT NULL,
	"tanggal_po" date,
	"jenis_barang" varchar,
	"jumlah_pesanan" integer,
	"nomor_surat_pemesanan" varchar NOT NULL,
	"rujukan_penawaran" varchar,
	"id_lokasi" varchar,
	"nama_pelanggan" varchar NOT NULL,
	"alamat_pelanggan" text,
	"lokasi_pengiriman" text NOT NULL,
	"ketentuan_pembayaran" varchar,
	"tanggal_jatuh_tempo" date,
	"termasuk_ppn" boolean DEFAULT false NOT NULL,
	"subtotal" numeric(18, 2) NOT NULL,
	"ppn" numeric(18, 2) DEFAULT 0 NOT NULL,
	"total" numeric(18, 2) NOT NULL,
	"status_produksi" varchar DEFAULT 'Dalam Proses' NOT NULL,
	"alasan_tertunda" text,
	"dibuat_oleh" varchar,
	"dihapus_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pesanan_barang" (
	"id_pesanan_barang" varchar PRIMARY KEY NOT NULL,
	"id_pesanan" varchar NOT NULL,
	"id_barang" varchar,
	"urutan" integer NOT NULL,
	"kode_barang" varchar NOT NULL,
	"nama_barang" varchar NOT NULL,
	"spesifikasi" text,
	"satuan" varchar NOT NULL,
	"jumlah" numeric(18, 2) NOT NULL,
	"harga_satuan" numeric(18, 2) NOT NULL,
	"subtotal" numeric(18, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riwayat_produksi" (
	"id_riwayat" varchar PRIMARY KEY NOT NULL,
	"id_pesanan" varchar NOT NULL,
	"status" varchar NOT NULL,
	"catatan" text,
	"diubah_oleh" varchar,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sesi" (
	"id_sesi" varchar PRIMARY KEY NOT NULL,
	"id_pengguna" varchar NOT NULL,
	"kedaluwarsa_pada" timestamp with time zone NOT NULL,
	"dicabut_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tindak_lanjut" (
	"id_tindak_lanjut" varchar PRIMARY KEY NOT NULL,
	"id_faktur" varchar NOT NULL,
	"waktu" timestamp with time zone NOT NULL,
	"status_komunikasi" varchar NOT NULL,
	"catatan" text NOT NULL,
	"pengingat_berikutnya" timestamp with time zone,
	"dicatat_oleh" varchar,
	"dihapus_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faktur" ADD CONSTRAINT "faktur_id_pesanan_pesanan_id_pesanan_fk" FOREIGN KEY ("id_pesanan") REFERENCES "public"."pesanan"("id_pesanan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faktur" ADD CONSTRAINT "faktur_dikoreksi_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dikoreksi_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faktur" ADD CONSTRAINT "faktur_dibuat_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faktur_barang" ADD CONSTRAINT "faktur_barang_id_faktur_faktur_id_faktur_fk" FOREIGN KEY ("id_faktur") REFERENCES "public"."faktur"("id_faktur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faktur_barang" ADD CONSTRAINT "faktur_barang_id_pesanan_barang_pesanan_barang_id_pesanan_barang_fk" FOREIGN KEY ("id_pesanan_barang") REFERENCES "public"."pesanan_barang"("id_pesanan_barang") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lokasi_pengiriman" ADD CONSTRAINT "lokasi_pengiriman_id_pelanggan_pelanggan_id_pelanggan_fk" FOREIGN KEY ("id_pelanggan") REFERENCES "public"."pelanggan"("id_pelanggan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_id_faktur_faktur_id_faktur_fk" FOREIGN KEY ("id_faktur") REFERENCES "public"."faktur"("id_faktur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_diverifikasi_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("diverifikasi_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_dicatat_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_ditolak_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("ditolak_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penerimaan" ADD CONSTRAINT "penerimaan_id_pengiriman_pengiriman_id_pengiriman_fk" FOREIGN KEY ("id_pengiriman") REFERENCES "public"."pengiriman"("id_pengiriman") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penerimaan" ADD CONSTRAINT "penerimaan_dicatat_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengiriman" ADD CONSTRAINT "pengiriman_id_pesanan_pesanan_id_pesanan_fk" FOREIGN KEY ("id_pesanan") REFERENCES "public"."pesanan"("id_pesanan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengiriman" ADD CONSTRAINT "pengiriman_dicatat_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_id_pelanggan_pelanggan_id_pelanggan_fk" FOREIGN KEY ("id_pelanggan") REFERENCES "public"."pelanggan"("id_pelanggan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_id_lokasi_lokasi_pengiriman_id_lokasi_fk" FOREIGN KEY ("id_lokasi") REFERENCES "public"."lokasi_pengiriman"("id_lokasi") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_dibuat_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dibuat_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesanan_barang" ADD CONSTRAINT "pesanan_barang_id_pesanan_pesanan_id_pesanan_fk" FOREIGN KEY ("id_pesanan") REFERENCES "public"."pesanan"("id_pesanan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesanan_barang" ADD CONSTRAINT "pesanan_barang_id_barang_barang_id_barang_fk" FOREIGN KEY ("id_barang") REFERENCES "public"."barang"("id_barang") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_produksi" ADD CONSTRAINT "riwayat_produksi_id_pesanan_pesanan_id_pesanan_fk" FOREIGN KEY ("id_pesanan") REFERENCES "public"."pesanan"("id_pesanan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_produksi" ADD CONSTRAINT "riwayat_produksi_diubah_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("diubah_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesi" ADD CONSTRAINT "sesi_id_pengguna_pengguna_id_pengguna_fk" FOREIGN KEY ("id_pengguna") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tindak_lanjut" ADD CONSTRAINT "tindak_lanjut_id_faktur_faktur_id_faktur_fk" FOREIGN KEY ("id_faktur") REFERENCES "public"."faktur"("id_faktur") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tindak_lanjut" ADD CONSTRAINT "tindak_lanjut_dicatat_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "faktur_nomor_nota_unik" ON "faktur" USING btree ("nomor_nota");