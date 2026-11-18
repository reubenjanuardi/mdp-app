import Link from "next/link";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { StatusBadge } from "@/components/mdp/status-badge";
import { angka, rupiah, tanggal } from "@/lib/format";
import type { PesananRingkas } from "@/server/data/pesanan";
import type { Peran } from "@/server/db/schema";

import type { Kolom } from "./pesanan-kpi";
import { RowActions } from "./row-actions";

const KEPALA: Record<Kolom, { label: string; width?: number; align?: "right" }> = {
  po: { label: "No. PO", width: 132 },
  pelanggan: { label: "Pelanggan" },
  tanggal: { label: "Tanggal PO", width: 120 },
  total: { label: "Total", width: 140, align: "right" },
  tagihan: { label: "Tagihan", width: 132 },
  produksi: { label: "Produksi", width: 128 },
  kirim: { label: "Pengiriman", width: 132 },
  lokasi: { label: "Lokasi Pengiriman", width: 220 },
  barang: { label: "Barang", width: 200 },
};

function sel(p: PesananRingkas, k: Kolom) {
  switch (k) {
    case "po":
      return (
        <Link
          href={`/dashboard/pesanan/${encodeURIComponent(p.id)}`}
          className="text-primary rounded font-mono text-xs leading-4 underline-offset-4 hover:underline"
        >
          {p.id}
        </Link>
      );
    case "pelanggan":
      return <span className="block min-w-40">{p.pelanggan}</span>;
    case "tanggal":
      return <span className="text-muted-foreground whitespace-nowrap">{tanggal(p.tanggalPo)}</span>;
    case "total":
      return <span className="font-medium whitespace-nowrap tabular-nums">{rupiah(p.total)}</span>;
    case "tagihan":
      return <StatusBadge status={p.statusTagihan} />;
    case "produksi":
      return <StatusBadge status={p.produksi} />;
    case "kirim":
      return <StatusBadge status={p.statusKirim} />;
    case "lokasi":
      return <span className="line-clamp-2 min-w-48">{p.lokasi}</span>;
    case "barang": {
      const pertama = p.barang[0];
      return pertama ? (
        <Stack
          utama={p.barang.length > 1 ? `${pertama.nama_barang} +${p.barang.length - 1}` : pertama.nama_barang}
          ket={`${angka(p.barang.reduce((s, b) => s + b.jumlah, 0))} ${pertama.satuan}`}
        />
      ) : (
        "-"
      );
    }
  }
}

export function PesananTable({ rows, kolom, peran }: { rows: PesananRingkas[]; kolom: Kolom[]; peran: Peran }) {
  return (
    <TableWrap label="Daftar pesanan">
      <thead>
        <tr>
          {kolom.map((k) => (
            <Th key={k} width={KEPALA[k].width} align={KEPALA[k].align}>
              {KEPALA[k].label}
            </Th>
          ))}
          <Th width={48}>
            <span className="sr-only">Aksi</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-muted/40">
            {kolom.map((k) => (
              <Td key={k} align={KEPALA[k].align}>
                {sel(p, k)}
              </Td>
            ))}
            <Td>
              <RowActions id={p.id} peran={peran} />
            </Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}
