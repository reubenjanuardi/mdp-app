CREATE TABLE "produksi_harian" (
	"id_produksi_harian" varchar PRIMARY KEY NOT NULL,
	"tanggal" date NOT NULL,
	"mesin" varchar NOT NULL,
	"operator" varchar NOT NULL,
	"kode_produk" varchar NOT NULL,
	"jumlah_hasil" numeric(18, 2) NOT NULL,
	"catatan" text,
	"dicatat_oleh" varchar,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rekap_pengiriman" (
	"id_rekap_pengiriman" varchar PRIMARY KEY NOT NULL,
	"tanggal" date,
	"penerima" varchar NOT NULL,
	"barang" varchar NOT NULL,
	"keterangan" text,
	"jumlah_koli" numeric(18, 2),
	"jumlah_satuan" numeric(18, 2),
	"harga_per_pcs" numeric(18, 2),
	"total" numeric(18, 2),
	"tanggal_pembayaran" date,
	"total_pembayaran" numeric(18, 2),
	"dicatat_oleh" varchar,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "produksi_harian" ADD CONSTRAINT "produksi_harian_dicatat_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rekap_pengiriman" ADD CONSTRAINT "rekap_pengiriman_dicatat_oleh_pengguna_id_pengguna_fk" FOREIGN KEY ("dicatat_oleh") REFERENCES "public"."pengguna"("id_pengguna") ON DELETE no action ON UPDATE no action;