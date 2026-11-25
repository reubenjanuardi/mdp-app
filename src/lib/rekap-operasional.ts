export function angkaRekap(nilai: string | number | null | undefined) {
  if (nilai == null || nilai === "") return null;
  const hasil = typeof nilai === "number" ? nilai : Number(nilai.replace(/\./g, "").replace(",", ".").trim());
  return Number.isFinite(hasil) ? hasil : null;
}

export function hitungTotalRekap(jumlah: number | null, harga: number | null, total: number | null) {
  return total ?? (jumlah != null && harga != null ? jumlah * harga : null);
}
