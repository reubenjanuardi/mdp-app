import assert from "node:assert/strict";
import { test } from "node:test";

import { buatKunciBerkas, tipeDariIsi } from "../src/lib/berkas";

test("kunci berkas dibatasi folder valid dan nama acak", () => {
  const key = buatKunciBerkas("pembayaran", "pdf", new Date("2026-11-24T12:00:00Z"));
  assert.match(key, /^pembayaran\/2026-11\/[0-9a-f-]{36}\.pdf$/);
  assert.throws(() => buatKunciBerkas("../rahasia" as "pembayaran", "pdf"), /Folder berkas tidak valid/);
});

test("tipe berkas ditentukan dari byte, bukan nama upload", () => {
  assert.equal(tipeDariIsi(Buffer.from("%PDF-1.7")), "pdf");
  assert.equal(tipeDariIsi(Buffer.from([0xff, 0xd8, 0xff, 0x00])), "jpg");
  assert.equal(tipeDariIsi(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "png");
  assert.equal(tipeDariIsi(Buffer.from("bukan file valid")), null);
});
