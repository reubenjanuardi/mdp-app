"use client";

import { useState } from "react";

import { Check, Copy, TriangleAlert } from "lucide-react";

import { Notice } from "@/components/mdp/notice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Menampilkan password sementara satu kali. Password tidak tersimpan dalam bentuk terbaca di mana pun. */
export function PasswordSementara({
  data,
  onClose,
}: {
  data: { password: string; username: string } | null;
  onClose: () => void;
}) {
  const [disalin, setDisalin] = useState(false);
  return (
    <Dialog
      open={Boolean(data)}
      onOpenChange={(v) => {
        if (!v) {
          setDisalin(false);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Password sementara</DialogTitle>
          <DialogDescription>
            Berikan langsung kepada pemilik akun <span className="font-mono">{data?.username}</span>. Pengguna wajib
            menggantinya saat login.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted flex items-center gap-2 rounded-lg border px-3 py-2">
          <code className="flex-1 font-mono text-base tracking-wider">{data?.password}</code>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if (!data) return;
              await navigator.clipboard.writeText(data.password);
              setDisalin(true);
            }}
          >
            {disalin ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {disalin ? "Tersalin" : "Salin"}
          </Button>
        </div>
        <Notice nada="warning" icon={TriangleAlert} title="Hanya ditampilkan sekali">
          Setelah jendela ini ditutup, password tidak dapat dilihat lagi. Reset ulang bila terlupa.
        </Notice>
        <DialogFooter>
          <Button onClick={onClose}>Selesai</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
