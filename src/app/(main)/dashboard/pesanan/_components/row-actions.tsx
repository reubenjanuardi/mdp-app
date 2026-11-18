"use client";

import Link from "next/link";

import { Ellipsis, Eye, Factory, Pencil, Receipt, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { boleh } from "@/lib/akses";
import type { Peran } from "@/server/db/schema";

export function RowActions({ id, peran }: { id: string; peran: Peran }) {
  const base = `/dashboard/pesanan/${encodeURIComponent(id)}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`Aksi untuk ${id}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={base}>
            <Eye aria-hidden="true" />
            Lihat detail
          </Link>
        </DropdownMenuItem>
        {boleh(peran, "pesanan", "U") && (
          <DropdownMenuItem asChild>
            <Link href={`${base}/ubah`}>
              <Pencil aria-hidden="true" />
              Ubah pesanan
            </Link>
          </DropdownMenuItem>
        )}
        {boleh(peran, "tagihan", "T") && (
          <DropdownMenuItem asChild>
            <Link href={`${base}/tagihan/baru`}>
              <Receipt aria-hidden="true" />
              Tambah tagihan
            </Link>
          </DropdownMenuItem>
        )}
        {boleh(peran, "pengiriman", "T") && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/pengiriman/baru?pesanan=${encodeURIComponent(id)}`}>
              <Truck aria-hidden="true" />
              Catat pengiriman
            </Link>
          </DropdownMenuItem>
        )}
        {boleh(peran, "produksi", "U") && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/produksi?pilih=${encodeURIComponent(id)}`}>
              <Factory aria-hidden="true" />
              Ubah status produksi
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
