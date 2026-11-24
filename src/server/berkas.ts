import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { BATAS_UNGGAH, buatKunciBerkas, tipeDariIsi, tipeKonten } from "@/lib/berkas";

export { BATAS_UNGGAH, tipeKonten };

const AKAR = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
const driver = process.env.STORAGE_DRIVER ?? "local";

function bucketR2() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey)
    throw new Error("Konfigurasi storage S3/R2 belum lengkap.");
  return { endpoint, bucket, accessKeyId, secretAccessKey };
}

let clientR2: S3Client | undefined;
function r2() {
  const config = bucketR2();
  clientR2 ??= new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  return { client: clientR2, bucket: config.bucket };
}

/** Memeriksa isi file lalu menyimpan ke local atau bucket S3/R2 privat. Mengembalikan object key relatif. */
export async function simpanBerkas(file: File, folder: "pembayaran" | "pengiriman" | "faktur") {
  if (file.size === 0) throw new Error("File kosong.");
  if (file.size > BATAS_UNGGAH) throw new Error("Ukuran file melebihi 5 MB.");
  const isi = Buffer.from(await file.arrayBuffer());
  const ekstensi = tipeDariIsi(isi);
  if (!ekstensi) throw new Error("Format file harus PDF, JPG, atau PNG.");
  const key = buatKunciBerkas(folder, ekstensi);

  if (driver === "local") {
    const tujuan = path.join(AKAR, key);
    await mkdir(path.dirname(tujuan), { recursive: true });
    await writeFile(tujuan, isi);
  } else if (driver === "s3") {
    const { client, bucket } = r2();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: isi, ContentType: tipeKonten(key) ?? undefined }));
  } else {
    throw new Error("STORAGE_DRIVER harus local atau s3.");
  }
  return key;
}

export async function bacaBerkas(key: string) {
  if (driver === "local") {
    const tujuan = path.resolve(AKAR, key);
    if (!tujuan.startsWith(AKAR + path.sep)) return null;
    try {
      return await readFile(tujuan);
    } catch {
      return null;
    }
  }
  if (driver !== "s3") return null;
  try {
    const { client, bucket } = r2();
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return res.Body ? Buffer.from(await res.Body.transformToByteArray()) : null;
  } catch {
    return null;
  }
}

/** Hapus object bila insert transaksi DB gagal; error cleanup tidak boleh menutupi error utama. */
export async function hapusBerkas(key: string | null | undefined) {
  if (!key) return;
  try {
    if (driver === "local") {
      const tujuan = path.resolve(AKAR, key);
      if (tujuan.startsWith(AKAR + path.sep)) await rm(tujuan, { force: true });
    } else if (driver === "s3") {
      const { client, bucket } = r2();
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    }
  } catch {
    // Best-effort cleanup. Berkas bukti yang sudah direferensikan tidak pernah dihapus otomatis.
  }
}
