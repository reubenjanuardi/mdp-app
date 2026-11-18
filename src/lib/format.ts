const ZONA = "Asia/Jakarta";

const rupiahFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const angkaFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** Rp48.840.000 (format yang dipakai di desain). */
export function rupiah(nilai: number) {
  const tanda = nilai < 0 ? "-" : "";
  return `${tanda}Rp${rupiahFormatter.format(Math.abs(Math.round(nilai)))}`;
}

/** Rp186,4 jt untuk kartu ringkasan. */
export function rupiahSingkat(nilai: number) {
  const abs = Math.abs(nilai);
  if (abs >= 1_000_000_000) return `Rp${angkaSingkat(nilai / 1_000_000_000)} M`;
  if (abs >= 1_000_000) return `Rp${angkaSingkat(nilai / 1_000_000)} jt`;
  return rupiah(nilai);
}

function angkaSingkat(nilai: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(nilai);
}

export function angka(nilai: number) {
  return angkaFormatter.format(nilai);
}

/** "2026-10-05" atau Date menjadi "05 Okt 2026". */
export function tanggal(nilai: string | Date | null | undefined) {
  if (!nilai) return "-";
  const d = typeof nilai === "string" ? new Date(`${nilai.slice(0, 10)}T00:00:00+07:00`) : nilai;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: ZONA })
    .format(d)
    .replace(".", "");
}

/** "05 Okt 2026, 14.32" */
export function tanggalJam(nilai: Date | string | null | undefined) {
  if (!nilai) return "-";
  const d = typeof nilai === "string" ? new Date(nilai) : nilai;
  const jam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }).format(d);
  return `${tanggal(d)}, ${jam}`;
}

/** Tanggal hari ini di zona Jakarta, format YYYY-MM-DD. */
export function hariIni(sekarang = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(sekarang);
}

/** Selisih hari kalender b - a (keduanya YYYY-MM-DD). */
export function selisihHari(a: string, b: string) {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function bulanTahun(nilai: string | Date) {
  const d = typeof nilai === "string" ? new Date(`${nilai.slice(0, 10)}T00:00:00+07:00`) : nilai;
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: ZONA }).format(d);
}

export function inisial(nama: string) {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}

/** "Gudang Cikarang, Kawasan Industri Jababeka Blok C-12"; nama saja bila alamat hanya nama kota yang sama. */
export function teksLokasi(nama: string, alamat: string) {
  return alamat && !nama.toLowerCase().endsWith(alamat.toLowerCase()) ? `${nama}, ${alamat}` : nama;
}
