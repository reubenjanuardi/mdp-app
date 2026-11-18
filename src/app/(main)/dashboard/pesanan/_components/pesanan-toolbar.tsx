"use client";

import { Download, X } from "lucide-react";

import { FacetFilter, SearchBox, useQueryUpdater } from "@/components/mdp/list-toolbar";
import { Button } from "@/components/ui/button";

import type { Filter } from "./pesanan-kpi";

const OPSI: Record<Filter, { title: string; options: string[] }> = {
  tagihan: { title: "Status Tagihan", options: ["Belum Bayar", "Sebagian", "Lunas", "Terlambat", "Lebih Bayar"] },
  produksi: { title: "Produksi", options: ["Dalam Proses", "Selesai", "Tertunda"] },
  kirim: { title: "Pengiriman", options: ["Belum Dikirim", "Dalam Kirim", "Selesai"] },
};

export function PesananToolbar({ filter, eksporHref }: { filter: Filter[]; eksporHref: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchBox placeholder="Cari no. PO, pelanggan, nota, resi" />
      {filter.map((f) => (
        <FacetFilter key={f} param={f} title={OPSI[f].title} options={OPSI[f].options} />
      ))}
      <div className="hidden flex-1 sm:block" />
      <Button asChild variant="outline">
        <a href={eksporHref} download>
          <Download aria-hidden="true" />
          Ekspor
        </a>
      </Button>
    </div>
  );
}

export function ClearSearch() {
  const { set } = useQueryUpdater();
  return (
    <Button variant="outline" onClick={() => set({ q: null, tagihan: null, produksi: null, kirim: null })}>
      <X aria-hidden="true" />
      Hapus Pencarian
    </Button>
  );
}
