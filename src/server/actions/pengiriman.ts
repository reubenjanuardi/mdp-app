"use server";

import { revalidatePath } from "next/cache";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { hariIni } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { hapusBerkas, simpanBerkas } from "@/server/berkas";
import { db } from "@/server/db";
import { penerimaan, pengiriman, pesanan } from "@/server/db/schema";

import type { Hasil } from "./hasil";

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal kirim.");

const skema = z.discriminatedUnion("jenis", [
  z.object({
    jenis: z.literal("Ekspedisi"),
    idPesanan: z.string().min(1, "Pilih pesanan."),
    ekspedisi: z.string().trim().min(1, "Nama ekspedisi wajib diisi.").max(80),
    nomorResi: z.string().trim().min(1, "Nomor resi wajib diisi untuk pengiriman ekspedisi.").max(60),
    tanggal,
    koli: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.coerce.number({ message: "Isi jumlah koli." }).int("Jumlah koli berupa bilangan bulat.").positive("Jumlah koli minimal 1."),
    ),
    status: z.enum(["Dalam Kirim", "Selesai"]),
  }),
  z.object({
    jenis: z.literal("Antar Langsung"),
    idPesanan: z.string().min(1, "Pilih pesanan."),
    nomorTtb: z.string().trim().min(1, "Nomor Tanda Terima Barang wajib diisi untuk antar langsung.").max(60),
    tanggal,
    status: z.enum(["Dalam Kirim", "Selesai"]),
  }),
]);

/** US-10: pengiriman boleh dicatat sebelum lunas dan bertahap; dokumen pindai wajib. */
export async function simpanPengiriman(form: FormData): Promise<Hasil<{ id: string; idPesanan: string }>> {
  const p = await wajibAkses("pengiriman", "T");
  const jenis = form.get("jenis");
  const r = skema.safeParse({
    jenis,
    idPesanan: form.get("idPesanan"),
    ekspedisi: form.get("ekspedisi"),
    nomorResi: form.get("nomorResi"),
    nomorTtb: form.get("nomorTtb"),
    tanggal: form.get("tanggal"),
    koli: form.get("koli"),
    status: form.get("status"),
  });
  const file = form.get("dokumen");
  const adaFile = file instanceof File && file.size > 0;
  if (!r.success || !adaFile) {
    const isian: Record<string, string | undefined> = {};
    if (!r.success) for (const i of r.error.issues) isian[String(i.path[0])] ??= i.message;
    if (!adaFile)
      isian.dokumen =
        jenis === "Antar Langsung" ? "Unggah hasil pindai Tanda Terima Barang." : "Unggah hasil pindai resi.";
    const n = Object.values(isian).filter(Boolean).length;
    return { galat: `Lengkapi ${n} informasi wajib yang ditandai.`, isian };
  }
  const d = r.data;
  const po = await db.query.pesanan.findFirst({
    where: and(eq(pesanan.id_pesanan, d.idPesanan), isNull(pesanan.dihapus_pada)),
  });
  if (!po)
    return {
      galat: "Pesanan tidak ditemukan. Pilih pesanan yang valid.",
      isian: { idPesanan: "Pilih pesanan yang valid." },
    };

  let dokumen: string;
  try {
    dokumen = await simpanBerkas(file as File, "pengiriman");
  } catch (e) {
    return { galat: "Dokumen belum sesuai.", isian: { dokumen: (e as Error).message } };
  }

  const id = crypto.randomUUID();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(pengiriman).values({
        id_pengiriman: id,
        id_pesanan: po.id_pesanan,
        jenis_pengiriman: d.jenis,
        ekspedisi: d.jenis === "Ekspedisi" ? d.ekspedisi : null,
        nomor_resi: d.jenis === "Ekspedisi" ? d.nomorResi : null,
        jumlah_koli: d.jenis === "Ekspedisi" ? d.koli : null,
        nomor_tanda_terima: d.jenis === "Antar Langsung" ? d.nomorTtb : null,
        tanggal_pengiriman: d.tanggal,
        status_pengiriman: d.status,
        dokumen,
        nama_file_dokumen: (file as File).name,
        dicatat_oleh: p.id,
      });
      if (d.status === "Selesai") {
        await tx.insert(penerimaan).values({
          id_penerimaan: crypto.randomUUID(),
          id_pengiriman: id,
          tanggal_penerimaan: d.tanggal,
          bukti_penerimaan: dokumen,
          dicatat_oleh: p.id,
        });
      }
    });
  } catch (e) {
    await hapusBerkas(dokumen);
    throw e;
  }
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    pesan: `Pengiriman ${po.id_pesanan} tersimpan dengan status ${d.status}.`,
    data: { id, idPesanan: po.id_pesanan },
  };
}

export async function tandaiSelesai(id: string): Promise<Hasil> {
  const p = await wajibAkses("pengiriman", "U");
  const k = await db.query.pengiriman.findFirst({
    where: and(eq(pengiriman.id_pengiriman, id), isNull(pengiriman.dihapus_pada)),
  });
  if (!k) return { galat: "Pengiriman tidak ditemukan." };
  if (k.status_pengiriman === "Selesai") return { galat: "Pengiriman ini sudah selesai." };
  await db.transaction(async (tx) => {
    await tx.update(pengiriman).set({ status_pengiriman: "Selesai" }).where(eq(pengiriman.id_pengiriman, id));
    await tx.insert(penerimaan).values({
      id_penerimaan: crypto.randomUUID(),
      id_pengiriman: id,
      tanggal_penerimaan: hariIni(),
      bukti_penerimaan: k.dokumen,
      dicatat_oleh: p.id,
    });
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: "Pengiriman ditandai Selesai." };
}
