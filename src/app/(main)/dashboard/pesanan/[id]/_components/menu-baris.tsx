"use client";

import { useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Ellipsis, Eye, PencilLine, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hapusPembayaran } from "@/server/actions/pembayaran";

import { KoreksiDialog, type NotaKoreksi } from "./koreksi-dialog";

export function MenuNota({
  idPesanan,
  idNota,
  nomor,
  bisaBayar,
  bisaKoreksi,
  koreksi,
}: {
  idPesanan: string;
  idNota: string;
  nomor: string;
  bisaBayar: boolean;
  bisaKoreksi: boolean;
  koreksi: { nota: NotaKoreksi[]; pelanggan: string };
}) {
  if (!bisaBayar && !bisaKoreksi) return null;
  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-sm" variant="ghost" aria-label={`Aksi untuk ${nomor}`}>
            <Ellipsis aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {bisaBayar && (
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/pesanan/${encodeURIComponent(idPesanan)}/pembayaran?nota=${encodeURIComponent(idNota)}`}
              >
                <Plus aria-hidden="true" />
                Catat pembayaran
              </Link>
            </DropdownMenuItem>
          )}
          {bisaKoreksi && (
            <KoreksiDialog
              nota={koreksi.nota}
              pelanggan={koreksi.pelanggan}
              awal={idNota}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <PencilLine aria-hidden="true" />
                  Koreksi status
                </DropdownMenuItem>
              }
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MenuPembayaran({ id, adaBukti, bisaHapus }: { id: string; adaBukti: boolean; bisaHapus: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!adaBukti && !bisaHapus) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label="Aksi pembayaran" disabled={pending}>
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {adaBukti && (
          <DropdownMenuItem asChild>
            <a href={`/api/berkas/pembayaran/${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">
              <Eye aria-hidden="true" />
              Lihat bukti
            </a>
          </DropdownMenuItem>
        )}
        {bisaHapus && (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() =>
              start(async () => {
                if (!window.confirm("Hapus pembayaran ini? Pembayaran tidak lagi dihitung ke tagihan.")) return;
                const r = await hapusPembayaran(id);
                if (r.ok) {
                  toast.success(r.pesan);
                  router.refresh();
                } else toast.error(r.galat);
              })
            }
          >
            <Trash2 aria-hidden="true" />
            Hapus pembayaran
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
