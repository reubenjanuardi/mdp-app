"use server";

import { revalidatePath } from "next/cache";

import { desc } from "drizzle-orm";
import { z } from "zod";

import { wajibAkses } from "@/server/auth/sesi";
import { db } from "@/server/db";
import { produksi_harian } from "@/server/db/schema";

import { galatZod, type Hasil } from "./hasil";

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal valid.");
const skemaProduksi = z.object({
  tanggal,
  mesin: z.enum(["Cupseal", "Rubber Seal"], { message: "Pilih mesin." }),
  nomorOperator: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().positive().nullable()),
  operator: z.string().trim().min(1, "Nama operator wajib diisi.").max(120),
  kodeProduk: z.string().trim().min(1, "Kode produk wajib diisi.").max(60),
  jumlahHasil: z.coerce.number().positive("Jumlah hasil harus lebih dari 0."),
  catatan: z.string().trim().max(300).optional(),
});

export type InputProduksiHarian = z.input<typeof skemaProduksi>;

export async function simpanProduksiHarian(input: InputProduksiHarian): Promise<Hasil> {
  const p = await wajibAkses("produksi", "T");
  const r = skemaProduksi.safeParse(input);
  if (!r.success) return { galat: "Lengkapi isian yang ditandai.", isian: galatZod(r.error).isian };
  const d = r.data;
  await db.insert(produksi_harian).values({
    id_produksi_harian: crypto.randomUUID(),
    tanggal: d.tanggal,
    mesin: d.mesin,
    nomor_operator: d.nomorOperator,
    operator: d.operator,
    kode_produk: d.kodeProduk.toUpperCase(),
    jumlah_hasil: d.jumlahHasil,
    catatan: d.catatan || null,
    dicatat_oleh: p.id,
  });
  revalidatePath("/dashboard/produksi/realisasi");
  return { ok: true, pesan: "Realisasi produksi tersimpan." };
}

export async function daftarProduksiHarian() {
  await wajibAkses("produksi");
  return db.select().from(produksi_harian).orderBy(desc(produksi_harian.tanggal), desc(produksi_harian.dibuat_pada));
}
