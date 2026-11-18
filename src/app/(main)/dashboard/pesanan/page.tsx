import Link from "next/link";

import { Plus, SearchX } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/mdp/page-header";
import { Pagination } from "@/components/mdp/pagination";
import { Button } from "@/components/ui/button";
import { boleh } from "@/lib/akses";
import { wajibAkses } from "@/server/auth/sesi";
import { cocok, muatPesanan } from "@/server/data/pesanan";

import { kolomUntuk, PesananKpi } from "./_components/pesanan-kpi";
import { PesananTable } from "./_components/pesanan-table";
import { ClearSearch, PesananToolbar } from "./_components/pesanan-toolbar";

export const metadata: Metadata = { title: "Daftar Pesanan" };

const PER_HALAMAN = 10;

type SP = Promise<Record<string, string | string[] | undefined>>;
const daftar = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export default async function Page({ searchParams }: { searchParams: SP }) {
  const pengguna = await wajibAkses("pesanan");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const fTagihan = daftar(sp.tagihan);
  const fProduksi = daftar(sp.produksi);
  const fKirim = daftar(sp.kirim);

  const semua = await muatPesanan();
  const tersaring = semua.filter(
    (p) =>
      cocok(p, q) &&
      (fTagihan.length === 0 || fTagihan.includes(p.statusTagihan)) &&
      (fProduksi.length === 0 || fProduksi.includes(p.produksi)) &&
      (fKirim.length === 0 || fKirim.includes(p.statusKirim)),
  );

  const totalHalaman = Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN));
  const halaman = Math.min(totalHalaman, Math.max(1, Number(sp.hal) || 1));
  const tampil = tersaring.slice((halaman - 1) * PER_HALAMAN, halaman * PER_HALAMAN);
  const kolom = kolomUntuk(pengguna.peran);

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of daftar(v)) if (k !== "hal") qs.append(k, x);
  const hrefHal = (n: number) => {
    const p = new URLSearchParams(qs);
    if (n > 1) p.set("hal", String(n));
    return p.size ? `?${p}` : "?";
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Daftar Pesanan"
        description="Setiap PO tertaut dengan tagihan, pembayaran, status produksi, dan pengirimannya."
        actions={
          boleh(pengguna.peran, "pesanan", "T") && (
            <Button asChild>
              <Link href="/dashboard/pesanan/baru">
                <Plus aria-hidden="true" />
                Tambah Pesanan
              </Link>
            </Button>
          )
        }
      />

      <PesananKpi peran={pengguna.peran} semua={semua} />

      <PesananToolbar filter={kolom.filter} eksporHref={`/dashboard/pesanan/ekspor${qs.size ? `?${qs}` : ""}`} />

      {tersaring.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-xl border px-8 py-16 text-center">
          <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
            <SearchX className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium">{semua.length === 0 ? "Belum ada pesanan" : "Pesanan tidak ditemukan"}</p>
          <p className="text-muted-foreground max-w-[480px] text-sm">
            {semua.length === 0
              ? "Pesanan yang dicatat dari PO pelanggan akan tampil di sini."
              : q
                ? `Tidak ada pesanan yang cocok dengan “${q}”. Coba nomor surat pemesanan, nama pelanggan, nomor nota, atau nomor resi.`
                : "Tidak ada pesanan dengan filter ini. Ubah atau hapus filter untuk melihat pesanan lain."}
          </p>
          {semua.length > 0 && <ClearSearch />}
          {semua.length === 0 && boleh(pengguna.peran, "pesanan", "T") && (
            <Button asChild>
              <Link href="/dashboard/pesanan/baru">
                <Plus aria-hidden="true" />
                Tambah Pesanan
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <PesananTable rows={tampil} kolom={kolom.kolom} peran={pengguna.peran} />
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <p className="text-muted-foreground flex-1 text-sm">
              Menampilkan {(halaman - 1) * PER_HALAMAN + 1}–{(halaman - 1) * PER_HALAMAN + tampil.length} dari{" "}
              {tersaring.length} pesanan
            </p>
            <Pagination halaman={halaman} totalHalaman={totalHalaman} href={hrefHal} />
          </div>
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {tersaring.length} pesanan ditemukan
      </span>
    </div>
  );
}
