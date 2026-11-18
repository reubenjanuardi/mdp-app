import type { NextRequest } from "next/server";

import { and, eq } from "drizzle-orm";

import { boleh } from "@/lib/akses";
import { bacaSesi } from "@/server/auth/sesi";
import { bacaBerkas, tipeKonten } from "@/server/berkas";
import { db } from "@/server/db";
import { faktur, pembayaran, pengiriman } from "@/server/db/schema";

// Berkas hanya dibuka lewat id record, dengan pemeriksaan hak akses modulnya (NFR-02, NFR-07).
export async function GET(_req: NextRequest, ctx: { params: Promise<{ jenis: string; id: string }> }) {
  const p = await bacaSesi();
  if (!p) return new Response("Silakan masuk terlebih dahulu.", { status: 401 });
  const { jenis, id } = await ctx.params;

  let rel: string | null = null;
  let nama: string | null = null;
  if (jenis === "pembayaran" && boleh(p.peran, "pembayaran")) {
    const b = await db.query.pembayaran.findFirst({ where: and(eq(pembayaran.id_pembayaran, id)) });
    rel = b?.bukti_pembayaran ?? null;
    nama = b?.nama_file_bukti ?? null;
  } else if (jenis === "faktur" && boleh(p.peran, "tagihan")) {
    const f = await db.query.faktur.findFirst({ where: eq(faktur.id_faktur, id) });
    rel = f?.lampiran ?? null;
    nama = f?.nama_file_lampiran ?? null;
  } else if (jenis === "pengiriman" && boleh(p.peran, "pengiriman")) {
    const k = await db.query.pengiriman.findFirst({ where: eq(pengiriman.id_pengiriman, id) });
    rel = k?.dokumen ?? null;
    nama = k?.nama_file_dokumen ?? null;
  } else {
    return new Response("Akses ditolak.", { status: 403 });
  }

  if (!rel) return new Response("Berkas tidak ditemukan.", { status: 404 });
  const isi = await bacaBerkas(rel);
  const tipe = tipeKonten(rel);
  if (!isi || !tipe) return new Response("Berkas tidak ditemukan.", { status: 404 });
  return new Response(new Uint8Array(isi), {
    headers: {
      "Content-Type": tipe,
      "Content-Disposition": `inline; filename="${(nama ?? rel.split("/").pop() ?? "berkas").replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
