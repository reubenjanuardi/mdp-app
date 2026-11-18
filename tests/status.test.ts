import { hitungTagihan, hitungTotalPesanan, penandaJatuhTempo, statusPengirimanPesanan } from "../src/lib/status";
import assert from "node:assert/strict";
import { test } from "node:test";

const T = (status: "Menunggu Verifikasi" | "Terverifikasi", nominal: number) => ({ status, nominal });

test("status tagihan dari pembayaran terverifikasi", () => {
  const dasar = { total: 1000, jatuhTempo: "2026-11-30", hariIni: "2026-11-18" };
  assert.equal(hitungTagihan({ ...dasar, pembayaran: [] }).status, "Belum Bayar");
  assert.equal(hitungTagihan({ ...dasar, pembayaran: [T("Menunggu Verifikasi", 1000)] }).status, "Belum Bayar");
  assert.equal(hitungTagihan({ ...dasar, pembayaran: [T("Terverifikasi", 400)] }).status, "Sebagian");
  const lunas = hitungTagihan({ ...dasar, pembayaran: [T("Terverifikasi", 400), T("Terverifikasi", 600)] });
  assert.equal(lunas.status, "Lunas");
  assert.equal(lunas.sisa, 0);
  const lebih = hitungTagihan({ ...dasar, pembayaran: [T("Terverifikasi", 1200)] });
  assert.equal(lebih.status, "Lunas");
  assert.equal(lebih.lebihBayar, 200);
});

test("Belum Bayar dan Sebagian lewat jatuh tempo menjadi Terlambat, Lunas tidak", () => {
  const lewat = { total: 1000, jatuhTempo: "2026-11-10", hariIni: "2026-11-18" };
  assert.equal(hitungTagihan({ ...lewat, pembayaran: [] }).status, "Terlambat");
  assert.equal(hitungTagihan({ ...lewat, pembayaran: [T("Terverifikasi", 500)] }).status, "Terlambat");
  assert.equal(hitungTagihan({ ...lewat, pembayaran: [T("Terverifikasi", 1000)] }).status, "Lunas");
  assert.equal(hitungTagihan({ ...lewat, jatuhTempo: "2026-11-18", pembayaran: [] }).status, "Belum Bayar");
});

test("koreksi manual menimpa status otomatis", () => {
  const r = hitungTagihan({ total: 1000, jatuhTempo: null, hariIni: "2026-11-18", pembayaran: [], koreksi: "Lunas" });
  assert.equal(r.status, "Lunas");
  assert.equal(r.dikoreksi, true);
});

test("penanda jatuh tempo", () => {
  assert.equal(penandaJatuhTempo("2026-11-22", "2026-11-18"), null);
  assert.equal(penandaJatuhTempo("2026-11-21", "2026-11-18"), "H-3");
  assert.equal(penandaJatuhTempo("2026-11-20", "2026-11-18"), "H-2");
  assert.equal(penandaJatuhTempo("2026-11-19", "2026-11-18"), "H-1");
  assert.equal(penandaJatuhTempo("2026-11-18", "2026-11-18"), "H-0");
  assert.equal(penandaJatuhTempo("2026-11-17", "2026-11-18"), "Terlambat");
});

test("total PO dengan dan tanpa PPN 11%", () => {
  const baris = [
    { jumlah: 1_000_000, hargaSatuan: 38 },
    { jumlah: 200_000, hargaSatuan: 30 },
  ];
  assert.deepEqual(hitungTotalPesanan(baris, true), { subtotal: 44_000_000, ppn: 4_840_000, total: 48_840_000 });
  assert.deepEqual(hitungTotalPesanan(baris, false), { subtotal: 44_000_000, ppn: 0, total: 44_000_000 });
});

test("status pengiriman pesanan", () => {
  assert.equal(statusPengirimanPesanan([]), "Belum Dikirim");
  assert.equal(statusPengirimanPesanan(["Selesai", "Dalam Kirim"]), "Dalam Kirim");
  assert.equal(statusPengirimanPesanan(["Selesai", "Selesai"]), "Selesai");
});
