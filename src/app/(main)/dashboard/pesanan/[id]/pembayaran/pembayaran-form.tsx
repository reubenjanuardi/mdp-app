"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "cn";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { FieldHint, FieldMessage, Label } from "@/components/mdp/field-label";
import { FileDrop } from "@/components/mdp/file-drop";
import { Notice } from "@/components/mdp/notice";
import { NumberInput } from "@/components/mdp/number-input";
import { SectionCard } from "@/components/mdp/section-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { simpanPembayaran } from "@/server/actions/pembayaran";

const METODE = [
  { v: "Transfer", ket: "Antarbank atau sesama bank" },
  { v: "Setor Tunai", ket: "Setoran di teller atau mesin setor" },
] as const;

export function PembayaranForm({
  idPesanan,
  nota,
  awal,
  pelanggan,
}: {
  idPesanan: string;
  nota: { id: string; nomor: string }[];
  awal: string;
  pelanggan: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [idFaktur, setIdFaktur] = useState(awal);
  const [waktu, setWaktu] = useState("");
  const [nominal, setNominal] = useState(Number.NaN);
  const [metode, setMetode] = useState<string>("Transfer");
  const [referensi, setReferensi] = useState("");
  const [penyetor, setPenyetor] = useState(pelanggan);
  const [berita, setBerita] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [galat, setGalat] = useState<string>();
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("idFaktur", idFaktur);
    fd.set("waktu", waktu);
    fd.set("nominal", Number.isNaN(nominal) ? "" : String(nominal));
    fd.set("metode", metode);
    fd.set("referensi", referensi);
    fd.set("penyetor", penyetor);
    fd.set("berita", berita);
    if (file) fd.set("bukti", file);
    start(async () => {
      const r = await simpanPembayaran(fd);
      if (r.ok) {
        toast.success(r.pesan);
        router.push(`/dashboard/pesanan/${encodeURIComponent(idPesanan)}?tab=pembayaran`);
        return;
      }
      setGalat(r.galat);
      setIsian(r.isian ?? {});
    });
  };

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
      {galat && (
        <Notice nada="danger" icon={CircleAlert} title="Pembayaran belum dapat disimpan">
          {galat}
        </Notice>
      )}
      <SectionCard title="Data Transaksi">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {nota.length > 1 && (
            <Field className="gap-2 md:col-span-2" data-invalid={Boolean(isian.idFaktur)}>
              <Label htmlFor="idFaktur" required>
                Nota Faktur
              </Label>
              <Select
                value={idFaktur}
                onValueChange={(v) => {
                  setIdFaktur(v);
                  router.replace(`?nota=${encodeURIComponent(v)}`, { scroll: false });
                }}
              >
                <SelectTrigger id="idFaktur" className="w-full" aria-invalid={Boolean(isian.idFaktur)}>
                  <SelectValue placeholder="Pilih nota" />
                </SelectTrigger>
                <SelectContent>
                  {nota.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.nomor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldMessage>{isian.idFaktur}</FieldMessage>
            </Field>
          )}
          <Field className="gap-2" data-invalid={Boolean(isian.waktu)}>
            <Label htmlFor="waktu" required>
              Tanggal dan Jam Transaksi
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
          <Field className="gap-2" data-invalid={Boolean(isian.nominal)}>
            <Label htmlFor="nominal" required>
              Nominal
            </Label>
            <NumberInput
              id="nominal"
              prefix="Rp"
              value={nominal}
              onChange={setNominal}
              aria-invalid={Boolean(isian.nominal)}
              aria-describedby="nominal-ket"
            />
            <FieldHint id="nominal-ket">Nominal negatif ditolak.</FieldHint>
            <FieldMessage>{isian.nominal}</FieldMessage>
          </Field>
          <fieldset className="flex flex-col gap-2 md:col-span-2">
            <legend className="mb-2 text-sm font-medium">
              Metode{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </legend>
            <RadioGroup value={metode} onValueChange={setMetode} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {METODE.map((m) => (
                <label
                  key={m.v}
                  htmlFor={`metode-${m.v}`}
                  className={cn(
                    "bg-background flex items-start gap-2.5 rounded-lg border p-3",
                    metode === m.v && "border-primary bg-highlight border-2 p-[11px]",
                  )}
                >
                  <RadioGroupItem id={`metode-${m.v}`} value={m.v} className="mt-0.5" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{m.v}</span>
                    <span className="text-muted-foreground text-xs">{m.ket}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
            <FieldMessage>{isian.metode}</FieldMessage>
          </fieldset>
          <Field className="gap-2" data-invalid={Boolean(isian.referensi)}>
            <Label htmlFor="referensi" required>
              Nomor Referensi Transaksi
            </Label>
            <Input
              id="referensi"
              value={referensi}
              onChange={(e) => setReferensi(e.target.value)}
              aria-invalid={Boolean(isian.referensi)}
            />
            <FieldMessage>{isian.referensi}</FieldMessage>
          </Field>
          <Field className="gap-2" data-invalid={Boolean(isian.penyetor)}>
            <Label htmlFor="penyetor" required>
              Nama Penyetor
            </Label>
            <Input
              id="penyetor"
              value={penyetor}
              onChange={(e) => setPenyetor(e.target.value)}
              aria-invalid={Boolean(isian.penyetor)}
            />
            <FieldMessage>{isian.penyetor}</FieldMessage>
          </Field>
          <Field className="gap-2 md:col-span-2">
            <Label htmlFor="berita">Berita Transaksi</Label>
            <Input id="berita" value={berita} onChange={(e) => setBerita(e.target.value)} placeholder="Opsional" />
          </Field>
          <div className="flex flex-col gap-2 md:col-span-2">
            <p className="text-sm font-medium">
              Bukti Transaksi{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </p>
            <FileDrop
              name="bukti"
              judul="Unggah bukti setor"
              file={file}
              onChange={(f, g) => {
                setFile(f);
                setIsian((s) => ({ ...s, bukti: g }));
              }}
              invalid={Boolean(isian.bukti)}
              galatId="bukti-galat"
            />
            <FieldHint>Foto atau PDF bukti setor, maks. 5 MB.</FieldHint>
            <FieldMessage id="bukti-galat">{isian.bukti}</FieldMessage>
          </div>
        </div>
      </SectionCard>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <p className="text-muted-foreground flex-1 text-xs">Pembayaran tersimpan dengan status Menunggu Verifikasi.</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/pesanan/${encodeURIComponent(idPesanan)}?tab=pembayaran`}>Batal</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner aria-hidden="true" />}
          Simpan Pembayaran
        </Button>
      </div>
    </form>
  );
}
