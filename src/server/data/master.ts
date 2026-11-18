import "server-only";

import { asc, isNull } from "drizzle-orm";

import { teksLokasi } from "@/lib/format";
import { db } from "@/server/db";
import { barang, lokasi_pengiriman, pelanggan } from "@/server/db/schema";

export async function daftarPelanggan() {
  return db.query.pelanggan.findMany({
    where: isNull(pelanggan.dihapus_pada),
    orderBy: [asc(pelanggan.nama_perusahaan)],
    with: { lokasi: { where: isNull(lokasi_pengiriman.dihapus_pada), orderBy: [asc(lokasi_pengiriman.dibuat_pada)] } },
  });
}

export async function daftarBarang() {
  return db.query.barang.findMany({ where: isNull(barang.dihapus_pada), orderBy: [asc(barang.kode_barang)] });
}

export type OpsiPelanggan = { id: string; nama: string; lokasi: { id: string; alamat: string }[] };
export type OpsiBarang = {
  id: string;
  kode: string;
  nama: string;
  spesifikasi: string | null;
  satuan: string;
  harga: number;
};

export async function opsiMaster(): Promise<{ pelanggan: OpsiPelanggan[]; barang: OpsiBarang[] }> {
  const [p, b] = await Promise.all([daftarPelanggan(), daftarBarang()]);
  return {
    pelanggan: p.map((x) => ({
      id: x.id_pelanggan,
      nama: x.nama_perusahaan,
      lokasi: x.lokasi.map((l) => ({ id: l.id_lokasi, alamat: teksLokasi(l.nama_lokasi, l.alamat) })),
    })),
    barang: b.map((x) => ({
      id: x.id_barang,
      kode: x.kode_barang,
      nama: x.nama,
      spesifikasi: x.spesifikasi,
      satuan: x.satuan,
      harga: x.harga_acuan,
    })),
  };
}
