import Link from "next/link";

import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { TableWrap, Td, Th } from "@/components/mdp/data-table";
import { PageHeader } from "@/components/mdp/page-header";
import { Button } from "@/components/ui/button";
import { boleh } from "@/lib/akses";
import { angka, tanggal } from "@/lib/format";
import { daftarProduksiHarian } from "@/server/actions/rekap-operasional";
import { wajibAkses } from "@/server/auth/sesi";

export const metadata: Metadata = { title: "Realisasi Produksi" };

export default async function Page() {
  const p = await wajibAkses("produksi");
  const rows = await daftarProduksiHarian();
  return <div className="flex flex-col gap-6">
    <PageHeader title="Realisasi Produksi" description="Laporan output harian Cupseal dan Rubber Seal." actions={boleh(p.peran, "produksi", "T") ? <Button asChild><Link href="/dashboard/produksi/realisasi/baru"><Plus aria-hidden="true" />Tambah Realisasi</Link></Button> : undefined} />
    <TableWrap label="Realisasi produksi harian"><thead><tr><Th>Tanggal</Th><Th>Mesin</Th><Th>No.</Th><Th>Operator</Th><Th>Kode Produk</Th><Th align="right">Jumlah</Th><Th>Catatan</Th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id_produksi_harian}><Td>{tanggal(r.tanggal)}</Td><Td>{r.mesin}</Td><Td>{r.nomor_operator ?? "-"}</Td><Td>{r.operator}</Td><Td className="font-mono text-xs">{r.kode_produk}</Td><Td align="right">{angka(r.jumlah_hasil)}</Td><Td>{r.catatan ?? "-"}</Td></tr>)}
    </tbody></TableWrap>
  </div>;
}
