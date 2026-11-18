import "server-only";

import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { and, eq, gt, isNull } from "drizzle-orm";

import { type Aksi, boleh, type Modul } from "@/lib/akses";
import { db } from "@/server/db";
import { type Peran, pengguna, sesi } from "@/server/db/schema";

import {
  ACCESS_COOKIE,
  ACCESS_TTL_DETIK,
  bacaAccessToken,
  buatAccessToken,
  buatRefreshToken,
  opsiCookie,
  REFRESH_COOKIE,
  REFRESH_TTL_DETIK,
} from "./token";

export type PenggunaAktif = {
  id: string;
  nama: string;
  username: string;
  email: string | null;
  peran: Peran;
  idSesi: string;
  wajibGantiPassword: boolean;
};

/** Sesi aktif dibaca sekali per render. Mengembalikan null bila token, sesi, atau akun tidak berlaku. */
export const bacaSesi = cache(async (): Promise<PenggunaAktif | null> => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const payload = await bacaAccessToken(token);
  if (!payload) return null;

  const [baris] = await db
    .select({
      id: pengguna.id_pengguna,
      nama: pengguna.nama,
      username: pengguna.username,
      email: pengguna.email,
      peran: pengguna.peran,
      aktif: pengguna.aktif,
      wajib: pengguna.wajib_ganti_password,
    })
    .from(pengguna)
    .innerJoin(sesi, eq(sesi.id_pengguna, pengguna.id_pengguna))
    .where(
      and(
        eq(pengguna.id_pengguna, payload.sub),
        eq(sesi.id_sesi, payload.sid),
        isNull(sesi.dicabut_pada),
        gt(sesi.kedaluwarsa_pada, new Date()),
      ),
    )
    .limit(1);

  if (!baris?.aktif || !baris.peran || !baris.username) return null;
  return {
    id: baris.id,
    nama: baris.nama,
    username: baris.username,
    email: baris.email,
    peran: baris.peran,
    idSesi: payload.sid,
    wajibGantiPassword: baris.wajib,
  };
});

export async function wajibLogin() {
  const p = await bacaSesi();
  if (!p) redirect("/login");
  if (p.wajibGantiPassword) redirect("/ganti-password");
  return p;
}

/** Menolak halaman atau aksi di luar hak akses peran (NFR-02), termasuk saat URL dibuka langsung. */
export async function wajibAkses(modul: Modul, aksi: Aksi = "L") {
  const p = await wajibLogin();
  if (!boleh(p.peran, modul, aksi)) redirect("/unauthorized");
  return p;
}

export async function mulaiSesi(idPengguna: string, peran: Peran) {
  const idSesi = crypto.randomUUID();
  await db.insert(sesi).values({
    id_sesi: idSesi,
    id_pengguna: idPengguna,
    kedaluwarsa_pada: new Date(Date.now() + REFRESH_TTL_DETIK * 1000),
  });
  const [access, refresh] = await Promise.all([
    buatAccessToken({ sub: idPengguna, peran, sid: idSesi }),
    buatRefreshToken({ sub: idPengguna, sid: idSesi }),
  ]);
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, access, opsiCookie(ACCESS_TTL_DETIK));
  jar.set(REFRESH_COOKIE, refresh, opsiCookie(REFRESH_TTL_DETIK));
}

export async function akhiriSesi() {
  const p = await bacaSesi();
  if (p) await db.update(sesi).set({ dicabut_pada: new Date() }).where(eq(sesi.id_sesi, p.idSesi));
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** Dipakai saat akun dinonaktifkan: semua sesinya dicabut. */
export async function cabutSemuaSesi(idPengguna: string) {
  await db
    .update(sesi)
    .set({ dicabut_pada: new Date() })
    .where(and(eq(sesi.id_pengguna, idPengguna), isNull(sesi.dicabut_pada)));
}
