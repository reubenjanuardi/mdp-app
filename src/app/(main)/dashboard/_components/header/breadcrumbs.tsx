"use client";

import { Fragment, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight } from "lucide-react";
import { create } from "zustand";

// Label untuk segmen dinamis (misalnya id nota menjadi "NF/09/2026/0079"), diisi oleh halaman.
const useLabel = create<{ label: Record<string, string>; set: (seg: string, label: string) => void }>((set) => ({
  label: {},
  set: (seg, label) => set((s) => ({ label: { ...s.label, [seg]: label } })),
}));

export function CrumbLabel({ segment, label }: { segment: string; label: string }) {
  const set = useLabel((s) => s.set);
  useEffect(() => set(segment, label), [segment, label, set]);
  return null;
}

const LABEL: Record<string, string> = {
  pesanan: "Pesanan",
  pengiriman: "Pengiriman",
  "jatuh-tempo": "Jatuh Tempo",
  "follow-up": "Follow-up",
  produksi: "Status Produksi",
  "data-master": "Data Master",
  pelanggan: "Pelanggan",
  barang: "Barang",
  pengguna: "Pengguna",
};

const BARU: Record<string, string> = {
  pesanan: "Tambah Pesanan",
  tagihan: "Tambah Tagihan",
  pengiriman: "Catat Pengiriman",
};

// Segmen tanpa halaman sendiri ditampilkan tanpa tautan.
const TANPA_HALAMAN = new Set(["data-master", "tagihan"]);

export function Breadcrumbs() {
  const path = usePathname();
  const dinamis = useLabel((s) => s.label);
  const seg = path.split("/").filter(Boolean).slice(1).map(decodeURIComponent);

  const item: { href?: string; label: string }[] = [];
  if (seg.length === 0) item.push({ label: "Dashboard" });
  seg.forEach((s, i) => {
    const sebelum = seg[i - 1];
    let label = dinamis[s] ?? LABEL[s] ?? s;
    if (s === "baru") label = BARU[sebelum] ?? "Tambah";
    if (s === "ubah") label = "Ubah Pesanan";
    if (s === "pembayaran") label = "Catat Pembayaran";
    if (s === "pengiriman" && sebelum) label = "Catat Pengiriman";
    if (s === "tagihan") return;
    const href = TANPA_HALAMAN.has(s) ? undefined : `/dashboard/${seg.slice(0, i + 1).join("/")}`;
    item.push({ href, label });
  });
  if (seg.length === 1 && seg[0] === "pesanan") item.push({ label: "Daftar Pesanan" });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {item.map((it, i) => {
          const terakhir = i === item.length - 1;
          return (
            <Fragment key={`${it.label}-${i}`}>
              <li className={terakhir ? "min-w-0 truncate" : "hidden shrink-0 md:block"}>
                {terakhir ? (
                  <span aria-current="page" className="text-foreground">
                    {it.label}
                  </span>
                ) : it.href ? (
                  <Link href={it.href} prefetch={false} className="text-muted-foreground hover:text-foreground">
                    {it.label}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{it.label}</span>
                )}
              </li>
              {!terakhir && (
                <li aria-hidden="true" className="text-muted-foreground hidden md:block">
                  <ChevronRight className="size-3.5" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
