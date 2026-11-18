"use server";

import { revalidatePath } from "next/cache";

import { and, desc, eq, inArray, isNull, like } from "drizzle-orm";
import { z } from "zod";

import { teksLokasi } from "@/lib/format";
import { hitungTotalPesanan } from "@/lib/status";
import { wajibAkses } from "@/server/auth/sesi";
import { db } from "@/server/db";
import {
  barang,
  faktur,
  lokasi_pengiriman,
  pelanggan,
  pesanan,
  pesanan_barang,
  riwayat_produksi,
} from "@/server/db/schema";

import { galatZod, type Hasil } from "./hasil";

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal yang valid.");

const skemaBaris = z.object({
  idBarang: z.string().min(1, "Pilih barang dari data master."),
  jumlah: z.coerce.number({ message: "Isi jumlah." }).positive("Jumlah harus lebih dari 0."),
  hargaSatuan: z.coerce.number({ message: "Isi harga satuan." }).min(0, "Harga satuan tidak boleh negatif."),
});

const skemaPesanan = z.object({
  nomorSp: z.string().trim().min(1, "No. surat pemesanan wajib diisi.").max(80),
  tanggalPo: tanggal,
  idPelanggan: z.string().min(1, "Pilih pelanggan dari data master."),
  rujukan: z.string().trim().max(80).optional(),
  idLokasi: z.string().min(1, "Pilih lokasi pengiriman milik pelanggan."),
  ketentuan: z.string().trim().max(120).optional(),
  jatuhTempo: z.string().min(1, "Tanggal jatuh tempo wajib diisi.").pipe(tanggal),
  termasukPpn: z.boolean(),
  baris: z.array(skemaBaris).min(1, "Tambahkan minimal satu barang."),
});

export type InputPesanan = z.input<typeof skemaPesanan>;

/** Nomor PO internal berurutan per tahun: PO-2026-0145. */
async function nomorBerikutnya(tahun: string) {
  const [akhir] = await db
    .select({ id: pesanan.id_pesanan })
    .from(pesanan)
    .where(like(pesanan.id_pesanan, `PO-${tahun}-%`))
    .orderBy(desc(pesanan.id_pesanan))
    .limit(1);
  const n = akhir ? Number(akhir.id.split("-")[2]) + 1 : 1;
  return `PO-${tahun}-${String(n).padStart(4, "0")}`;
}

async function siapkan(input: InputPesanan) {
  const r = skemaPesanan.safeParse(input);
  if (!r.success) return { gagal: galatZod(r.error) } as const;
  const d = r.data;
  if (d.jatuhTempo < d.tanggalPo) {
    return {
      gagal: {
        galat: "Periksa tanggal jatuh tempo.",
        isian: { jatuhTempo: "Jatuh tempo tidak boleh sebelum tanggal PO." },
      },
    } as const;
  }

  const [plg, lok, brg] = await Promise.all([
    db.query.pelanggan.findFirst({
      where: and(eq(pelanggan.id_pelanggan, d.idPelanggan), isNull(pelanggan.dihapus_pada)),
    }),
    db.query.lokasi_pengiriman.findFirst({
      where: and(eq(lokasi_pengiriman.id_lokasi, d.idLokasi), eq(lokasi_pengiriman.id_pelanggan, d.idPelanggan)),
    }),
    db.query.barang.findMany({
      where: inArray(
        barang.id_barang,
        d.baris.map((b) => b.idBarang),
      ),
    }),
  ]);
  if (!plg)
    return {
      gagal: { galat: "Pelanggan tidak ditemukan.", isian: { idPelanggan: "Pilih pelanggan dari data master." } },
    } as const;
  if (!lok)
    return {
      gagal: { galat: "Lokasi tidak sesuai.", isian: { idLokasi: "Pilih lokasi milik pelanggan ini." } },
    } as const;
  const peta = new Map(brg.map((b) => [b.id_barang, b]));
  const hilang = d.baris.findIndex((b) => !peta.has(b.idBarang));
  if (hilang >= 0)
    return {
      gagal: {
        galat: "Barang tidak ditemukan.",
        isian: { [`baris.${hilang}.idBarang`]: "Pilih barang dari data master." },
      },
    } as const;

  const { subtotal, ppn, total } = hitungTotalPesanan(
    d.baris.map((b) => ({ jumlah: b.jumlah, hargaSatuan: b.hargaSatuan })),
    d.termasukPpn,
  );
  return {
    d,
    plg,
    lok,
    peta,
    nilai: {
      nomor_surat_pemesanan: d.nomorSp,
      tanggal_po: d.tanggalPo,
      id_pelanggan: plg.id_pelanggan,
      nama_pelanggan: plg.nama_perusahaan,
      alamat_pelanggan: plg.alamat,
      rujukan_penawaran: d.rujukan || null,
      id_lokasi: lok.id_lokasi,
      lokasi_pengiriman: teksLokasi(lok.nama_lokasi, lok.alamat),
      ketentuan_pembayaran: d.ketentuan || null,
      tanggal_jatuh_tempo: d.jatuhTempo,
      termasuk_ppn: d.termasukPpn,
      subtotal,
      ppn,
      total,
      jenis_barang: d.baris.map((b) => peta.get(b.idBarang)?.nama).join(", "),
      jumlah_pesanan: Math.round(d.baris.reduce((s, b) => s + b.jumlah, 0)),
    },
  } as const;
}

