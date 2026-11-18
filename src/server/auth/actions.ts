"use server";

import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

import { halamanAwal } from "@/lib/akses";
import { db } from "@/server/db";
import { pengguna } from "@/server/db/schema";

import { akhiriSesi, bacaSesi, mulaiSesi } from "./sesi";

export type StatusMasuk = { gagal?: string; isian?: { identitas?: string; password?: string }; identitas?: string };

const skema = z.object({
  identitas: z.string().trim().min(1, "Username atau email wajib diisi."),
  password: z.string().min(1, "Password wajib diisi."),
});

// Hash pembanding agar waktu respons sama ketika username tidak ditemukan.
const HASH_PALSU = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.0Z5RQl1EoZr0o7fVbQx9OaZr5mI6";

export async function masuk(_: StatusMasuk, form: FormData): Promise<StatusMasuk> {
  const hasil = skema.safeParse({ identitas: form.get("identitas"), password: form.get("password") });
  const identitas = String(form.get("identitas") ?? "");
  if (!hasil.success) {
    const e = hasil.error.flatten().fieldErrors;
    return { isian: { identitas: e.identitas?.[0], password: e.password?.[0] }, identitas };
  }

  const nilai = hasil.data.identitas.toLowerCase();
  const [akun] = await db
    .select()
    .from(pengguna)
    .where(or(eq(pengguna.username, nilai), eq(pengguna.email, nilai)))
    .limit(1);

  const cocok = await bcrypt.compare(hasil.data.password, akun?.password_hash ?? HASH_PALSU);
  // Pesan sama untuk akun tidak ada, password salah, dan akun nonaktif (US-15).
  if (!akun || !cocok || !akun.aktif || !akun.peran) {
    return { gagal: "Username, email, atau password tidak sesuai.", identitas };
  }

  await mulaiSesi(akun.id_pengguna, akun.peran);
  redirect(akun.wajib_ganti_password ? "/ganti-password" : halamanAwal(akun.peran));
}

export type StatusGanti = { galat?: string; isian?: { lama?: string; baru?: string; ulang?: string } };

const skemaGanti = z
  .object({
    lama: z.string().min(1, "Isi password sementara atau password lama."),
    baru: z
      .string()
      .min(10, "Password baru minimal 10 karakter.")
      .regex(/[A-Za-z]/, "Password baru harus memuat huruf.")
      .regex(/\d/, "Password baru harus memuat angka."),
    ulang: z.string(),
  })
  .refine((d) => d.baru === d.ulang, { path: ["ulang"], message: "Ulangi password baru dengan sama persis." })
  .refine((d) => d.baru !== d.lama, { path: ["baru"], message: "Password baru harus berbeda dari password lama." });

export async function gantiPassword(_: StatusGanti, form: FormData): Promise<StatusGanti> {
  const p = await bacaSesi();
  if (!p) redirect("/login");
  const r = skemaGanti.safeParse({ lama: form.get("lama"), baru: form.get("baru"), ulang: form.get("ulang") });
  if (!r.success) {
    const e = r.error.flatten().fieldErrors;
    return { isian: { lama: e.lama?.[0], baru: e.baru?.[0], ulang: e.ulang?.[0] } };
  }
  const [akun] = await db.select().from(pengguna).where(eq(pengguna.id_pengguna, p.id)).limit(1);
  if (!akun?.password_hash || !(await bcrypt.compare(r.data.lama, akun.password_hash))) {
    return { isian: { lama: "Password lama tidak sesuai." } };
  }
  await db
    .update(pengguna)
    .set({ password_hash: await bcrypt.hash(r.data.baru, 10), wajib_ganti_password: false })
    .where(eq(pengguna.id_pengguna, p.id));
  redirect(halamanAwal(p.peran));
}

export async function keluar() {
  await akhiriSesi();
  redirect("/login");
}
