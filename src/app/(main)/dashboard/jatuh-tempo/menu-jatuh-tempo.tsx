"use client";

import Link from "next/link";

import { CalendarPlus, Ellipsis, Eye, MessageSquarePlus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MenuJatuhTempo({
  idPesanan,
  idNota,
  nomor,
  bisaFollowUp,
  bisaBayar,
  bisaUbahPo,
}: {
  idPesanan: string;
  idNota: string;
  nomor: string;
  bisaFollowUp: boolean;
  bisaBayar: boolean;
  bisaUbahPo: boolean;
}) {
  const po = `/dashboard/pesanan/${encodeURIComponent(idPesanan)}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`Aksi untuk ${nomor}`}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href={`${po}?tab=tagihan`}>
            <Eye aria-hidden="true" />
            Lihat pesanan
          </Link>
        </DropdownMenuItem>
        {bisaUbahPo && (
          <DropdownMenuItem asChild>
            <Link href={`${po}/ubah`}>
              <CalendarPlus aria-hidden="true" />
              Lengkapi jatuh tempo
            </Link>
          </DropdownMenuItem>
        )}
        {bisaFollowUp && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/follow-up/${encodeURIComponent(idNota)}`}>
              <MessageSquarePlus aria-hidden="true" />
              Catat tindak lanjut
            </Link>
          </DropdownMenuItem>
        )}
        {bisaBayar && (
          <DropdownMenuItem asChild>
            <Link href={`${po}/pembayaran?nota=${encodeURIComponent(idNota)}`}>
              <Plus aria-hidden="true" />
              Catat pembayaran
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
