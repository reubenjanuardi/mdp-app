import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const BATAS_UNGGAH = 5 * 1024 * 1024; // 5 MB per file (PRD 8.4)
export const TIPE_DIIZINKAN: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const AKAR = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");

/** Memeriksa tipe dari isi file (bukan nama) lalu menyimpannya dengan nama acak. Mengembalikan path relatif. */
export async function simpanBerkas(file: File, folder: "pembayaran" | "pengiriman" | "faktur") {
  if (file.size === 0) throw new Error("File kosong.");
  if (file.size > BATAS_UNGGAH) throw new Error("Ukuran file melebihi 5 MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const ekst = tipeDariIsi(buf);
  if (!ekst) throw new Error("Format file harus PDF, JPG, atau PNG.");
  const rel = `${folder}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ekst}`;
  const tujuan = path.join(AKAR, rel);
  await mkdir(path.dirname(tujuan), { recursive: true });
  await writeFile(tujuan, buf);
  return rel;
}

function tipeDariIsi(b: Buffer) {
  if (b.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  return null;
}

export async function bacaBerkas(rel: string) {
  const tujuan = path.resolve(AKAR, rel);
  // Menolak path yang keluar dari folder unggahan.
  if (!tujuan.startsWith(AKAR + path.sep)) return null;
  try {
    return await readFile(tujuan);
  } catch {
    return null;
  }
}

export function tipeKonten(rel: string) {
  const e = rel.split(".").pop()?.toLowerCase();
  return e === "pdf"
    ? "application/pdf"
    : e === "png"
      ? "image/png"
      : e === "jpg" || e === "jpeg"
        ? "image/jpeg"
        : null;
}
