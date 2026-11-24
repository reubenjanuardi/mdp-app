"use server";

import { revalidatePath } from "next/cache";

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { hariIni } from "@/lib/format";
import { hitungTagihan } from "@/lib/status";
import { wajibAkses } from "@/server/auth/sesi";
import { hapusBerkas, simpanBerkas } from "@/server/berkas";
import { db } from "@/server/db";
import { faktur, pembayaran, pesanan, STATUS_TAGIHAN } from "@/server/db/schema";

import type { Hasil } from "./hasil";

async function cariPembayaran(id: string) {
  return db.query.pembayaran.findFirst({
    where: and(eq(pembayaran.id_pembayaran, id), isNull(pembayaran.dihapus_pada)),
    with: { faktur: true },
  });
}

/** Hanya Admin (PRD bagian 5: V). */
export async function verifikasiPembayaran(id: string): Promise<Hasil> {
  const p = await wajibAkses("pembayaran", "V");
  const b = await cariPembayaran(id);
  if (!b) return { galat: "Pembayaran tidak ditemukan atau sudah dihapus." };
  if (b.status_verifikasi === "Terverifikasi") return { galat: "Pembayaran ini sudah diverifikasi." };
  await db
    .update(pembayaran)
    .set({ status_verifikasi: "Terverifikasi", diverifikasi_oleh: p.id, diverifikasi_pada: new Date() })
    .where(eq(pembayaran.id_pembayaran, id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: "Pembayaran diverifikasi dan dihitung ke sisa tagihan." };
}

export async function tolakPembayaran(id: string, alasan: string): Promise<Hasil> {
  const p = await wajibAkses("pembayaran", "V");
  const teks = alasan.trim();
  if (teks.length < 5) return { isian: { alasan: "Tulis alasan penolakan, minimal 5 karakter." } };
  const b = await cariPembayaran(id);
  if (!b) return { galat: "Pembayaran tidak ditemukan atau sudah dihapus." };
  if (b.status_verifikasi === "Terverifikasi")
    return { galat: "Pembayaran yang sudah diverifikasi tidak dapat ditolak." };
  await db
    .update(pembayaran)
    .set({ alasan_tolak: teks, ditolak_oleh: p.id, dihapus_pada: new Date() })
    .where(eq(pembayaran.id_pembayaran, id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: "Pembayaran ditolak dan tidak dihitung ke tagihan." };
}

export async function hapusPembayaran(id: string): Promise<Hasil> {
  await wajibAkses("pembayaran", "H");
  const b = await cariPembayaran(id);
  if (!b) return { galat: "Pembayaran tidak ditemukan atau sudah dihapus." };
  await db.update(pembayaran).set({ dihapus_pada: new Date() }).where(eq(pembayaran.id_pembayaran, id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: "Pembayaran dihapus." };
}

const skemaKoreksi = z.object({
  idFaktur: z.string().min(1, "Pilih nota yang dikoreksi."),
  status: z.enum([...STATUS_TAGIHAN, "Otomatis"], { message: "Pilih status baru." }),
  alasan: z.string().trim().min(5, "Alasan koreksi wajib diisi, minimal 5 karakter."),
});

/** US-06: koreksi manual wajib beralasan; koreksi ke Lunas ditolak bila masih ada sisa tanpa transaksi terverifikasi. */
export async function koreksiStatus(input: z.input<typeof skemaKoreksi>): Promise<Hasil> {
  const p = await wajibAkses("pembayaran", "U");
  const r = skemaKoreksi.safeParse(input);
  if (!r.success) {
    const e = r.error.flatten().fieldErrors;
    return { isian: { idFaktur: e.idFaktur?.[0], status: e.status?.[0], alasan: e.alasan?.[0] } };
  }
  const f = await db.query.faktur.findFirst({
    where: and(eq(faktur.id_faktur, r.data.idFaktur), isNull(faktur.dihapus_pada)),
    with: { pembayaran: { where: isNull(pembayaran.dihapus_pada) } },
  });
  if (!f) return { galat: "Nota tidak ditemukan." };
  const po = await db.query.pesanan.findFirst({ where: eq(pesanan.id_pesanan, f.id_pesanan) });

  if (r.data.status === "Lunas") {
    const t = hitungTagihan({
      total: f.nominal_faktur ?? 0,
      pembayaran: f.pembayaran.map((b) => ({ nominal: b.nominal_pembayaran ?? 0, status: b.status_verifikasi })),
      jatuhTempo: po?.tanggal_jatuh_tempo ?? null,
      hariIni: hariIni(),
    });
    if (t.sisa > 0) {
      return {
        galat: `Koreksi ke Lunas ditolak. Masih ada sisa Rp${t.sisa.toLocaleString("id-ID")} tanpa transaksi terverifikasi. Catat dan verifikasi pembayarannya dahulu.`,
      };
    }
  }

  await db
    .update(faktur)
    .set({
      koreksi_status: r.data.status === "Otomatis" ? null : r.data.status,
      alasan_koreksi: r.data.alasan,
      dikoreksi_oleh: p.id,
      dikoreksi_pada: new Date(),
    })
    .where(eq(faktur.id_faktur, f.id_faktur));
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    pesan:
      r.data.status === "Otomatis"
        ? `Status ${f.nomor_nota} kembali dihitung otomatis.`
        : `Status ${f.nomor_nota} dikoreksi menjadi ${r.data.status}.`,
  };
}

const skemaBayar = z.object({
  idFaktur: z.string().min(1, "Pilih nota yang dibayar."),
  waktu: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Isi tanggal dan jam transaksi."),
  nominal: z.coerce
    .number({ message: "Isi nominal pembayaran." })
    .positive("Nominal harus lebih dari 0. Nominal negatif ditolak."),
  metode: z.enum(["Transfer", "Setor Tunai"], { message: "Pilih metode pembayaran." }),
  referensi: z.string().trim().min(1, "Nomor referensi transaksi wajib diisi.").max(60),
  penyetor: z.string().trim().min(1, "Nama penyetor wajib diisi.").max(120),
  berita: z.string().trim().max(200).optional(),
});

/** US-05: pembayaran baru berstatus Menunggu Verifikasi dan belum dihitung ke sisa tagihan. */
export async function simpanPembayaran(form: FormData): Promise<Hasil<{ idPesanan: string }>> {
  const p = await wajibAkses("pembayaran", "T");
  const r = skemaBayar.safeParse({
    idFaktur: form.get("idFaktur"),
    waktu: form.get("waktu"),
    nominal: form.get("nominal"),
    metode: form.get("metode"),
    referensi: form.get("referensi"),
    penyetor: form.get("penyetor"),
    berita: form.get("berita") || undefined,
  });
  const file = form.get("bukti");
  const adaFile = file instanceof File && file.size > 0;
  if (!r.success || !adaFile) {
    const e = r.success ? {} : r.error.flatten().fieldErrors;
    const isian: Record<string, string | undefined> = {
      idFaktur: e.idFaktur?.[0],
      waktu: e.waktu?.[0],
      nominal: e.nominal?.[0],
      metode: e.metode?.[0],
      referensi: e.referensi?.[0],
      penyetor: e.penyetor?.[0],
      berita: e.berita?.[0],
      bukti: adaFile ? undefined : "Lampirkan foto atau PDF bukti setor.",
    };
    const n = Object.values(isian).filter(Boolean).length;
    return { galat: `Lengkapi ${n} isian yang ditandai di bawah.`, isian };
  }
  const d = r.data;
  const f = await db.query.faktur.findFirst({
    where: and(eq(faktur.id_faktur, d.idFaktur), isNull(faktur.dihapus_pada)),
    with: { pesanan: true },
  });
  if (!f || f.pesanan.dihapus_pada) return { galat: "Nota tidak ditemukan. Pilih nota dari pesanan yang valid." };

  let bukti: string;
  try {
    bukti = await simpanBerkas(file as File, "pembayaran");
  } catch (e) {
    return { galat: "Bukti transaksi belum sesuai.", isian: { bukti: (e as Error).message } };
  }

  const waktu = new Date(`${d.waktu}:00+07:00`);
  try {
    await db.insert(pembayaran).values({
      id_pembayaran: crypto.randomUUID(),
      id_faktur: f.id_faktur,
      tanggal_pembayaran: d.waktu.slice(0, 10),
      waktu_pembayaran: waktu,
      nominal_pembayaran: d.nominal,
      metode: d.metode,
      nomor_referensi: d.referensi,
      nama_penyetor: d.penyetor,
      berita_transaksi: d.berita ?? null,
      bukti_pembayaran: bukti,
      nama_file_bukti: (file as File).name,
      status_verifikasi: "Menunggu Verifikasi",
      dicatat_oleh: p.id,
    });
  } catch (e) {
    await hapusBerkas(bukti);
    throw e;
  }
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    pesan: `Pembayaran Rp${d.nominal.toLocaleString("id-ID")} tersimpan dan menunggu verifikasi Admin.`,
    data: { idPesanan: f.id_pesanan },
  };
}
