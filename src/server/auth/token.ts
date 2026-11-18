// Dipakai oleh proxy.ts dan server; tanpa "server-only" karena proxy ikut mengimpornya.
import { jwtVerify, SignJWT } from "jose";

import type { Peran } from "@/server/db/schema";

export const ACCESS_COOKIE = "mdp_access";
export const REFRESH_COOKIE = "mdp_refresh";
export const ACCESS_TTL_DETIK = 60 * 60; // 1 jam (PRD 8.3 no. 9)
export const REFRESH_TTL_DETIK = 60 * 60 * 24 * 30; // 1 bulan

export type AccessPayload = { sub: string; peran: Peran; sid: string };
export type RefreshPayload = { sub: string; sid: string };

function kunci(nama: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET") {
  const nilai = process.env[nama];
  if (!nilai || nilai.length < 32) throw new Error(`${nama} belum diatur atau kurang dari 32 karakter.`);
  return new TextEncoder().encode(nilai);
}

export async function buatAccessToken(p: AccessPayload) {
  return new SignJWT({ peran: p.peran, sid: p.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_DETIK}s`)
    .sign(kunci("JWT_ACCESS_SECRET"));
}

export async function buatRefreshToken(p: RefreshPayload) {
  return new SignJWT({ sid: p.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_DETIK}s`)
    .sign(kunci("JWT_REFRESH_SECRET"));
}

export async function bacaAccessToken(token: string | undefined): Promise<AccessPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci("JWT_ACCESS_SECRET"), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.sid !== "string" || typeof payload.peran !== "string") return null;
    return { sub: payload.sub, sid: payload.sid, peran: payload.peran as Peran };
  } catch {
    return null;
  }
}

export async function bacaRefreshToken(token: string | undefined): Promise<RefreshPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci("JWT_REFRESH_SECRET"), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.sid !== "string") return null;
    return { sub: payload.sub, sid: payload.sid };
  } catch {
    return null;
  }
}

export function opsiCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
