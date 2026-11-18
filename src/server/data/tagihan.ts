import "server-only";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/server/db";
import { faktur, faktur_barang, pesanan_barang } from "@/server/db/schema";

/** Sisa barang PO yang belum ditagihkan, per baris (untuk nota bertahap). */
export async function sisaPerBaris(idPesanan: string) {
  const baris = await db.query.pesanan_barang.findMany({
    where: eq(pesanan_barang.id_pesanan, idPesanan),
    orderBy: [asc(pesanan_barang.urutan)],
  });
  const nota = await db
    .select({ id: faktur.id_faktur })
    .from(faktur)
    .where(and(eq(faktur.id_pesanan, idPesanan), isNull(faktur.dihapus_pada)));
  const ditagih = nota.length
    ? await db.query.faktur_barang.findMany({
        where: inArray(
          faktur_barang.id_faktur,
          nota.map((n) => n.id),
        ),
      })
    : [];
  return baris.map((b) => {
    const sudah = ditagih
      .filter((x) => x.id_pesanan_barang === b.id_pesanan_barang)
      .reduce((s, x) => s + x.banyaknya, 0);
    return {
      id: b.id_pesanan_barang,
      kode: b.kode_barang,
      nama: b.nama_barang,
      satuan: b.satuan,
      harga: b.harga_satuan,
      jumlahPo: b.jumlah,
      sisa: Math.max(0, b.jumlah - sudah),
    };
  });
}
