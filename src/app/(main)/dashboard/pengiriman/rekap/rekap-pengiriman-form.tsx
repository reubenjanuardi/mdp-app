"use client";

import { useState, useTransition } from "react";

import { CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { FieldMessage, Label } from "@/components/mdp/field-label";
import { Notice } from "@/components/mdp/notice";
import { SectionCard } from "@/components/mdp/section-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { simpanRekapPengiriman } from "@/server/actions/rekap-operasional";

const awal = {
  tanggal: "", penerima: "", barang: "", keterangan: "", jumlahKoli: "", jumlahSatuan: "", hargaPerPcs: "", total: "", tanggalPembayaran: "", totalPembayaran: "",
};

export function RekapPengirimanForm() {
  const [nilai, setNilai] = useState(awal);
  const [pending, start] = useTransition();
  const [galat, setGalat] = useState<string>();
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});
  const ubah = (k: keyof typeof awal, v: string) => setNilai((lama) => ({ ...lama, [k]: v }));
  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await simpanRekapPengiriman({ ...nilai, tanggal: nilai.tanggal || null, tanggalPembayaran: nilai.tanggalPembayaran || null });
      if (r.ok) { toast.success(r.pesan); setNilai(awal); setGalat(undefined); setIsian({}); return; }
      setGalat(r.galat); setIsian(r.isian ?? {});
    });
  };
  const kolom = (key: keyof typeof awal, label: string, type = "text", wajib = false) => (
    <Field className="gap-2" data-invalid={Boolean(isian[key])}>
      <Label htmlFor={key} required={wajib}>{label}</Label>
      <Input id={key} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} value={nilai[key]} onChange={(e) => ubah(key, e.target.value)} aria-invalid={Boolean(isian[key])} />
      <FieldMessage>{isian[key]}</FieldMessage>
    </Field>
  );
  return <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
    {galat && <Notice nada="danger" icon={CircleAlert} title="Rekap belum dapat disimpan">{galat}</Notice>}
    <SectionCard title="Rekap Pengiriman Barang" description="Mengikuti kolom rekap perusahaan. Tidak membutuhkan PO, resi, TTB, atau dokumen.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {kolom("tanggal", "Tanggal", "date")}{kolom("penerima", "Penerima", "text", true)}
        {kolom("barang", "Barang", "text", true)}{kolom("jumlahKoli", "Jumlah Koli", "number")}
        {kolom("jumlahSatuan", "Jumlah Satuan", "number")}{kolom("hargaPerPcs", "Harga per Pcs", "number")}
        {kolom("total", "Total", "number")}{kolom("tanggalPembayaran", "Tanggal Pembayaran", "date")}
        {kolom("totalPembayaran", "Total Pembayaran", "number")}
        <Field className="gap-2"><Label htmlFor="keterangan">Keterangan</Label><Textarea id="keterangan" rows={3} value={nilai.keterangan} onChange={(e) => ubah("keterangan", e.target.value)} /><FieldMessage>{isian.keterangan}</FieldMessage></Field>
      </div>
    </SectionCard>
    <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending && <Spinner aria-hidden="true" />}Simpan Rekap</Button></div>
  </form>;
}
