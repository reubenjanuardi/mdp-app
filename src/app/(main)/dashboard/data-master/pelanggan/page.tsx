import Link from "next/link";

import { cn } from "cn";
import { Plus, SearchX, Users } from "lucide-react";
import type { Metadata } from "next";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { SearchBox } from "@/components/mdp/list-toolbar";
import { PageHeader } from "@/components/mdp/page-header";
import { Button } from "@/components/ui/button";
import { boleh } from "@/lib/akses";
import { hapusPelanggan } from "@/server/actions/master";
import { wajibAkses } from "@/server/auth/sesi";
import { daftarPelanggan } from "@/server/data/master";

import { MenuMaster } from "../_components/hapus-master";
import { PelangganForm } from "./pelanggan-form";

export const metadata: Metadata = { title: "Master Pelanggan" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pilih?: string; baru?: string }>;
}) {
  const p = await wajibAkses("dataMaster");
  const { q = "", pilih, baru } = await searchParams;
  const semua = await daftarPelanggan();
  const kata = q.toLowerCase();
  const tampil = semua.filter((x) => !kata || `${x.nama_perusahaan} ${x.kontak ?? ""}`.toLowerCase().includes(kata));
  const bisaUbah = boleh(p.peran, "dataMaster", "U");
  const dipilih = bisaUbah ? semua.find((x) => x.id_pelanggan === pilih) : undefined;
  const formBaru = boleh(p.peran, "dataMaster", "T") && baru === "1";
  const tutup = q ? `?q=${encodeURIComponent(q)}` : "?";
  const tampilForm = dipilih || formBaru;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Master Pelanggan"
        description="Pelanggan dipilih saat membuat PO. Perubahan tidak mengubah PO lama."
        actions={
          boleh(p.peran, "dataMaster", "T") && (
            <Button asChild>
              <Link href={`${tutup}${tutup === "?" ? "" : "&"}baru=1`} scroll={false}>
                <Plus aria-hidden="true" />
                Tambah Pelanggan
              </Link>
            </Button>
          )
        }
      />
      <SearchBox placeholder="Cari nama perusahaan atau kontak" />
      <div className={cn("grid grid-cols-1 items-start gap-4", tampilForm && "lg:grid-cols-[minmax(0,1fr)_376px]")}>
        {tampil.length === 0 ? (
          <div className="bg-card rounded-xl border">
            {semua.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Belum ada pelanggan"
                description="Tambahkan pelanggan agar dapat dipilih di form PO."
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Pelanggan tidak ditemukan"
                description="Coba nama perusahaan atau nama kontak lain."
              />
            )}
          </div>
        ) : (
          <TableWrap label="Daftar pelanggan">
            <thead>
              <tr>
                <Th>Perusahaan</Th>
                <Th width={150}>Kontak</Th>
                <Th width={150}>Telepon / Faks</Th>
                <Th width={80}>Lokasi</Th>
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
                  key={x.id_pelanggan}
                  className={cn("hover:bg-muted/40", dipilih?.id_pelanggan === x.id_pelanggan && "bg-highlight/60")}
                >
                  <Td className="h-14">
                    <Stack
                      utama={<span className="font-medium">{x.nama_perusahaan}</span>}
                      ket={x.alamat.split(",").pop()?.trim()}
                      className="min-w-44"
                    />
                  </Td>
                  <Td>{x.kontak ?? "-"}</Td>
                  <Td>
                    <span className="font-mono text-xs">{x.telepon ?? "-"}</span>
                  </Td>
                  <Td>{x.lokasi.length}</Td>
                  {bisaUbah && (
                    <Td>
                      <MenuMaster
                        nama={x.nama_perusahaan}
                        ubahHref={`${tutup}${tutup === "?" ? "" : "&"}pilih=${encodeURIComponent(x.id_pelanggan)}`}
                        hapus={hapusPelanggan.bind(null, x.id_pelanggan)}
                      />
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        {tampilForm && (
          <PelangganForm
            key={dipilih?.id_pelanggan ?? "baru"}
            tutupHref={tutup}
            awal={
              dipilih && {
                id: dipilih.id_pelanggan,
                nama: dipilih.nama_perusahaan,
                alamat: dipilih.alamat,
                telepon: dipilih.telepon ?? "",
                kontak: dipilih.kontak ?? "",
                lokasi: dipilih.lokasi.map((l) => ({ id: l.id_lokasi, nama: l.nama_lokasi, alamat: l.alamat })),
              }
            }
          />
        )}
      </div>
    </div>
  );
}
