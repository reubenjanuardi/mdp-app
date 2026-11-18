"use server";

import { wajibLogin } from "@/server/auth/sesi";
import { cocok, muatPesanan } from "@/server/data/pesanan";

export type HasilCari = { id: string; pelanggan: string; nomorSp: string; cocokDengan: string | null };

export async function cariCepat(q: string): Promise<HasilCari[]> {
  await wajibLogin();
  const kata = q.trim().toLowerCase();
  if (kata.length < 2) return [];
  const semua = await muatPesanan();
  return semua
    .filter((p) => cocok(p, kata))
    .slice(0, 8)
    .map((p) => {
      const nota = p.nota.find((n) => n.nomor.toLowerCase().includes(kata))?.nomor;
      const kirim = p.pengiriman.find(
        (k) => k.nomor_resi?.toLowerCase().includes(kata) || k.nomor_tanda_terima?.toLowerCase().includes(kata),
      );
      return {
        id: p.id,
        pelanggan: p.pelanggan,
        nomorSp: p.nomorSp,
        cocokDengan: nota ?? kirim?.nomor_resi ?? kirim?.nomor_tanda_terima ?? null,
      };
    });
}
