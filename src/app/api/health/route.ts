import { sql } from "drizzle-orm";

import { db } from "@/server/db";

// Dipakai healthcheck Docker Compose dan smoke test setelah deploy.
// Selalu 200 selama proses Next hidup; status basis data dilaporkan terpisah.
export const dynamic = "force-dynamic";

export async function GET() {
  let basisData = "ok";
  try {
    await db.execute(sql`select 1`);
  } catch {
    basisData = "gagal";
  }

  return Response.json(
    {
      status: "ok",
      basisData,
      waktu: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
