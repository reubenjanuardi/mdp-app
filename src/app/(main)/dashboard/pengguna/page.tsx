import { desc, max } from "drizzle-orm";
import type { Metadata } from "next";

import { TableWrap, Td, Th } from "@/components/mdp/data-table";
import { SearchBox, SegmentFilter } from "@/components/mdp/list-toolbar";
import { PageHeader } from "@/components/mdp/page-header";
import { SectionCard } from "@/components/mdp/section-card";
import { LABEL_MODUL, MATRIKS, type Modul } from "@/lib/akses";
import { tanggalJam } from "@/lib/format";
import { PERAN } from "@/lib/konstanta";
import { wajibAkses } from "@/server/auth/sesi";
import { db } from "@/server/db";
import { pengguna, sesi } from "@/server/db/schema";

import { BarisPengguna } from "./baris-pengguna";
import { TambahPengguna } from "./tambah-pengguna";

export const metadata: Metadata = { title: "Manajemen Pengguna" };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; tab?: string }> }) {
  const admin = await wajibAkses("pengguna");
  const { q = "", tab = "" } = await searchParams;
  const [akun, login] = await Promise.all([
    db.select().from(pengguna).orderBy(desc(pengguna.aktif), pengguna.nama),
    db
      .select({ id: sesi.id_pengguna, terakhir: max(sesi.dibuat_pada) })
      .from(sesi)
      .groupBy(sesi.id_pengguna),
  ]);
  const terakhir = new Map(login.map((l) => [l.id, l.terakhir]));
  const kata = q.toLowerCase();
  const tampil = akun.filter((u) => !kata || `${u.nama} ${u.username} ${u.email}`.toLowerCase().includes(kata));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manajemen Pengguna"
        description="Atur akun dan peran. Akun tidak dihapus, hanya dinonaktifkan."
        actions={<TambahPengguna />}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SegmentFilter
          param="tab"
          label="Tampilan"
          options={[
            { value: "", label: "Pengguna" },
            { value: "peran", label: "Peran dan Hak Akses" },
          ]}
        />
        <div className="hidden flex-1 sm:block" />
        {tab !== "peran" && <SearchBox placeholder="Cari nama, username, atau email" className="sm:w-72" />}
      </div>

      {tab !== "peran" && (
        <TableWrap label="Daftar pengguna">
          <thead>
            <tr>
              <Th>Pengguna</Th>
              <Th width={150}>Username</Th>
              <Th width={190}>Peran</Th>
              <Th width={160}>Status</Th>
              <Th width={150}>Login Terakhir</Th>
              <Th width={88}>
                <span className="sr-only">Aksi</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {tampil.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted-foreground h-14 border-t px-3 text-center">
                  Tidak ada pengguna yang cocok dengan “{q}”. Coba nama, username, atau email lain.
                </td>
              </tr>
            ) : (
              tampil.map((u) => {
                const t = terakhir.get(u.id_pengguna);
                return (
                  <BarisPengguna
                    key={u.id_pengguna}
                    diriSendiri={u.id_pengguna === admin.id}
                    u={{
                      id: u.id_pengguna,
                      nama: u.nama,
                      email: u.email,
                      username: u.username ?? "-",
                      peran: u.peran ?? "",
                      aktif: u.aktif,
                      loginTerakhir: t ? tanggalJam(t) : "Belum pernah",
                    }}
                  />
                );
              })
            )}
          </tbody>
        </TableWrap>
      )}

      <SectionCard
        title="Hak Akses per Peran"
        description="L = lihat · T = tambah · U = ubah · H = hapus (soft delete) · V = verifikasi pembayaran. Matriks final menunggu tim SAG."
      >
        <TableWrap label="Matriks hak akses">
          <thead>
            <tr>
              <Th>Modul</Th>
              {PERAN.map((p) => (
                <Th key={p} width={140}>
                  {p}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(Object.keys(MATRIKS) as Modul[]).map((m) => (
              <tr key={m}>
                <Td className="h-11 font-medium">{LABEL_MODUL[m]}</Td>
                {PERAN.map((p) => {
                  const a = MATRIKS[m][p];
                  return (
                    <Td key={p} className="h-11">
                      {a?.length ? (
                        <span className="font-mono text-xs tracking-widest">{a.join(" ")}</span>
                      ) : (
                        <span className="text-muted-foreground" aria-label="Tidak ada akses">
                          –
                        </span>
                      )}
                    </Td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </SectionCard>
    </div>
  );
}
