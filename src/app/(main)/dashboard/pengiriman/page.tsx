import Link from "next/link";

import { cn } from "cn";
import { Eye, FileText, Inbox, Plus, SearchX } from "lucide-react";
import type { Metadata } from "next";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { Kv } from "@/components/mdp/kv";
import { FacetFilter, SearchBox } from "@/components/mdp/list-toolbar";
import { PageHeader } from "@/components/mdp/page-header";
import { SectionCard } from "@/components/mdp/section-card";
import { StatusBadge } from "@/components/mdp/status-badge";
import { Button } from "@/components/ui/button";
import { boleh } from "@/lib/akses";
import { angka, tanggal } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { type BarisPengiriman, daftarPengiriman } from "@/server/data/pengiriman";

import { TandaiSelesai } from "./tandai-selesai";

export const metadata: Metadata = { title: "Pengiriman" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const daftar = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const kunci = (b: BarisPengiriman) => (b.jenis === "kirim" ? b.kirim.id_pengiriman : `po-${b.pesanan.id}`);

export default async function Page({ searchParams }: { searchParams: SP }) {
  const pengguna = await wajibAkses("pengiriman");
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").toLowerCase();
  const fStatus = daftar(sp.status);
  const fJenis = daftar(sp.jenis);

  const semua = await daftarPengiriman();
  const baris = semua
    .filter((b) => {
      const status = b.jenis === "kirim" ? b.kirim.status_pengiriman : "Belum Dikirim";
      const jenis = b.jenis === "kirim" ? b.kirim.jenis_pengiriman : null;
      const teks = [
        b.pesanan.id,
        b.pesanan.pelanggan,
        b.jenis === "kirim" ? (b.kirim.nomor_resi ?? b.kirim.nomor_tanda_terima ?? "") : "",
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!q || teks.includes(q)) &&
        (!fStatus.length || fStatus.includes(status)) &&
        (!fJenis.length || (jenis && fJenis.includes(jenis)))
      );
    })
    .sort((a, b) => {
      // Dalam Kirim di atas, lalu terbaru; pesanan tanpa pengiriman di bawah.
      const skor = (x: BarisPengiriman) =>
        x.jenis === "kosong" ? 2 : x.kirim.status_pengiriman === "Dalam Kirim" ? 0 : 1;
      const tgl = (x: BarisPengiriman) => (x.jenis === "kirim" ? (x.kirim.tanggal_pengiriman ?? "") : "");
      return skor(a) - skor(b) || tgl(b).localeCompare(tgl(a));
    });

  const pilihId = typeof sp.pilih === "string" ? sp.pilih : null;
  const pilih = baris.find((b) => kunci(b) === pilihId) ?? baris.find((b) => b.jenis === "kirim") ?? baris[0];
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of daftar(v)) if (k !== "pilih") qs.append(k, x);
  const href = (k: string) => {
    const p = new URLSearchParams(qs);
    p.set("pilih", k);
    return `?${p}`;
  };
  const bisaCatat = boleh(pengguna.peran, "pengiriman", "T");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengiriman"
        description="Riwayat pengiriman per pesanan beserta nomor resi atau Tanda Terima Barang."
        actions={
          bisaCatat && (
            <Button asChild>
              <Link href="/dashboard/pengiriman/baru">
                <Plus aria-hidden="true" />
                Catat Pengiriman
              </Link>
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox placeholder="Cari no. PO, resi, atau TTB" />
        <FacetFilter title="Status" param="status" options={["Dalam Kirim", "Selesai", "Belum Dikirim"]} />
        <FacetFilter title="Jenis" param="jenis" options={["Ekspedisi", "Antar Langsung"]} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        {baris.length === 0 ? (
          <div className="bg-card rounded-xl border">
            <EmptyState
              icon={SearchX}
              title="Pengiriman tidak ditemukan"
              description="Tidak ada pengiriman yang cocok dengan pencarian atau filter. Ubah kata kunci atau hapus filter."
            />
          </div>
        ) : (
          <TableWrap label="Daftar pengiriman">
            <thead>
              <tr>
                <Th>Pesanan</Th>
                <Th width={48}>Ke-</Th>
                <Th width={140}>Jenis</Th>
                <Th width={170}>No. Resi / TTB</Th>
                <Th width={120}>Tanggal</Th>
                <Th width={132}>Status</Th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => {
                const k = kunci(b);
                const aktif = pilih && kunci(pilih) === k;
                return (
                  <tr key={k} className={cn("hover:bg-muted/40", aktif && "bg-highlight/60")}>
                    <Td className="h-14">
                      <Link
                        href={href(k)}
                        scroll={false}
                        aria-current={aktif ? "true" : undefined}
                        className="focus-visible:ring-ring/50 block rounded outline-none focus-visible:ring-3"
                      >
                        <Stack
                          utama={<span className="font-medium">{b.pesanan.id}</span>}
                          ket={b.pesanan.pelanggan}
                          className="min-w-40"
                        />
                      </Link>
                    </Td>
                    <Td>{b.jenis === "kirim" ? b.ke : "–"}</Td>
                    <Td>{b.jenis === "kirim" ? b.kirim.jenis_pengiriman : "–"}</Td>
                    <Td>
                      {b.jenis === "kirim" ? (
                        <span className="font-mono text-xs">{b.kirim.nomor_resi ?? b.kirim.nomor_tanda_terima}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Belum ada data</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {b.jenis === "kirim" ? tanggal(b.kirim.tanggal_pengiriman) : "–"}
                    </Td>
                    <Td>
                      <StatusBadge status={b.jenis === "kirim" ? b.kirim.status_pengiriman : "Belum Dikirim"} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}

        {pilih && (
          <PanelPengiriman b={pilih} bisaUbah={boleh(pengguna.peran, "pengiriman", "U")} bisaCatat={bisaCatat} />
        )}
      </div>
    </div>
  );
}

function PanelPengiriman({ b, bisaUbah, bisaCatat }: { b: BarisPengiriman; bisaUbah: boolean; bisaCatat: boolean }) {
  if (b.jenis === "kosong") {
    return (
      <SectionCard title={b.pesanan.id} description={b.pesanan.pelanggan}>
        <EmptyState
          icon={Inbox}
          className="py-6"
          title="Belum ada data pengiriman"
          description="Informasi akan tersedia setelah pengiriman dicatat."
          action={
            bisaCatat && (
              <Button asChild variant="outline">
                <Link href={`/dashboard/pengiriman/baru?pesanan=${encodeURIComponent(b.pesanan.id)}`}>
                  <Plus aria-hidden="true" />
                  Catat Pengiriman
                </Link>
              </Button>
            )
          }
        />
      </SectionCard>
    );
  }
  const k = b.kirim;
  const ekspedisi = k.jenis_pengiriman === "Ekspedisi";
  return (
    <SectionCard
      title={`Pengiriman ke-${b.ke}`}
      description={`${k.status_pengiriman === "Dalam Kirim" ? "Dalam Kirim sejak" : "Dikirim"} ${tanggal(k.tanggal_pengiriman)}`}
      actions={<StatusBadge status={k.status_pengiriman} />}
    >
      <dl className="grid grid-cols-2 gap-4">
        <Kv label="Pesanan" mono>
          <Link
            href={`/dashboard/pesanan/${encodeURIComponent(b.pesanan.id)}?tab=pengiriman`}
            className="text-primary hover:underline"
          >
            {b.pesanan.id}
          </Link>
        </Kv>
        <Kv label="Jenis">{k.jenis_pengiriman}</Kv>
        <Kv label={ekspedisi ? "No. Resi" : "No. Tanda Terima Barang"} mono>
          {k.nomor_resi ?? k.nomor_tanda_terima}
        </Kv>
        <Kv label="Tanggal">{tanggal(k.tanggal_pengiriman)}</Kv>
        {ekspedisi && <Kv label="Ekspedisi">{k.ekspedisi}</Kv>}
        {ekspedisi && <Kv label="Jumlah Koli">{k.jumlah_koli ? angka(k.jumlah_koli) : "-"}</Kv>}
      </dl>
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">{ekspedisi ? "Hasil pindai resi" : "Bukti serah terima"}</p>
        <div className="bg-muted flex h-36 flex-col items-center justify-center gap-2 rounded-lg border px-4 text-center">
          <FileText className="text-muted-foreground size-5" aria-hidden="true" />
          <span className="text-muted-foreground text-xs break-all">{k.nama_file_dokumen ?? "Tidak ada dokumen"}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {k.dokumen && (
          <Button asChild variant="outline">
            <a href={`/api/berkas/pengiriman/${encodeURIComponent(k.id_pengiriman)}`} target="_blank" rel="noreferrer">
              <Eye aria-hidden="true" />
              Lihat Bukti
            </a>
          </Button>
        )}
        {bisaUbah && k.status_pengiriman === "Dalam Kirim" && <TandaiSelesai id={k.id_pengiriman} />}
      </div>
    </SectionCard>
  );
}
