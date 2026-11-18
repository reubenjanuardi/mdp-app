import "server-only";

import { isNotNull } from "drizzle-orm";

import { db } from "@/server/db";
import { pengiriman } from "@/server/db/schema";

import { namaPengguna } from "./detail";
import { muatPesanan } from "./pesanan";

/** Semua pengiriman beserta urutan ke- per pesanan, ditambah pesanan yang belum dikirim (UC-08). */
export async function daftarPengiriman() {
  const [semua, nama] = await Promise.all([muatPesanan(), namaPengguna()]);
  type Pesanan = (typeof semua)[number];
  type Kirim = Pesanan["pengiriman"][number];
  type Baris =
    | { jenis: "kosong"; pesanan: Pesanan }
    | { jenis: "kirim"; pesanan: Pesanan; kirim: Kirim; ke: number; pencatat: string | null };
  const baris: Baris[] = semua.flatMap((p): Baris[] =>
    p.pengiriman.length === 0
      ? [{ jenis: "kosong", pesanan: p }]
      : p.pengiriman.map((k, i) => ({
          jenis: "kirim",
          pesanan: p,
          kirim: k,
          ke: i + 1,
          pencatat: k.dicatat_oleh ? (nama.get(k.dicatat_oleh)?.nama ?? null) : null,
        })),
  );
  return baris;
}

export type BarisPengiriman = Awaited<ReturnType<typeof daftarPengiriman>>[number];

export async function namaEkspedisi() {
  const rows = await db
    .selectDistinct({ nama: pengiriman.ekspedisi })
    .from(pengiriman)
    .where(isNotNull(pengiriman.ekspedisi));
  return rows.map((r) => r.nama as string).sort();
}
