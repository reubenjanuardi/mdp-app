"use server";

import { revalidatePath } from "next/cache";

import bcrypt from "bcryptjs";
import { eq, or, sql } from "drizzle-orm";
import { z } from "zod";

import { PERAN } from "@/lib/konstanta";
import { cabutSemuaSesi, wajibAkses } from "@/server/auth/sesi";
import { db } from "@/server/db";
import { pengguna } from "@/server/db/schema";

import type { Hasil } from "./hasil";

/** Password sementara 12 karakter tanpa huruf yang mirip (0/O, 1/l). Diganti pengguna saat login pertama. */
function passwordSementara() {
  const huruf = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const angka = "23456789";
  const semua = huruf + angka;
  const acak = crypto.getRandomValues(new Uint32Array(12));
  const hasil = Array.from(acak, (n) => semua[n % semua.length]);
  hasil[3] = angka[acak[3] % angka.length];
  hasil[8] = huruf[acak[8] % huruf.length];
  return hasil.join("");
}

const skema = z.object({
  nama: z.string().trim().min(1, "Nama lengkap wajib diisi.").max(120),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username minimal 3 karakter.")
    .max(40)
    .regex(/^[a-z0-9._-]+$/, "Gunakan huruf kecil, angka, titik, garis bawah, atau tanda hubung."),
  email: z.string().trim().toLowerCase().email("Isi email yang valid."),
  peran: z.enum(PERAN, { message: "Pilih peran." }),
});

/** US-17: username dan email unik; akun baru aktif dengan password sementara. */
export async function tambahPengguna(
  input: z.input<typeof skema>,
): Promise<Hasil<{ password: string; username: string }>> {
  await wajibAkses("pengguna", "T");
  const r = skema.safeParse(input);
  if (!r.success) {
    const e = r.error.flatten().fieldErrors;
    return {
      galat: "Lengkapi isian yang ditandai.",
      isian: { nama: e.nama?.[0], username: e.username?.[0], email: e.email?.[0], peran: e.peran?.[0] },
    };
  }
  const d = r.data;
  const ada = await db
    .select({ username: pengguna.username, email: pengguna.email })
    .from(pengguna)
    .where(or(eq(pengguna.username, d.username), sql`lower(${pengguna.email}) = ${d.email}`));
  const isian: Record<string, string> = {};
  if (ada.some((x) => x.username === d.username)) isian.username = "Username sudah terdaftar.";
  if (ada.some((x) => x.email?.toLowerCase() === d.email)) isian.email = "Email sudah terdaftar.";
  if (Object.keys(isian).length) return { galat: "Lengkapi isian yang ditandai.", isian };

  const password = passwordSementara();
  await db.insert(pengguna).values({
    id_pengguna: `USR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    nama: d.nama,
    username: d.username,
    email: d.email,
    peran: d.peran,
    password_hash: await bcrypt.hash(password, 10),
    wajib_ganti_password: true,
  });
  revalidatePath("/dashboard/pengguna");
  return { ok: true, pesan: `Akun ${d.username} dibuat.`, data: { password, username: d.username } };
}

/** US-16: Admin mengatur peran; sesi lama dicabut agar peran baru langsung berlaku. */
export async function ubahPeran(id: string, peran: string): Promise<Hasil> {
  const admin = await wajibAkses("pengguna", "U");
  const r = z.enum(PERAN).safeParse(peran);
  if (!r.success) return { galat: "Peran tidak valid." };
  if (id === admin.id) return { galat: "Peran akun Anda sendiri tidak dapat diubah." };
  const [u] = await db
    .update(pengguna)
    .set({ peran: r.data })
    .where(eq(pengguna.id_pengguna, id))
    .returning({ nama: pengguna.nama });
  if (!u) return { galat: "Pengguna tidak ditemukan." };
  await cabutSemuaSesi(id);
  revalidatePath("/dashboard/pengguna");
  return { ok: true, pesan: `Peran ${u.nama} menjadi ${r.data}. Pengguna perlu login ulang.` };
}

export async function setAktif(id: string, aktif: boolean): Promise<Hasil> {
  const admin = await wajibAkses("pengguna", "U");
  if (id === admin.id) return { galat: "Admin tidak dapat menonaktifkan akunnya sendiri." };
  const [u] = await db
    .update(pengguna)
    .set({ aktif })
    .where(eq(pengguna.id_pengguna, id))
    .returning({ nama: pengguna.nama });
  if (!u) return { galat: "Pengguna tidak ditemukan." };
  if (!aktif) await cabutSemuaSesi(id);
  revalidatePath("/dashboard/pengguna");
  return {
    ok: true,
    pesan: aktif ? `${u.nama} diaktifkan kembali.` : `${u.nama} dinonaktifkan dan tidak dapat login.`,
  };
}

export async function resetPassword(id: string): Promise<Hasil<{ password: string; username: string }>> {
  const admin = await wajibAkses("pengguna", "U");
  if (id === admin.id) return { galat: "Ganti password akun Anda sendiri lewat menu akun." };
  const password = passwordSementara();
  const [u] = await db
    .update(pengguna)
    .set({ password_hash: await bcrypt.hash(password, 10), wajib_ganti_password: true })
    .where(eq(pengguna.id_pengguna, id))
    .returning({ username: pengguna.username, nama: pengguna.nama });
  if (!u?.username) return { galat: "Pengguna tidak ditemukan." };
  await cabutSemuaSesi(id);
  revalidatePath("/dashboard/pengguna");
  return { ok: true, pesan: `Password ${u.nama} direset.`, data: { password, username: u.username } };
}
