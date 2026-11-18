"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { CircleAlert, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { FieldHint, FieldMessage, Label } from "@/components/mdp/field-label";
import { Notice } from "@/components/mdp/notice";
import { StatusBadge } from "@/components/mdp/status-badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { koreksiStatus } from "@/server/actions/pembayaran";

export type NotaKoreksi = {
  id: string;
  nomor: string;
  status: string;
  otomatis: string;
  dikoreksi: boolean;
  sisa: number;
};

const PILIHAN = ["Belum Bayar", "Sebagian", "Lunas", "Terlambat"] as const;

export function KoreksiDialog({
  nota,
  pelanggan,
  awal,
  trigger,
}: {
  nota: NotaKoreksi[];
  pelanggan: string;
  awal?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [idNota, setIdNota] = useState(awal ?? nota.find((n) => n.status !== "Lunas")?.id ?? nota[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [alasan, setAlasan] = useState("");
  const [galat, setGalat] = useState<string>();
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  const n = nota.find((x) => x.id === idNota);

  // Pemeriksaan di layar sama dengan aturan server; server tetap memeriksa ulang.
  const tolakLunas = status === "Lunas" && n && n.sisa > 0;

  const simpan = () =>
    start(async () => {
      setGalat(undefined);
      setIsian({});
      const r = await koreksiStatus({ idFaktur: idNota, status: status as (typeof PILIHAN)[number], alasan });
      if (r.ok) {
        toast.success(r.pesan);
        setOpen(false);
        setStatus("");
        setAlasan("");
        router.refresh();
      } else {
        setGalat(r.galat);
        setIsian(r.isian ?? {});
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" disabled={nota.length === 0}>
            <PencilLine aria-hidden="true" />
            Koreksi Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Koreksi Status Tagihan</DialogTitle>
          <DialogDescription>
            {n?.nomor ?? "-"} · {pelanggan}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {nota.length > 1 && (
            <Field className="gap-2">
              <Label htmlFor="koreksi-nota" required>
                Nota Faktur
              </Label>
              <Select value={idNota} onValueChange={setIdNota}>
                <SelectTrigger id="koreksi-nota" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nota.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.nomor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
            <span className="text-muted-foreground flex-1 text-sm">
              {n?.dikoreksi ? "Status saat ini (koreksi manual)" : "Status saat ini (otomatis)"}
            </span>
            {n && <StatusBadge status={n.status} />}
          </div>
          <Field className="gap-2" data-invalid={Boolean(isian.status)}>
            <Label htmlFor="koreksi-status" required>
              Status Baru
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="koreksi-status" className="w-full" aria-invalid={Boolean(isian.status)}>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {PILIHAN.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
                {n?.dikoreksi && <SelectItem value="Otomatis">Kembalikan ke status otomatis ({n.otomatis})</SelectItem>}
              </SelectContent>
            </Select>
            <FieldMessage>{isian.status}</FieldMessage>
          </Field>
          <Field className="gap-2" data-invalid={Boolean(isian.alasan)}>
            <Label htmlFor="koreksi-alasan" required>
              Alasan Koreksi
            </Label>
            <Textarea
              id="koreksi-alasan"
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              aria-invalid={Boolean(isian.alasan)}
              aria-describedby="koreksi-alasan-ket"
            />
            <FieldHint id="koreksi-alasan-ket">Alasan tersimpan di riwayat tagihan.</FieldHint>
            <FieldMessage>{isian.alasan}</FieldMessage>
          </Field>
          {tolakLunas && (
            <Notice nada="danger" icon={CircleAlert} title="Koreksi ke Lunas ditolak">
              Masih ada sisa Rp{n.sisa.toLocaleString("id-ID")} tanpa transaksi terverifikasi. Catat dan verifikasi
              pembayarannya dahulu.
            </Notice>
          )}
          {galat && !tolakLunas && (
            <Notice nada="danger" icon={CircleAlert} title="Koreksi belum tersimpan">
              {galat}
            </Notice>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Batal
          </Button>
          <Button onClick={simpan} disabled={pending || !status || Boolean(tolakLunas)}>
            {pending && <Spinner aria-hidden="true" />}
            Simpan Koreksi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
