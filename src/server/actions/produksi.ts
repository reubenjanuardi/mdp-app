"use server";

import { revalidatePath } from "next/cache";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { wajibAkses } from "@/server/auth/sesi";
import { db } from "@/server/db";
import { pesanan, riwayat_produksi, STATUS_PRODUKSI } from "@/server/db/schema";

import type { Hasil } from "./hasil";

const skema = z
  .object({
    idPesanan: z.string().min(1),
    status: z.enum(STATUS_PRODUKSI, { message: "Status tidak valid. Pilih Dalam Proses, Selesai, atau Tertunda." }),
    catatan: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.status !== "Tertunda" || (d.catatan?.length ?? 0) >= 5, {
    path: ["catatan"],
    message: "Alasan wajib diisi untuk status Tertunda.",
  });

/** US-12: Staf Produksi memperbarui status per PO; Tertunda wajib beralasan. */
export async function ubahStatusProduksi(input: z.input<typeof skema>): Promise<Hasil> {
  const p = await wajibAkses("produksi", "U");
  const r = skema.safeParse(input);
  if (!r.success) {
    const e = r.error.flatten().fieldErrors;
    return { galat: "Status belum dapat disimpan.", isian: { status: e.status?.[0], catatan: e.catatan?.[0] } };
  }
  const d = r.data;
  const po = await db.query.pesanan.findFirst({
    where: and(eq(pesanan.id_pesanan, d.idPesanan), isNull(pesanan.dihapus_pada)),
  });
  if (!po) return { galat: "PO tidak ditemukan." };
  if (po.status_produksi === d.status && d.status !== "Tertunda") {
    return { galat: `Status ${po.id_pesanan} sudah ${d.status}.` };
  }
  await db.transaction(async (tx) => {
    await tx
      .update(pesanan)
      .set({ status_produksi: d.status, alasan_tertunda: d.status === "Tertunda" ? (d.catatan ?? null) : null })
      .where(eq(pesanan.id_pesanan, po.id_pesanan));
    await tx.insert(riwayat_produksi).values({
      id_riwayat: crypto.randomUUID(),
      id_pesanan: po.id_pesanan,
      status: d.status,
      catatan: d.catatan || null,
      diubah_oleh: p.id,
    });
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: `Status produksi ${po.id_pesanan} menjadi ${d.status}.` };
}
