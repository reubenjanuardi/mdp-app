import Link from "next/link";

import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { TableWrap, Td, Th } from "@/components/mdp/data-table";
import { PageHeader } from "@/components/mdp/page-header";
import { Button } from "@/components/ui/button";
import { angka, rupiah, tanggal } from "@/lib/format";
import { boleh } from "@/lib/akses";
import { daftarRekapPengiriman } from "@/server/actions/rekap-operasional";
import { wajibAkses } from "@/server/auth/sesi";

export const metadata: Metadata = { title: "Rekap Pengiriman" };

export default async function Page() {
  const p = await wajibAkses("pengiriman");
  const rows = await daftarRekapPengiriman();
  return <div className="flex flex-col gap-6">
    <PageHeader title="Rekap Pengiriman Barang" description="Kolom disamakan dengan file Rekap Pengiriman Barang perusahaan." actions={boleh(p.peran, "pengiriman", "T") ? <Button asChild><Link href="/dashboard/pengiriman/rekap/baru"><Plus aria-hidden="true" />Tambah Rekap</Link></Button> : undefined} />
    <TableWrap label="Rekap pengiriman barang"><thead><tr><Th>Tanggal</Th><Th>Penerima</Th><Th>Barang</Th><Th>Keterangan</Th><Th align="right">Koli</Th><Th align="right">Satuan</Th><Th align="right">Harga/Pcs</Th><Th align="right">Total</Th><Th>Tgl Bayar</Th><Th align="right">Total Bayar</Th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id_rekap_pengiriman}><Td>{tanggal(r.tanggal)}</Td><Td>{r.penerima}</Td><Td>{r.barang}</Td><Td>{r.keterangan ?? "-"}</Td><Td align="right">{r.jumlah_koli == null ? "-" : angka(r.jumlah_koli)}</Td><Td align="right">{r.jumlah_satuan == null ? "-" : angka(r.jumlah_satuan)}</Td><Td align="right">{r.harga_per_pcs == null ? "-" : rupiah(r.harga_per_pcs)}</Td><Td align="right">{r.total == null ? "-" : rupiah(r.total)}</Td><Td>{tanggal(r.tanggal_pembayaran)}</Td><Td align="right">{r.total_pembayaran == null ? "-" : rupiah(r.total_pembayaran)}</Td></tr>)}</tbody>
    </TableWrap>
  </div>;
}
