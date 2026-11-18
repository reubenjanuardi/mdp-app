"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { FieldHint, FieldMessage, Label } from "@/components/mdp/field-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PERAN, type Peran } from "@/lib/konstanta";
import { tambahPengguna } from "@/server/actions/pengguna";

import { PasswordSementara } from "./password-sementara";

export function TambahPengguna() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [peran, setPeran] = useState("");
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});
  const [hasil, setHasil] = useState<{ password: string; username: string } | null>(null);

  const kosongkan = () => {
    setNama("");
    setUsername("");
    setEmail("");
    setPeran("");
    setIsian({});
  };

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await tambahPengguna({ nama, username, email, peran: peran as Peran });
      if (r.ok && r.data) {
        toast.success(r.pesan);
        setOpen(false);
        kosongkan();
        setHasil(r.data);
        router.refresh();
      } else setIsian(r.isian ?? {});
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) kosongkan();
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <UserPlus aria-hidden="true" />
            Tambah Pengguna
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg">Tambah Pengguna</DialogTitle>
            <DialogDescription>
              Akun baru langsung aktif. Pengguna wajib mengganti password saat login pertama.
            </DialogDescription>
          </DialogHeader>
          <form id="form-pengguna" onSubmit={simpan} noValidate className="flex flex-col gap-4">
            <Field className="gap-2" data-invalid={Boolean(isian.nama)}>
              <Label htmlFor="pg-nama" required>
                Nama Lengkap
              </Label>
              <Input
                id="pg-nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                aria-invalid={Boolean(isian.nama)}
              />
              <FieldMessage>{isian.nama}</FieldMessage>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field className="gap-2" data-invalid={Boolean(isian.username)}>
                <Label htmlFor="pg-username" required>
                  Username
                </Label>
                <Input
                  id="pg-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  aria-invalid={Boolean(isian.username)}
                />
                <FieldMessage>{isian.username}</FieldMessage>
              </Field>
              <Field className="gap-2" data-invalid={Boolean(isian.peran)}>
                <Label htmlFor="pg-peran" required>
                  Peran
                </Label>
                <Select value={peran} onValueChange={setPeran}>
                  <SelectTrigger id="pg-peran" className="w-full" aria-invalid={Boolean(isian.peran)}>
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERAN.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldMessage>{isian.peran}</FieldMessage>
              </Field>
            </div>
            <Field className="gap-2" data-invalid={Boolean(isian.email)}>
              <Label htmlFor="pg-email" required>
                Email
              </Label>
              <Input
                id="pg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(isian.email)}
              />
              <FieldMessage>{isian.email}</FieldMessage>
            </Field>
            <FieldHint>Password sementara dibuat otomatis dan ditampilkan sekali setelah akun tersimpan.</FieldHint>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" form="form-pengguna" disabled={pending}>
              {pending && <Spinner aria-hidden="true" />}
              Simpan Pengguna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PasswordSementara data={hasil} onClose={() => setHasil(null)} />
    </>
  );
}
