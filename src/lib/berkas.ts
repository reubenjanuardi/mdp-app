export const BATAS_UNGGAH = 5 * 1024 * 1024;

const FOLDER_BERKAS = ["pembayaran", "pengiriman", "faktur"] as const;
type FolderBerkas = (typeof FOLDER_BERKAS)[number];
type EkstensiBerkas = "pdf" | "jpg" | "png";

export function tipeDariIsi(b: Buffer): EkstensiBerkas | null {
  if (b.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  return null;
}

export function buatKunciBerkas(folder: FolderBerkas, ekstensi: EkstensiBerkas, waktu = new Date()) {
  if (!FOLDER_BERKAS.includes(folder)) throw new Error("Folder berkas tidak valid.");
  return `${folder}/${waktu.toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ekstensi}`;
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
