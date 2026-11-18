"use server";

import { revalidatePath } from "next/cache";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { wajibAkses } from "@/server/auth/sesi";
import { simpanBerkas } from "@/server/berkas";
import { sisaPerBaris } from "@/server/data/tagihan";
import { db } from "@/server/db";
import { faktur, faktur_barang, pesanan } from "@/server/db/schema";

import type { Hasil } from "./hasil";

const skema = z.object({
  idPesanan: z.string().min(1),
  nomorNota: z.string().trim().min(1, "No. nota faktur wajib diisi.").max(60),
  tanggalNota: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal nota wajib diisi."),
  baris: z.array(z.object({ idPesananBarang: z.string(), banyaknya: z.number() })),
});

/** US-04: nota tertaut ke pesanan, nomor nota unik, status awal Belum Bayar. */
export async function simpanTagihan(form: FormData): Promise<Hasil<{ id: string }>> {
  const p = await wajibAkses("tagihan", "T");
  let baris: unknown = [];
  try {
    baris = JSON.parse(String(form.get("baris") ?? "[]"));
  } catch {
    return { galat: "Data barang tidak terbaca. Muat ulang halaman lalu coba lagi." };
  }
  const r = skema.safeParse({
    idPesanan: form.get("idPesanan"),
    nomorNota: form.get("nomorNota"),
    tanggalNota: form.get("tanggalNota"),
    baris,
  });
  if (!r.success) {
    const e = r.error.flatten().fieldErrors;
    return {
      galat: "Lengkapi isian yang ditandai.",
      isian: { nomorNota: e.nomorNota?.[0], tanggalNota: e.tanggalNota?.[0] },
    };
  }
  const d = r.data;

  const po = await db.query.pesanan.findFirst({
    where: and(eq(pesanan.id_pesanan, d.idPesanan), isNull(pesanan.dihapus_pada)),
  });
  if (!po) return { galat: "Pesanan tidak ditemukan. Pilih pesanan yang valid." };

  const ada = await db.query.faktur.findFirst({ where: eq(faktur.nomor_nota, d.nomorNota) });
  if (ada)
    return {
      galat: "Lengkapi isian yang ditandai.",
      isian: { nomorNota: `Nomor nota ${d.nomorNota} sudah terpakai.` },
    };

  const sisa = await sisaPerBaris(d.idPesanan);
  const isian: Record<string, string> = {};
  const dipakai = d.baris.filter((b) => b.banyaknya > 0);
  for (const b of d.baris) {
    const s = sisa.find((x) => x.id === b.idPesananBarang);
    if (!s) return { galat: "Barang tidak sesuai dengan pesanan." };
    if (Number.isNaN(b.banyaknya) || b.banyaknya < 0)
      isian[`baris.${b.idPesananBarang}`] = "Banyaknya tidak boleh negatif.";
    else if (b.banyaknya > s.sisa)
      isian[`baris.${b.idPesananBarang}`] = `Melebihi sisa di PO (${s.sisa.toLocaleString("id-ID")}).`;
  }
  if (Object.keys(isian).length) return { galat: "Periksa banyaknya barang yang ditagihkan.", isian };
  if (dipakai.length === 0)
    return { galat: "Isi banyaknya minimal satu barang.", isian: { barang: "Isi banyaknya minimal satu barang." } };

  let lampiran: string | null = null;
  const file = form.get("lampiran");
  if (file instanceof File && file.size > 0) {
    try {
      lampiran = await simpanBerkas(file, "faktur");
    } catch (e) {
      return { galat: "Lampiran belum sesuai.", isian: { lampiran: (e as Error).message } };
    }
  }

  const items = dipakai.map((b, i) => {
    const s = sisa.find((x) => x.id === b.idPesananBarang) as (typeof sisa)[number];
    return {
      id_faktur_barang: crypto.randomUUID(),
      id_pesanan_barang: s.id,
      urutan: i + 1,
      nama_barang: s.nama,
      satuan: s.satuan,
      banyaknya: b.banyaknya,
      harga_satuan: s.harga,
      jumlah: Math.round(b.banyaknya * s.harga),
    };
  });
  const sub = items.reduce((t, x) => t + x.jumlah, 0);
  const total = po.termasuk_ppn ? sub + Math.round(sub * 0.11) : sub;
  const id = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(faktur).values({
        id_faktur: id,
        id_pesanan: po.id_pesanan,
        nomor_nota: d.nomorNota,
        tanggal_faktur: d.tanggalNota,
        nominal_faktur: total,
        lampiran,
        nama_file_lampiran: file instanceof File && lampiran ? file.name : null,
        dibuat_oleh: p.id,
      });
      await tx.insert(faktur_barang).values(items.map((x) => ({ ...x, id_faktur: id })));
    });
  } catch {
    // Dua pengguna menyimpan nomor yang sama bersamaan: indeks unik menolak yang kedua.
    return {
      galat: "Lengkapi isian yang ditandai.",
      isian: { nomorNota: `Nomor nota ${d.nomorNota} sudah terpakai.` },
    };
  }

  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: `Tagihan ${d.nomorNota} tersimpan dengan status Belum Bayar.`, data: { id } };
}
