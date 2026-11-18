import Link from "next/link";

import { cn } from "cn";
import { CircleDashed, PartyPopper, SearchX } from "lucide-react";
import type { Metadata } from "next";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { SearchBox } from "@/components/mdp/list-toolbar";
import { PageHeader } from "@/components/mdp/page-header";
import { StatusBadge } from "@/components/mdp/status-badge";
import { boleh } from "@/lib/akses";
import { hariIni, rupiah, tanggal } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { daftarJatuhTempo, type ItemJatuhTempo } from "@/server/data/follow-up";

import { MenuJatuhTempo } from "./menu-jatuh-tempo";

export const metadata: Metadata = { title: "Monitoring Jatuh Tempo" };

const FILTER = ["Terlambat", "H-0", "H-1", "H-2", "H-3", "Belum lengkap"] as const;

function kategori(i: ItemJatuhTempo) {
  if (!i.jatuhTempo) return "Belum lengkap";
  return i.penanda ?? "Belum dekat";
}

export default async function Page({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const pengguna = await wajibAkses("jatuhTempo");
  const { f = "", q = "" } = await searchParams;
  const semua = await daftarJatuhTempo();
  const kata = q.trim().toLowerCase();
  const tampil = semua.filter(
    (i) =>
      (!f || kategori(i) === f) && (!kata || `${i.nomor} ${i.pelanggan} ${i.idPesanan}`.toLowerCase().includes(kata)),
  );
  const hitung = (k: string) => semua.filter((i) => kategori(i) === k).length;
  const link = (nilai: string) => {
    const p = new URLSearchParams();
    if (nilai) p.set("f", nilai);
    if (q) p.set("q", q);
    return p.size ? `?${p}` : "?";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Monitoring Jatuh Tempo"
        description={`Tagihan belum lunas dengan penanda H-3, H-2, H-1, H-0, dan Terlambat. Per ${tanggal(hariIni())}.`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <nav aria-label="Filter penanda" className="flex flex-wrap gap-2">
          {[{ v: "", label: "Semua", n: semua.length }, ...FILTER.map((x) => ({ v: x, label: x, n: hitung(x) }))].map(
            (x) => {
              const aktif = f === x.v;
              return (
                <Link
                  key={x.label}
                  href={link(x.v)}
                  scroll={false}
                  aria-current={aktif ? "page" : undefined}
                  className={cn(
                    "bg-background hover:bg-muted focus-visible:ring-ring/50 inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm font-medium outline-none focus-visible:ring-3",
                    aktif && "border-primary bg-highlight text-status-info-foreground border-2 px-[9px]",
                  )}
                >
                  {x.label}
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-1.5 text-center text-xs leading-5",
                      aktif ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {x.n}
                  </span>
                </Link>
              );
            },
          )}
        </nav>
        <div className="hidden flex-1 lg:block" />
        <SearchBox placeholder="Cari nota atau pelanggan" className="sm:w-64" />
      </div>

      {tampil.length === 0 ? (
        <div className="bg-card rounded-xl border">
          {semua.length === 0 ? (
            <EmptyState
              icon={PartyPopper}
              title="Semua tagihan sudah lunas"
              description="Tidak ada tagihan yang perlu dipantau. Tagihan baru yang belum lunas akan muncul di sini."
            />
          ) : (
            <EmptyState
              icon={SearchX}
              title="Tidak ada tagihan dengan filter ini"
              description="Pilih Semua atau ubah kata kunci pencarian."
            />
          )}
        </div>
      ) : (
        <TableWrap label="Tagihan belum lunas">
          <thead>
            <tr>
              <Th width={160}>No. Nota</Th>
              <Th>Pesanan</Th>
              <Th width={130}>Jatuh Tempo</Th>
              <Th align="right" width={150}>
                Sisa Tagihan
              </Th>
              <Th width={136}>Status Tagihan</Th>
              <Th width={136}>Penanda</Th>
              <Th width={48}>
                <span className="sr-only">Aksi</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {tampil.map((i) => (
              <tr key={i.idNota} className="hover:bg-muted/40">
                <Td className="h-14">
                  <span className="text-primary font-mono text-xs">{i.nomor}</span>
                </Td>
                <Td>
                  <Link href={`/dashboard/pesanan/${encodeURIComponent(i.idPesanan)}`} className="hover:underline">
                    <Stack
                      utama={<span className="font-medium">{i.idPesanan}</span>}
                      ket={i.pelanggan}
                      className="min-w-40"
                    />
                  </Link>
                </Td>
                <Td className="whitespace-nowrap">
                  {i.jatuhTempo ? (
                    <span className="font-medium">{tanggal(i.jatuhTempo)}</span>
                  ) : (
                    <span className="text-muted-foreground">Belum diisi</span>
                  )}
                </Td>
                <Td align="right" className="font-medium whitespace-nowrap tabular-nums">
                  {rupiah(i.sisa)}
                </Td>
                <Td>
                  <StatusBadge status={i.status} />
                </Td>
                <Td>
                  {!i.jatuhTempo ? (
                    <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap">
                      <CircleDashed className="size-3" aria-hidden="true" />
                      Belum lengkap
                    </span>
                  ) : i.penanda ? (
                    <StatusBadge status={i.penanda} />
                  ) : (
                    <span className="text-muted-foreground text-xs whitespace-nowrap">{i.sisaHari} hari lagi</span>
                  )}
                </Td>
                <Td>
                  <MenuJatuhTempo
                    idPesanan={i.idPesanan}
                    idNota={i.idNota}
                    nomor={i.nomor}
                    bisaFollowUp={boleh(pengguna.peran, "followUp", "T")}
                    bisaBayar={boleh(pengguna.peran, "pembayaran", "T")}
                    bisaUbahPo={boleh(pengguna.peran, "pesanan", "U") && !i.jatuhTempo}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
