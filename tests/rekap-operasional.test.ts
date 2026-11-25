import assert from "node:assert/strict";
import { test } from "node:test";

import { angkaRekap, hitungTotalRekap } from "../src/lib/rekap-operasional";

test("angka rekap menerima format angka Excel Indonesia", () => {
  assert.equal(angkaRekap("1.500.000"), 1_500_000);
  assert.equal(angkaRekap(" 500000 "), 500_000);
  assert.equal(angkaRekap(""), null);
  assert.equal(angkaRekap("bukan angka"), null);
});

test("total pengiriman dihitung dari jumlah dan harga bila total tidak diisi", () => {
  assert.equal(hitungTotalRekap(25, 20_000, null), 500_000);
  assert.equal(hitungTotalRekap(25, 20_000, 490_000), 490_000);
});