function barisBarang(
  idPesanan: string,
  d: z.output<typeof skemaPesanan>,
  peta: Map<string, typeof barang.$inferSelect>,
) {
  return d.baris.map((b, i) => {
    const m = peta.get(b.idBarang) as typeof barang.$inferSelect;
    return {
      id_pesanan_barang: `${idPesanan}-B${i + 1}-${crypto.randomUUID().slice(0, 6)}`,
      id_pesanan: idPesanan,
      id_barang: m.id_barang,
      urutan: i + 1,
      kode_barang: m.kode_barang,
      nama_barang: m.nama,
      spesifikasi: m.spesifikasi,
      satuan: m.satuan,
      jumlah: b.jumlah,
      harga_satuan: b.hargaSatuan,
      subtotal: Math.round(b.jumlah * b.hargaSatuan),
    };
  });
}

export async function simpanPesananBaru(input: InputPesanan): Promise<Hasil<{ id: string }>> {
  const p = await wajibAkses("pesanan", "T");
  const s = await siapkan(input);
  if ("gagal" in s) return s.gagal ?? {};
  const id = await nomorBerikutnya(s.d.tanggalPo.slice(0, 4));
  await db.transaction(async (tx) => {
    await tx.insert(pesanan).values({ id_pesanan: id, ...s.nilai, status_produksi: "Dalam Proses", dibuat_oleh: p.id });
    await tx.insert(pesanan_barang).values(barisBarang(id, s.d, s.peta));
    await tx.insert(riwayat_produksi).values({
      id_riwayat: crypto.randomUUID(),
      id_pesanan: id,
      status: "Dalam Proses",
      catatan: "Status awal saat PO dicatat.",
      diubah_oleh: p.id,
    });
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: `Pesanan ${id} tersimpan.`, data: { id } };
}

export async function ubahPesanan(id: string, input: InputPesanan): Promise<Hasil<{ id: string }>> {
  await wajibAkses("pesanan", "U");
  const lama = await db.query.pesanan.findFirst({
    where: and(eq(pesanan.id_pesanan, id), isNull(pesanan.dihapus_pada)),
    with: { faktur: { where: isNull(faktur.dihapus_pada), columns: { id_faktur: true } } },
  });
  if (!lama) return { galat: "Pesanan tidak ditemukan atau sudah dihapus." };
  const s = await siapkan(input);
  if ("gagal" in s) return s.gagal ?? {};

  // Setelah ada Nota Faktur, barang dan total terkunci agar nota tetap cocok dengan PO.
  const terkunci = lama.faktur.length > 0;
  await db.transaction(async (tx) => {
    if (terkunci) {
      const {
        subtotal: _s,
        ppn: _p,
        total: _t,
        termasuk_ppn: _ppn,
        jenis_barang: _j,
        jumlah_pesanan: _q,
        ...kepala
      } = s.nilai;
      await tx.update(pesanan).set(kepala).where(eq(pesanan.id_pesanan, id));
      return;
    }
    await tx.update(pesanan).set(s.nilai).where(eq(pesanan.id_pesanan, id));
    await tx.delete(pesanan_barang).where(eq(pesanan_barang.id_pesanan, id));
    await tx.insert(pesanan_barang).values(barisBarang(id, s.d, s.peta));
  });
  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    pesan: terkunci
      ? `Perubahan ${id} tersimpan. Barang tidak diubah karena sudah ada Nota Faktur.`
      : `Perubahan ${id} tersimpan.`,
    data: { id },
  };
}

export async function hapusPesanan(id: string): Promise<Hasil> {
  await wajibAkses("pesanan", "H");
  const lama = await db.query.pesanan.findFirst({
    where: and(eq(pesanan.id_pesanan, id), isNull(pesanan.dihapus_pada)),
  });
  if (!lama) return { galat: "Pesanan tidak ditemukan atau sudah dihapus." };
  await db.update(pesanan).set({ dihapus_pada: new Date() }).where(eq(pesanan.id_pesanan, id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, pesan: `Pesanan ${id} dihapus dari daftar. Datanya tetap tersimpan.` };
}
