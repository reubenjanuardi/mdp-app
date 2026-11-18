"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Stack, Td } from "@/components/mdp/data-table";
import { StatusBadge } from "@/components/mdp/status-badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { PERAN } from "@/lib/konstanta";
import { resetPassword, setAktif, ubahPeran } from "@/server/actions/pengguna";

import { PasswordSementara } from "./password-sementara";

export type DataPengguna = {
  id: string;
  nama: string;
  email: string | null;
  username: string;
  peran: string;
  aktif: boolean;
  loginTerakhir: string;
};

export function BarisPengguna({ u, diriSendiri }: { u: DataPengguna; diriSendiri: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reset, setReset] = useState(false);
  const [hasil, setHasil] = useState<{ password: string; username: string } | null>(null);

  const jalankan = (fn: () => Promise<{ ok?: boolean; pesan?: string; galat?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(r.pesan);
        router.refresh();
      } else toast.error(r.galat);
    });

  return (
    <tr className="hover:bg-muted/40">
      <Td className="h-14">
        <Stack utama={<span className="font-medium">{u.nama}</span>} ket={u.email} className="min-w-44" />
      </Td>
      <Td>
        <span className="font-mono text-xs">{u.username}</span>
      </Td>
      <Td>
        <Select
          value={u.peran}
          onValueChange={(v) => jalankan(() => ubahPeran(u.id, v))}
          disabled={diriSendiri || pending}
        >
          <SelectTrigger className="w-44" aria-label={`Peran ${u.nama}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERAN.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Td>
      <Td>
        <div className="flex items-center gap-2">
          <Switch
            checked={u.aktif}
            onCheckedChange={(v) => jalankan(() => setAktif(u.id, v))}
            disabled={diriSendiri || pending}
            aria-label={`${u.aktif ? "Nonaktifkan" : "Aktifkan"} akun ${u.nama}`}
          />
          <StatusBadge status={u.aktif ? "Aktif" : "Nonaktif"} />
        </div>
      </Td>
      <Td className="text-muted-foreground text-xs whitespace-nowrap">{u.loginTerakhir}</Td>
      <Td>
        {diriSendiri ? (
          <span className="text-muted-foreground text-xs whitespace-nowrap">Akun Anda</span>
        ) : (
          <>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Reset password ${u.nama}`}
              onClick={() => setReset(true)}
              disabled={pending}
            >
              {pending ? <Spinner aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
            </Button>
            <AlertDialog open={reset} onOpenChange={setReset}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset password {u.nama}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Password lama tidak berlaku lagi dan semua sesi {u.nama} berakhir. Sistem membuat password sementara
                    yang wajib diganti saat login berikutnya.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <Button
                    onClick={() =>
                      start(async () => {
                        const r = await resetPassword(u.id);
                        setReset(false);
                        if (r.ok && r.data) {
                          setHasil(r.data);
                          router.refresh();
                        } else toast.error(r.galat);
                      })
                    }
                  >
                    Reset Password
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <PasswordSementara data={hasil} onClose={() => setHasil(null)} />
          </>
        )}
      </Td>
    </tr>
  );
}
