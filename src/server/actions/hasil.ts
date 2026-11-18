/** Bentuk hasil Server Action yang dipakai semua form: pesan sukses/gagal dan galat per isian (NFR-05). */
export type Hasil<T = undefined> = {
  ok?: boolean;
  pesan?: string;
  galat?: string;
  isian?: Record<string, string | undefined>;
  data?: T;
};

export function galatZod(e: { issues: readonly { path: PropertyKey[]; message: string }[] }) {
  const isian: Record<string, string> = {};
  for (const i of e.issues) {
    const k = i.path.map(String).join(".");
    if (!isian[k]) isian[k] = i.message;
  }
  const jumlah = Object.keys(isian).length;
  return {
    galat: `Lengkapi ${jumlah} isian yang ditandai di bawah.`,
    isian,
  };
}
