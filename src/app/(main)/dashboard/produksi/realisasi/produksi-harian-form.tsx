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
import { simpanProduksiHarian } from "@/server/actions/rekap-operasional";

type Nilai = { tanggal: string; mesin: "Cupseal" | "Rubber Seal"; nomorOperator: string; operator: string; kodeProduk: string; jumlahHasil: string; catatan: string };
const awal: Nilai = { tanggal: "", mesin: "Cupseal", nomorOperator: "", operator: "", kodeProduk: "", jumlahHasil: "", catatan: "" };

export function ProduksiHarianForm() {
  const [nilai, setNilai] = useState(awal);
  const [pending, start] = useTransition();
  const [galat, setGalat] = useState<string>();
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});
  const ubah = (k: keyof Nilai, v: string) => setNilai((lama) => ({ ...lama, [k]: v } as Nilai));
  const simpan = (e: React.FormEvent) => { e.preventDefault(); start(async () => {
    const r = await simpanProduksiHarian(nilai);
    if (r.ok) { toast.success(r.pesan); setNilai(awal); setGalat(undefined); setIsian({}); return; }
    setGalat(r.galat); setIsian(r.isian ?? {});
  }); };
  const input = (key: keyof typeof awal, label: string, type = "text", wajib = false) => <Field className="gap-2" data-invalid={Boolean(isian[key])}><Label htmlFor={key} required={wajib}>{label}</Label><Input id={key} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} value={nilai[key]} onChange={(e) => ubah(key, e.target.value)} aria-invalid={Boolean(isian[key])} /><FieldMessage>{isian[key]}</FieldMessage></Field>;
  return <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
    {galat && <Notice nada="danger" icon={CircleAlert} title="Realisasi belum dapat disimpan">{galat}</Notice>}
    <SectionCard title="Realisasi Produksi Harian" description="Mengikuti kolom laporan Cupseal dan Rubber Seal: tanggal, mesin, operator, kode produk, jumlah.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {input("tanggal", "Tanggal", "date", true)}
        <Field className="gap-2" data-invalid={Boolean(isian.mesin)}><Label htmlFor="mesin" required>Mesin</Label><select id="mesin" value={nilai.mesin} onChange={(e) => ubah("mesin", e.target.value)} className="border-input bg-background h-9 rounded-md border px-3 text-sm"><option>Cupseal</option><option>Rubber Seal</option></select><FieldMessage>{isian.mesin}</FieldMessage></Field>
        {input("nomorOperator", "No. Operator", "number")}{input("operator", "Nama Operator", "text", true)}
        {input("kodeProduk", "Kode Produk", "text", true)}{input("jumlahHasil", "Jumlah Hasil", "number", true)}
        <Field className="gap-2 md:col-span-2"><Label htmlFor="catatan">Catatan</Label><Textarea id="catatan" rows={3} value={nilai.catatan} onChange={(e) => ubah("catatan", e.target.value)} /><FieldMessage>{isian.catatan}</FieldMessage></Field>
      </div>
    </SectionCard>
    <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending && <Spinner aria-hidden="true" />}Simpan Realisasi</Button></div>
  </form>;
}
