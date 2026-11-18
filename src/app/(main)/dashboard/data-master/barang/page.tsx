import Link from "next/link";

import { cn } from "cn";
import { Package, Plus, SearchX } from "lucide-react";
import type { Metadata } from "next";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { SearchBox } from "@/components/mdp/list-toolbar";
import { PageHeader } from "@/components/mdp/page-header";
import { Button } from "@/components/ui/button";
import { boleh } from "@/lib/akses";
import { rupiah } from "@/lib/format";
import { hapusBarang } from "@/server/actions/master";
import { wajibAkses } from "@/server/auth/sesi";
import { daftarBarang } from "@/server/data/master";

import { MenuMaster } from "../_components/hapus-master";
import { BarangForm } from "./barang-form";

export const metadata: Metadata = { title: "Master Barang" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pilih?: string; baru?: string }>;
}) {
  const p = await wajibAkses("dataMaster");
  const { q = "", pilih, baru } = await searchParams;
  const semua = await daftarBarang();
  const kata = q.toLowerCase();
  const tampil = semua.filter((x) => !kata || `${x.kode_barang} ${x.nama}`.toLowerCase().includes(kata));
  const bisaUbah = boleh(p.peran, "dataMaster", "U");
  const dipilih = bisaUbah ? semua.find((x) => x.id_barang === pilih) : undefined;
  const formBaru = boleh(p.peran, "dataMaster", "T") && baru === "1";
  const tutup = q ? `?q=${encodeURIComponent(q)}` : "?";
  const sambung = tutup === "?" ? "" : "&";
  const satuan = [...new Set(semua.map((x) => x.satuan))].sort();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Master Barang"
        description="Harga acuan mengisi harga satuan di PO dan tetap dapat diubah per PO."
        actions={
          boleh(p.peran, "dataMaster", "T") && (
            <Button asChild>
              <Link href={`${tutup}${sambung}baru=1`} scroll={false}>
                <Plus aria-hidden="true" />
                Tambah Barang
              </Link>
            </Button>
          )
        }
      />
      <SearchBox placeholder="Cari kode atau nama barang" />
      <div
        className={cn(
          "grid grid-cols-1 items-start gap-4",
          (dipilih || formBaru) && "lg:grid-cols-[minmax(0,1fr)_376px]",
        )}
      >
        {tampil.length === 0 ? (
          <div className="bg-card rounded-xl border">
            {semua.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Belum ada barang"
                description="Tambahkan barang agar dapat dipilih di form PO."
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Barang tidak ditemukan"
                description="Coba kode atau nama barang lain."
              />
            )}
          </div>
        ) : (
          <TableWrap label="Daftar barang">
            <thead>
              <tr>
                <Th width={88}>Kode</Th>
                <Th>Nama dan Spesifikasi</Th>
                <Th width={88}>Satuan</Th>
                <Th align="right" width={120}>
                  Harga Acuan
                </Th>
                {bisaUbah && (
                  <Th width={48}>
                    <span className="sr-only">Aksi</span>
                  </Th>
                )}
              </tr>
            </thead>
            <tbody>
              {tampil.map((x) => (
                <tr
                  key={x.id_barang}
                  className={cn("hover:bg-muted/40", dipilih?.id_barang === x.id_barang && "bg-highlight/60")}
                >
                  <Td className="h-14">
                    <span className="font-mono text-xs">{x.kode_barang}</span>
                  </Td>
                  <Td>
                    <Stack
                      utama={<span className="font-medium">{x.nama}</span>}
                      ket={x.spesifikasi}
                      className="min-w-44"
                    />
                  </Td>
                  <Td>{x.satuan}</Td>
                  <Td align="right" className="font-medium tabular-nums">
                    {rupiah(x.harga_acuan)}
                  </Td>
                  {bisaUbah && (
                    <Td>
                      <MenuMaster
                        nama={x.kode_barang}
                        ubahHref={`${tutup}${sambung}pilih=${encodeURIComponent(x.id_barang)}`}
                        hapus={hapusBarang.bind(null, x.id_barang)}
                      />
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {(dipilih || formBaru) && (
          <BarangForm
            key={dipilih?.id_barang ?? "baru"}
            tutupHref={tutup}
            satuan={satuan}
            awal={
              dipilih && {
                id: dipilih.id_barang,
                kode: dipilih.kode_barang,
                nama: dipilih.nama,
                spesifikasi: dipilih.spesifikasi ?? "",
                satuan: dipilih.satuan,
                harga: dipilih.harga_acuan,
              }
            }
          />
        )}
      </div>
    </div>
  );
}
