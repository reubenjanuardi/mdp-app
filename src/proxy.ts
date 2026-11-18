import { type NextRequest, NextResponse } from "next/server";

import { and, eq, gt, isNull } from "drizzle-orm";

import {
  ACCESS_COOKIE,
  ACCESS_TTL_DETIK,
  bacaAccessToken,
  bacaRefreshToken,
  buatAccessToken,
  opsiCookie,
  REFRESH_COOKIE,
} from "@/server/auth/token";
import { db } from "@/server/db";
import { pengguna, sesi } from "@/server/db/schema";

// Access token berlaku 1 jam. Bila habis, proxy menerbitkan yang baru dari refresh token (1 bulan)
// selama sesinya belum dicabut dan akunnya masih aktif. Bila refresh token juga habis, pengguna login ulang.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const halamanLogin = pathname === "/login";

  // Halaman login selalu dirender; halaman itu sendiri memeriksa sesi ke basis data, sehingga token yang
  // sesinya sudah dicabut tidak menimbulkan redirect berulang antara /login dan /dashboard.
  if (halamanLogin) return NextResponse.next();

  if (await bacaAccessToken(req.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();

  const refresh = await bacaRefreshToken(req.cookies.get(REFRESH_COOKIE)?.value);
  if (refresh) {
    const [baris] = await db
      .select({ peran: pengguna.peran, aktif: pengguna.aktif })
      .from(sesi)
      .innerJoin(pengguna, eq(pengguna.id_pengguna, sesi.id_pengguna))
      .where(
        and(
          eq(sesi.id_sesi, refresh.sid),
          eq(sesi.id_pengguna, refresh.sub),
          isNull(sesi.dicabut_pada),
          gt(sesi.kedaluwarsa_pada, new Date()),
        ),
      )
      .limit(1);

    if (baris?.aktif && baris.peran) {
      const access = await buatAccessToken({ sub: refresh.sub, peran: baris.peran, sid: refresh.sid });
      // Cookie baru diteruskan ke request ini juga, agar Server Component langsung membaca token yang berlaku.
      req.cookies.set(ACCESS_COOKIE, access);
      const res = NextResponse.next({ request: { headers: req.headers } });
      res.cookies.set(ACCESS_COOKIE, access, opsiCookie(ACCESS_TTL_DETIK));
      return res;
    }
  }

  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}

export const config = {
  // Semua halaman kecuali aset statis dan berkas unggahan publik.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|brand/|robots.txt).*)"],
};
