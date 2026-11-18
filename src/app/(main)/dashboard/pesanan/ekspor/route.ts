import type { NextRequest } from "next/server";

import { boleh } from "@/lib/akses";
import { bacaSesi } from "@/server/auth/sesi";
import { cocok, muatPesanan } from "@/server/data/pesanan";

const sel = (v: string | number | null | undefined) => {
  const t = String(v ?? "");
  return /[",;\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t;
};

// Ekspor daftar pesanan sesuai pencarian dan filter yang sedang aktif (CSV, dibuka di Excel).
export async function GET(req: NextRequest) {
  const p = await bacaSesi();
  if (!p || !boleh(p.peran, "pesanan")) return new Response("Akses ditolak", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const fT = sp.getAll("tagihan");
  const fP = sp.getAll("produksi");
  const fK = sp.getAll("kirim");
  const lihatTagihan = boleh(p.peran, "tagihan");

  const rows = (await muatPesanan()).filter(
    (x) =>
      cocok(x, q) &&
      (fT.length === 0 || fT.includes(x.statusTagihan)) &&
      (fP.length === 0 || fP.includes(x.produksi)) &&
      (fK.length === 0 || fK.includes(x.statusKirim)),
  );

  const kepala = ["No. PO", "No. Surat Pemesanan", "Pelanggan", "Tanggal PO", "Jatuh Tempo", "Total"];
  if (lihatTagihan) kepala.push("Status Tagihan", "Sisa Tagihan");
  kepala.push("Produksi", "Pengiriman");
  const isi = rows.map((x) => {
    const r: (string | number | null)[] = [x.id, x.nomorSp, x.pelanggan, x.tanggalPo, x.jatuhTempo, x.total];
    if (lihatTagihan) r.push(x.statusTagihan, x.tagihan.sisa);
    r.push(x.produksi, x.statusKirim);
    return r.map(sel).join(";");
  });
  const csv = `﻿${[kepala.join(";"), ...isi].join("\r\n")}`;
  const tgl = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="daftar-pesanan-${tgl}.csv"`,
    },
  });
}
