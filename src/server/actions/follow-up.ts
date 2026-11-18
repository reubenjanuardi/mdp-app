"use server";

import { revalidatePath } from "next/cache";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { wajibAkses } from "@/server/auth/sesi";
import { db } from "@/server/db";
import { faktur, STATUS_KOMUNIKASI, tindak_lanjut } from "@/server/db/schema";

import type { Hasil } from "./hasil";

const waktu = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Isi tanggal dan jam.");

const skema = z.object({
  idFaktur: z.string().min(1),
  waktu,
  status: z.enum(STATUS_KOMUNIKASI, { message: "Pilih status komunikasi." }),
  catatan: z.string().trim().min(5, "Catatan wajib diisi, minimal 5 karakter.").max(1000),
  pengingat: z.union([waktu, z.literal("")]).optional(),
});

/** US-09 (FR-16): menyimpan hasil komunikasi Admin dengan pelanggan. Sistem tidak mengirim pesan apa pun. */
export async function simpanTindakLanjut(input: z.input<typeof skema>): Promise<Hasil> {
  const p = await wajibAkses("followUp", "T");
  const r = skema.safeParse(input);
  if (!r.success) {
    const e = r.error.flatten().fieldErrors;
    return {
      galat: "Catatan belum dapat disimpan.",
      isian: { waktu: e.waktu?.[0], status: e.status?.[0], catatan: e.catatan?.[0], pengingat: e.pengingat?.[0] },
    };
  }
  const d = r.data;
  const f = await db.query.faktur.findFirst({
    where: and(eq(faktur.id_faktur, d.idFaktur), isNull(faktur.dihapus_pada)),
  });
  if (!f) return { galat: "Tagihan tidak ditemukan." };
  const w = new Date(`${d.waktu}:00+07:00`);
  if (w.getTime() > Date.now() + 5 * 60_000)
    return { galat: "Periksa waktu komunikasi.", isian: { waktu: "Waktu komunikasi tidak boleh di masa depan." } };
  const ingat = d.pengingat ? new Date(`${d.pengingat}:00+07:00`) : null;
  if (ingat && ingat <= w)
    return {
      galat: "Periksa pengingat berikutnya.",
      isian: { pengingat: "Pengingat harus setelah waktu komunikasi." },
    };

  await db.insert(tindak_lanjut).values({
    id_tindak_lanjut: crypto.randomUUID(),
    id_faktur: f.id_faktur,
    waktu: w,
    status_komunikasi: d.status,
    catatan: d.catatan,
    pengingat_berikutnya: ingat,
    dicatat_oleh: p.id,
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: `Catatan tindak lanjut ${f.nomor_nota} tersimpan.` };
}
