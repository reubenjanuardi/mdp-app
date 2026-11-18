import Link from "next/link";

import { cn } from "cn";
import { Pencil, SearchX } from "lucide-react";
import type { Metadata } from "next";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { SearchBox, SegmentFilter } from "@/components/mdp/list-toolbar";
import { PageHeader } from "@/components/mdp/page-header";
import { StatusBadge } from "@/components/mdp/status-badge";
import { Button } from "@/components/ui/button";
import { boleh } from "@/lib/akses";
import { angka, tanggal } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { cocok, muatPesanan } from "@/server/data/pesanan";

import { UbahStatus } from "./ubah-status";

export const metadata: Metadata = { title: "Status Produksi" };

type SP = Promise<Record<string, string | undefined>>;

export default async function Page({ searchParams }: { searchParams: SP }) {
  const pengguna = await wajibAkses("produksi");
  const sp = await searchParams;
  const status = sp.status ?? "";
  const q = sp.q ?? "";
  const semua = await muatPesanan();
  const baris = semua.filter((p) => cocok(p, q) && (!status || p.produksi === status));
  const bisaUbah = boleh(pengguna.peran, "produksi", "U");
  const pilih = bisaUbah ? semua.find((p) => p.id === sp.pilih) : undefined;

  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => k !== "pilih" && v) as [string, string][]);
  const href = (id?: string) => {
    const p = new URLSearchParams(qs);
    if (id) p.set("pilih", id);
    return p.size ? `?${p}` : "?";
  };
  const hitung = (s: string) => semua.filter((p) => p.produksi === s).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Status Produksi"
        description="Semua PO beserta status produksinya. Status terbaru tampil di detail pesanan dan dashboard."
      />
      <div className="flex flex-wrap items-center gap-2">
        <SegmentFilter
          param="status"
          label="Filter status produksi"
          options={[
            { value: "", label: "Semua", count: semua.length },
            { value: "Dalam Proses", label: "Dalam Proses", count: hitung("Dalam Proses") },
            { value: "Tertunda", label: "Tertunda", count: hitung("Tertunda") },
            { value: "Selesai", label: "Selesai", count: hitung("Selesai") },
          ]}
        />
        <div className="hidden flex-1 sm:block" />
        <SearchBox placeholder="Cari no. PO atau pelanggan" className="sm:w-64" />
      </div>
      <div className={cn("grid grid-cols-1 items-start gap-4", pilih && "lg:grid-cols-[minmax(0,1fr)_376px]")}>
        {baris.length === 0 ? (
          <div className="bg-card rounded-xl border">
            <EmptyState
              icon={SearchX}
              title="PO tidak ditemukan"
              description="Tidak ada PO dengan status atau kata kunci ini. Pilih Semua atau ubah pencarian."
            />
          </div>
        ) : (
          <TableWrap label="Status produksi per PO">
            <thead>
              <tr>
                <Th>Pesanan</Th>
                <Th width={200}>Barang</Th>
                <Th width={140}>Status</Th>
                <Th width={120}>Diperbarui</Th>
                {bisaUbah && (
                  <Th width={96}>
                    <span className="sr-only">Aksi</span>
                  </Th>
                )}
              </tr>
            </thead>
            <tbody>
              {baris.map((p) => {
                const b = p.barang[0];
                return (
                  <tr key={p.id} className={cn("hover:bg-muted/40", pilih?.id === p.id && "bg-highlight/60")}>
                    <Td className="h-14">
                      <Link
                        href={`/dashboard/pesanan/${encodeURIComponent(p.id)}?tab=produksi`}
                        className="hover:underline"
                      >
                        <Stack
                          utama={<span className="font-medium">{p.id}</span>}
                          ket={p.pelanggan}
                          className="min-w-36"
                        />
                      </Link>
                    </Td>
                    <Td>
                      {b && (
                        <Stack
                          utama={
                            <span className="font-medium">
                              {p.barang.length > 1 ? `${b.nama_barang} +${p.barang.length - 1}` : b.nama_barang}
                            </span>
                          }
                          ket={`${angka(p.barang.reduce((s, x) => s + x.jumlah, 0))} ${b.satuan}`}
                        />
                      )}
                    </Td>
                    <Td>
                      <StatusBadge status={p.produksi} />
                      {p.produksi === "Tertunda" && p.alasanTertunda && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 max-w-48 text-xs">{p.alasanTertunda}</p>
                      )}
                    </Td>
                    <Td className="text-muted-foreground text-xs whitespace-nowrap">
                      {tanggal(p.produksiDiperbarui ?? p.diperbaruiPada)}
                    </Td>
                    {bisaUbah && (
                      <Td>
                        <Button asChild variant="outline" size="sm">
                          <Link href={href(p.id)} scroll={false} aria-label={`Ubah status ${p.id}`}>
                            <Pencil aria-hidden="true" />
                            Ubah
                          </Link>
                        </Button>
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
        {pilih && (
          <UbahStatus
            key={pilih.id}
            id={pilih.id}
            pelanggan={pilih.pelanggan}
            statusSaatIni={pilih.produksi}
            tutupHref={href()}
          />
        )}
      </div>
    </div>
  );
}
