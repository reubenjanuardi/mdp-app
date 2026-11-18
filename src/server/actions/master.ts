"use server";

import { revalidatePath } from "next/cache";

import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { wajibAkses } from "@/server/auth/sesi";
import { db } from "@/server/db";
import { barang, lokasi_pengiriman, pelanggan } from "@/server/db/schema";

import type { Hasil } from "./hasil";

const skemaPelanggan = z.object({
  id: z.string().optional(),
  nama: z.string().trim().min(1, "Nama perusahaan wajib diisi.").max(120),
  alamat: z.string().trim().min(1, "Alamat wajib diisi.").max(300),
  telepon: z.string().trim().max(40).optional(),
  kontak: z.string().trim().max(80).optional(),
  lokasi: z
    .array(
      z.object({
        id: z.string().optional(),
        nama: z.string().trim().min(1, "Nama lokasi wajib diisi.").max(80),
        alamat: z.string().trim().max(200),
      }),
    )
    .min(1, "Tambahkan minimal satu lokasi pengiriman."),
});

export type InputPelanggan = z.input<typeof skemaPelanggan>;

function isianDari(e: z.ZodError) {
  const isian: Record<string, string> = {};
  for (const i of e.issues) isian[i.path.map(String).join(".")] ??= i.message;
  return isian;
}

/** US-18: nama pelanggan unik; perubahan tidak mengubah PO lama (PO menyimpan salinan nama dan lokasi). */
export async function simpanPelanggan(input: InputPelanggan): Promise<Hasil<{ id: string }>> {
  await wajibAkses("dataMaster", input.id ? "U" : "T");
  const r = skemaPelanggan.safeParse(input);
  if (!r.success) return { galat: "Lengkapi isian yang ditandai.", isian: isianDari(r.error) };
  const d = r.data;

  const kembar = await db.query.pelanggan.findFirst({
    where: and(
      sql`lower(${pelanggan.nama_perusahaan}) = lower(${d.nama})`,
      d.id ? ne(pelanggan.id_pelanggan, d.id) : undefined,
    ),
  });
  if (kembar) {
    return {
      galat: "Lengkapi isian yang ditandai.",
      isian: {
        nama: kembar.dihapus_pada
          ? `${d.nama} pernah terdaftar lalu dihapus. Gunakan nama lain.`
          : `Pelanggan ${d.nama} sudah terdaftar.`,
      },
    };
  }

  const id = d.id ?? `PLG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db.transaction(async (tx) => {
    const nilai = { nama_perusahaan: d.nama, alamat: d.alamat, telepon: d.telepon || null, kontak: d.kontak || null };
    if (d.id) await tx.update(pelanggan).set(nilai).where(eq(pelanggan.id_pelanggan, d.id));
    else await tx.insert(pelanggan).values({ id_pelanggan: id, ...nilai });

    const lama = await tx.query.lokasi_pengiriman.findMany({
      where: and(eq(lokasi_pengiriman.id_pelanggan, id), isNull(lokasi_pengiriman.dihapus_pada)),
    });
    const dipertahankan = new Set(d.lokasi.map((l) => l.id).filter(Boolean));
    for (const l of lama) {
      if (!dipertahankan.has(l.id_lokasi)) {
        await tx
          .update(lokasi_pengiriman)
          .set({ dihapus_pada: new Date() })
          .where(eq(lokasi_pengiriman.id_lokasi, l.id_lokasi));
      }
    }
    for (const l of d.lokasi) {
      if (l.id && lama.some((x) => x.id_lokasi === l.id)) {
        await tx
          .update(lokasi_pengiriman)
          .set({ nama_lokasi: l.nama, alamat: l.alamat })
          .where(eq(lokasi_pengiriman.id_lokasi, l.id));
      } else {
        await tx
          .insert(lokasi_pengiriman)
          .values({ id_lokasi: crypto.randomUUID(), id_pelanggan: id, nama_lokasi: l.nama, alamat: l.alamat });
      }
    }
  });
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    pesan: d.id ? `Perubahan ${d.nama} tersimpan.` : `Pelanggan ${d.nama} ditambahkan.`,
    data: { id },
  };
}

export async function hapusPelanggan(id: string): Promise<Hasil> {
  await wajibAkses("dataMaster", "H");
  const p = await db.query.pelanggan.findFirst({
    where: and(eq(pelanggan.id_pelanggan, id), isNull(pelanggan.dihapus_pada)),
  });
  if (!p) return { galat: "Pelanggan tidak ditemukan." };
  await db.update(pelanggan).set({ dihapus_pada: new Date() }).where(eq(pelanggan.id_pelanggan, id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: `${p.nama_perusahaan} dihapus dari daftar. PO lama tetap menampilkan datanya.` };
}

const skemaBarang = z.object({
  id: z.string().optional(),
  kode: z
    .string()
    .trim()
    .min(1, "Kode barang wajib diisi.")
    .max(30)
    .transform((v) => v.toUpperCase()),
  nama: z.string().trim().min(1, "Nama barang wajib diisi.").max(120),
  spesifikasi: z.string().trim().max(300).optional(),
  satuan: z.string().trim().min(1, "Pilih satuan.").max(20),
  harga: z.coerce.number({ message: "Isi harga acuan." }).min(0, "Harga acuan tidak boleh negatif."),
});

export type InputBarang = z.input<typeof skemaBarang>;

/** US-19: kode barang unik; harga acuan mengisi harga satuan di PO baru. */
export async function simpanBarang(input: InputBarang): Promise<Hasil<{ id: string }>> {
  await wajibAkses("dataMaster", input.id ? "U" : "T");
  const r = skemaBarang.safeParse(input);
  if (!r.success) return { galat: "Lengkapi isian yang ditandai.", isian: isianDari(r.error) };
  const d = r.data;
  const kembar = await db.query.barang.findFirst({
    where: and(eq(barang.kode_barang, d.kode), d.id ? ne(barang.id_barang, d.id) : undefined),
  });
  if (kembar)
    return { galat: "Lengkapi isian yang ditandai.", isian: { kode: `Kode barang ${d.kode} sudah terdaftar.` } };

  const id = d.id ?? `BRG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const nilai = {
    kode_barang: d.kode,
    nama: d.nama,
    spesifikasi: d.spesifikasi || null,
    satuan: d.satuan,
    harga_acuan: d.harga,
  };
  if (d.id) await db.update(barang).set(nilai).where(eq(barang.id_barang, d.id));
  else await db.insert(barang).values({ id_barang: id, ...nilai });
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: d.id ? `Perubahan ${d.kode} tersimpan.` : `Barang ${d.kode} ditambahkan.`, data: { id } };
}

export async function hapusBarang(id: string): Promise<Hasil> {
  await wajibAkses("dataMaster", "H");
  const b = await db.query.barang.findFirst({ where: and(eq(barang.id_barang, id), isNull(barang.dihapus_pada)) });
  if (!b) return { galat: "Barang tidak ditemukan." };
  await db.update(barang).set({ dihapus_pada: new Date() }).where(eq(barang.id_barang, id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: `${b.kode_barang} dihapus dari daftar. PO lama tetap menampilkan datanya.` };
}
