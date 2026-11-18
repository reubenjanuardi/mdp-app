"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { FieldMessage, Label } from "@/components/mdp/field-label";
import { NumberInput } from "@/components/mdp/number-input";
import { SectionCard } from "@/components/mdp/section-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { simpanBarang } from "@/server/actions/master";

export function BarangForm({
  awal,
  satuan,
  tutupHref,
}: {
  awal?: { id: string; kode: string; nama: string; spesifikasi: string; satuan: string; harga: number };
  satuan: string[];
  tutupHref: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kode, setKode] = useState(awal?.kode ?? "");
  const [nama, setNama] = useState(awal?.nama ?? "");
  const [spek, setSpek] = useState(awal?.spesifikasi ?? "");
  const [sat, setSat] = useState(awal?.satuan ?? "");
  const [harga, setHarga] = useState(awal?.harga ?? Number.NaN);
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await simpanBarang({
        id: awal?.id,
        kode,
        nama,
        spesifikasi: spek,
        satuan: sat,
        harga: Number.isNaN(harga) ? "" : harga,
      });
      if (r.ok) {
        toast.success(r.pesan);
        router.replace(tutupHref, { scroll: false });
        router.refresh();
      } else setIsian(r.isian ?? { umum: r.galat });
    });
  };

  return (
    <SectionCard title={awal ? "Ubah Barang" : "Tambah Barang"}>
      <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
        <Field className="gap-2" data-invalid={Boolean(isian.kode)}>
          <Label htmlFor="kode" required>
            Kode Barang
          </Label>
          <Input
            id="kode"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            placeholder="Contoh: SC-20"
            aria-invalid={Boolean(isian.kode)}
          />
          <FieldMessage>{isian.kode}</FieldMessage>
        </Field>
        <Field className="gap-2" data-invalid={Boolean(isian.nama)}>
          <Label htmlFor="nama-barang" required>
            Nama Barang
          </Label>
          <Input
            id="nama-barang"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            aria-invalid={Boolean(isian.nama)}
          />
          <FieldMessage>{isian.nama}</FieldMessage>
        </Field>
        <Field className="gap-2">
          <Label htmlFor="spek">Spesifikasi</Label>
          <Textarea id="spek" rows={2} value={spek} onChange={(e) => setSpek(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field className="gap-2" data-invalid={Boolean(isian.satuan)}>
            <Label htmlFor="satuan" required>
              Satuan
            </Label>
            <Input
              id="satuan"
              list="daftar-satuan"
              value={sat}
              onChange={(e) => setSat(e.target.value)}
              placeholder="buah"
              aria-invalid={Boolean(isian.satuan)}
            />
            <datalist id="daftar-satuan">
              {satuan.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <FieldMessage>{isian.satuan}</FieldMessage>
          </Field>
          <Field className="gap-2" data-invalid={Boolean(isian.harga)}>
            <Label htmlFor="harga" required>
              Harga Acuan
            </Label>
            <NumberInput id="harga" prefix="Rp" value={harga} onChange={setHarga} aria-invalid={Boolean(isian.harga)} />
            <FieldMessage>{isian.harga}</FieldMessage>
          </Field>
        </div>
        {isian.umum && <FieldMessage>{isian.umum}</FieldMessage>}
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href={tutupHref} scroll={false}>
              Batal
            </Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner aria-hidden="true" />}
            Simpan
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
