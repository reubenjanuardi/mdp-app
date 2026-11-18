"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { hapusPesanan } from "@/server/actions/pesanan";

export function HapusPesanan({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const hapus = () =>
    start(async () => {
      const r = await hapusPesanan(id);
      if (r.ok) {
        toast.success(r.pesan);
        setOpen(false);
        router.push("/dashboard/pesanan");
      } else toast.error(r.galat ?? "Pesanan gagal dihapus.");
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 aria-hidden="true" />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus {id}?</AlertDialogTitle>
          <AlertDialogDescription>
            Pesanan hilang dari daftar dan pencarian, tetapi data, tagihan, pembayaran, dan pengirimannya tetap
            tersimpan di basis data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <Button variant="destructive" onClick={hapus} disabled={pending}>
            {pending && <Spinner aria-hidden="true" />}
            Hapus Pesanan
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
