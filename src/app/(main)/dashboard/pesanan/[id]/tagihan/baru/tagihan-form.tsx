"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CircleAlert, Lock } from "lucide-react";
import { toast } from "sonner";

import { FieldHint, FieldMessage, Label } from "@/components/mdp/field-label";
import { FileDrop } from "@/components/mdp/file-drop";
import { SumRow } from "@/components/mdp/kv";
import { Notice } from "@/components/mdp/notice";
import { NumberInput } from "@/components/mdp/number-input";
import { SectionCard } from "@/components/mdp/section-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { angka, rupiah, tanggal } from "@/lib/format";
import { simpanTagihan } from "@/server/actions/tagihan";

type Baris = { id: string; nama: string; satuan: string; harga: number; sisa: number };

export function TagihanForm({
  idPesanan,
  pelanggan,
  jatuhTempo,
  ppn,
  baris,
}: {
  idPesanan: string;
  pelanggan: string;
  jatuhTempo: string | null;
  ppn: boolean;
  baris: Baris[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [nomor, setNomor] = useState("");
  const [tgl, setTgl] = useState("");
  const [banyak, setBanyak] = useState<Record<string, number>>(Object.fromEntries(baris.map((b) => [b.id, b.sisa])));
  const [file, setFile] = useState<File | null>(null);
  const [galat, setGalat] = useState<string>();
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});

  const sub = baris.reduce((s, b) => s + Math.round((Number.isNaN(banyak[b.id]) ? 0 : banyak[b.id]) * b.harga), 0);
  const nilaiPpn = ppn ? Math.round(sub * 0.11) : 0;

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("idPesanan", idPesanan);
    fd.set("nomorNota", nomor);
    fd.set("tanggalNota", tgl);
    fd.set(
      "baris",
      JSON.stringify(
        baris.map((b) => ({ idPesananBarang: b.id, banyaknya: Number.isNaN(banyak[b.id]) ? 0 : banyak[b.id] })),
      ),
    );
    if (file) fd.set("lampiran", file);
    start(async () => {
      const r = await simpanTagihan(fd);
      if (r.ok) {
        toast.success(r.pesan);
        router.push(`/dashboard/pesanan/${encodeURIComponent(idPesanan)}?tab=tagihan`);
        return;
      }
      setGalat(r.galat);
      setIsian(r.isian ?? {});
    });
  };

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
      {galat && (
        <Notice nada="danger" icon={CircleAlert} title="Tagihan belum dapat disimpan">
          {galat}
        </Notice>
      )}
      <SectionCard title="Nota Faktur">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field className="gap-2" data-invalid={Boolean(isian.nomorNota)}>
            <Label htmlFor="nomorNota" required>
              No. Nota Faktur
            </Label>
            <Input
              id="nomorNota"
              value={nomor}
              onChange={(e) => setNomor(e.target.value)}
              placeholder="Contoh: NF/10/2026/0095"
              aria-invalid={Boolean(isian.nomorNota)}
            />
            <FieldMessage>{isian.nomorNota}</FieldMessage>
          </Field>
          <Field className="gap-2" data-invalid={Boolean(isian.tanggalNota)}>
            <Label htmlFor="tanggalNota" required>
              Tanggal Nota
            </Label>
            <Input
              id="tanggalNota"
              type="date"
              value={tgl}
              onChange={(e) => setTgl(e.target.value)}
              aria-invalid={Boolean(isian.tanggalNota)}
            />
            <FieldMessage>{isian.tanggalNota}</FieldMessage>
          </Field>
          <Field className="gap-2">
            <Label htmlFor="pelanggan">Pelanggan</Label>
            <Input
              id="pelanggan"
              value={pelanggan}
              readOnly
              className="bg-muted text-muted-foreground"
              aria-describedby="pelanggan-ket"
            />
            <FieldHint id="pelanggan-ket">Diambil dari pesanan.</FieldHint>
          </Field>
          <Field className="gap-2">
            <Label htmlFor="jt">Jatuh Tempo</Label>
            <div className="bg-muted border-input flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm">
              <span id="jt" className="text-muted-foreground flex-1">
                {jatuhTempo ? tanggal(jatuhTempo) : "Belum diisi di PO"}
              </span>
              <Lock className="text-muted-foreground size-4" aria-hidden="true" />
            </div>
            <FieldHint>Diambil dari PO, karena tidak tercantum di nota.</FieldHint>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Barang Ditagihkan" description="Isi banyaknya barang yang ditagihkan pada nota ini.">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="bg-muted">
                <th scope="col" className="h-10 px-3 text-left font-medium">
                  Nama Barang
                </th>
                <th scope="col" className="h-10 w-32 px-3 text-right font-medium">
                  Sisa di PO
                </th>
                <th scope="col" className="h-10 w-36 px-3 text-left font-medium">
                  Banyaknya
                </th>
                <th scope="col" className="h-10 w-28 px-3 text-right font-medium">
                  Harga Satuan
                </th>
                <th scope="col" className="h-10 w-36 px-3 text-right font-medium">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => {
                const n = Number.isNaN(banyak[b.id]) ? 0 : banyak[b.id];
                return (
                  <tr key={b.id} className="border-t">
                    <td className="h-12 px-3 font-medium">{b.nama}</td>
                    <td className="text-muted-foreground px-3 text-right whitespace-nowrap tabular-nums">
                      {angka(b.sisa)} {b.satuan}
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput
                        aria-label={`Banyaknya ${b.nama}`}
                        value={banyak[b.id]}
                        onChange={(v) => setBanyak((s) => ({ ...s, [b.id]: v }))}
                        aria-invalid={Boolean(isian[`baris.${b.id}`])}
                        disabled={b.sisa === 0}
                      />
                      <FieldMessage>{isian[`baris.${b.id}`]}</FieldMessage>
                    </td>
                    <td className="px-3 text-right tabular-nums">{rupiah(b.harga)}</td>
                    <td className="px-3 text-right font-medium tabular-nums">{rupiah(Math.round(n * b.harga))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <FieldMessage>{isian.barang}</FieldMessage>
        <div className="flex justify-end">
          <div className="flex w-full max-w-80 flex-col gap-2">
            <SumRow label="Subtotal" value={rupiah(sub)} />
            {ppn && <SumRow label="PPN 11%" value={rupiah(nilaiPpn)} />}
            <div className="bg-border h-px" />
            <SumRow label="Total Tagihan" value={rupiah(sub + nilaiPpn)} strong />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Lampiran Nota">
        <FileDrop
          name="lampiran"
          judul="Unggah hasil pindai nota"
          ket="Opsional · JPG, PNG, atau PDF, maks. 5 MB"
          file={file}
          onChange={(f, g) => {
            setFile(f);
            setIsian((s) => ({ ...s, lampiran: g }));
          }}
          invalid={Boolean(isian.lampiran)}
          galatId="lampiran-galat"
        />
        <FieldMessage id="lampiran-galat">{isian.lampiran}</FieldMessage>
      </SectionCard>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <p className="text-muted-foreground flex-1 text-xs">Tagihan baru berstatus Belum Bayar.</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/pesanan/${encodeURIComponent(idPesanan)}`}>Batal</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner aria-hidden="true" />}
          Simpan Tagihan
        </Button>
      </div>
    </form>
  );
}
