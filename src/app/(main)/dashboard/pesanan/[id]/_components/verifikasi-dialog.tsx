"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { FileImage, FileText, Info, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { FieldMessage, Label } from "@/components/mdp/field-label";
import { Kv } from "@/components/mdp/kv";
import { Notice } from "@/components/mdp/notice";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { rupiah, tanggalJam } from "@/lib/format";
import { tolakPembayaran, verifikasiPembayaran } from "@/server/actions/pembayaran";

export type DataVerifikasi = {
  id: string;
  nomorNota: string;
  pelanggan: string;
  nominal: number;
  waktu: string;
  metode: string;
  referensi: string | null;
  penyetor: string;
  berita: string | null;
  namaFile: string | null;
  adaBukti: boolean;
  sisaNota: number;
};

export function VerifikasiDialog({ data }: { data: DataVerifikasi }) {
  const [open, setOpen] = useState(false);
  const [modeTolak, setModeTolak] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [galatAlasan, setGalatAlasan] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();

  const sisaBaru = Math.max(0, data.sisaNota - data.nominal);
  const statusBaru = sisaBaru === 0 ? "Lunas" : "Sebagian";
  const pdf = data.namaFile?.toLowerCase().endsWith(".pdf");
  const urlBukti = `/api/berkas/pembayaran/${encodeURIComponent(data.id)}`;

  const selesai = (r: { ok?: boolean; pesan?: string; galat?: string; isian?: Record<string, string | undefined> }) => {
    if (r.ok) {
      toast.success(r.pesan);
      setOpen(false);
      router.refresh();
    } else if (r.isian?.alasan) setGalatAlasan(r.isian.alasan);
    else toast.error(r.galat ?? "Gagal menyimpan.");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setModeTolak(false);
          setAlasan("");
          setGalatAlasan(undefined);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <ShieldCheck aria-hidden="true" />
          Verifikasi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Verifikasi Pembayaran</DialogTitle>
          <DialogDescription>
            {data.nomorNota} · {data.pelanggan}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href={data.adaBukti ? urlBukti : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!data.adaBukti}
            className="bg-muted hover:bg-muted/70 focus-visible:ring-ring/50 flex h-40 w-full shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border px-3 text-center outline-none focus-visible:ring-3 sm:h-[260px] sm:w-[220px]"
          >
            {pdf ? (
              <FileText className="text-muted-foreground size-7" aria-hidden="true" />
            ) : (
              <FileImage className="text-muted-foreground size-7" aria-hidden="true" />
            )}
            <span className="text-muted-foreground text-xs break-all">{data.namaFile ?? "Tidak ada lampiran"}</span>
            {data.adaBukti && <span className="text-primary text-xs font-medium">Perbesar</span>}
          </a>
          <dl className="flex min-w-0 flex-1 flex-col gap-4">
            <Kv label="Nominal">
              <span className="text-lg leading-7 font-semibold">{rupiah(data.nominal)}</span>
            </Kv>
            <Kv label="Tanggal dan Jam">{tanggalJam(data.waktu)}</Kv>
            <Kv label="Metode">{data.metode}</Kv>
            <Kv label="Nomor Referensi" mono>
              {data.referensi ?? "-"}
            </Kv>
            <Kv label="Nama Penyetor">{data.penyetor}</Kv>
            <Kv label="Berita">{data.berita ?? "-"}</Kv>
          </dl>
        </div>

        {modeTolak ? (
          <Field className="gap-2" data-invalid={Boolean(galatAlasan)}>
            <Label htmlFor="alasan-tolak" required>
              Alasan Penolakan
            </Label>
            <Textarea
              id="alasan-tolak"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Misalnya: nominal di bukti setor tidak sama dengan yang dicatat"
              aria-invalid={Boolean(galatAlasan)}
              aria-describedby={galatAlasan ? "alasan-tolak-galat" : undefined}
              rows={3}
            />
            <FieldMessage id="alasan-tolak-galat">{galatAlasan}</FieldMessage>
          </Field>
        ) : (
          <Notice nada="info" icon={Info} title="Setelah diverifikasi">
            Sisa tagihan menjadi {rupiah(sisaBaru)} dan status{" "}
            {statusBaru === "Lunas" ? "menjadi Lunas" : "tetap Sebagian"}.
          </Notice>
        )}

        <DialogFooter>
          {modeTolak ? (
            <>
              <Button variant="outline" onClick={() => setModeTolak(false)} disabled={pending}>
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => start(async () => selesai(await tolakPembayaran(data.id, alasan)))}
              >
                {pending && <Spinner aria-hidden="true" />}
                Tolak Pembayaran
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={() => setModeTolak(true)} disabled={pending}>
                <X aria-hidden="true" />
                Tolak
              </Button>
              <Button
                disabled={pending}
                onClick={() => start(async () => selesai(await verifikasiPembayaran(data.id)))}
              >
                {pending ? <Spinner aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
                Verifikasi
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
