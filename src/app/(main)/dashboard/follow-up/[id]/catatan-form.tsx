"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { FieldHint, FieldMessage, Label } from "@/components/mdp/field-label";
import { Notice } from "@/components/mdp/notice";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_KOMUNIKASI, type StatusKomunikasi } from "@/lib/konstanta";
import { simpanTindakLanjut } from "@/server/actions/follow-up";

function sekarangLokal() {
  const d = new Date(Date.now() + 7 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export function CatatanForm({ idFaktur }: { idFaktur: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [waktu, setWaktu] = useState(sekarangLokal);
  const [status, setStatus] = useState("");
  const [catatan, setCatatan] = useState("");
  const [pengingat, setPengingat] = useState("");
  const [galat, setGalat] = useState<string>();
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await simpanTindakLanjut({ idFaktur, waktu, status: status as StatusKomunikasi, catatan, pengingat });
      if (r.ok) {
        toast.success(r.pesan);
        setStatus("");
        setCatatan("");
        setPengingat("");
        setGalat(undefined);
        setIsian({});
        router.refresh();
        return;
      }
      setGalat(r.galat);
      setIsian(r.isian ?? {});
    });
  };

  return (
    <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
      {galat && Object.values(isian).every((x) => !x) && (
        <Notice nada="danger" icon={CircleAlert} title="Catatan belum dapat disimpan">
          {galat}
        </Notice>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field className="gap-2" data-invalid={Boolean(isian.waktu)}>
          <Label htmlFor="waktu" required>
            Waktu Komunikasi
          </Label>
          <Input
            id="waktu"
            type="datetime-local"
            value={waktu}
            onChange={(e) => setWaktu(e.target.value)}
            aria-invalid={Boolean(isian.waktu)}
          />
          <FieldMessage>{isian.waktu}</FieldMessage>
        </Field>
        <Field className="gap-2" data-invalid={Boolean(isian.status)}>
          <Label htmlFor="status" required>
            Status Komunikasi
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status" className="w-full" aria-invalid={Boolean(isian.status)}>
              <SelectValue placeholder="Pilih status komunikasi" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_KOMUNIKASI.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldMessage>{isian.status}</FieldMessage>
        </Field>
      </div>
      <Field className="gap-2" data-invalid={Boolean(isian.catatan)}>
        <Label htmlFor="catatan" required>
          Catatan
        </Label>
        <Textarea
          id="catatan"
          rows={3}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Ringkas hasil komunikasi, misalnya janji tanggal pembayaran"
          aria-invalid={Boolean(isian.catatan)}
        />
        <FieldMessage>{isian.catatan}</FieldMessage>
      </Field>
      <Field className="gap-2" data-invalid={Boolean(isian.pengingat)}>
        <Label htmlFor="pengingat">Pengingat Berikutnya</Label>
        <Input
          id="pengingat"
          type="datetime-local"
          value={pengingat}
          onChange={(e) => setPengingat(e.target.value)}
          aria-invalid={Boolean(isian.pengingat)}
          aria-describedby="pengingat-ket"
        />
        <FieldHint id="pengingat-ket">Opsional. Muncul di daftar pengingat Admin.</FieldHint>
        <FieldMessage>{isian.pengingat}</FieldMessage>
      </Field>
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/follow-up">Batal</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner aria-hidden="true" />}
          Simpan Catatan
        </Button>
      </div>
    </form>
  );
}
