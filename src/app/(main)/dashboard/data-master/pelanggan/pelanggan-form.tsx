"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FieldMessage, Label } from "@/components/mdp/field-label";
import { SectionCard } from "@/components/mdp/section-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { simpanPelanggan } from "@/server/actions/master";

type Lokasi = { kunci: string; id?: string; nama: string; alamat: string };

export function PelangganForm({
  awal,
  tutupHref,
}: {
  awal?: {
    id: string;
    nama: string;
    alamat: string;
    telepon: string;
    kontak: string;
    lokasi: { id: string; nama: string; alamat: string }[];
  };
  tutupHref: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [nama, setNama] = useState(awal?.nama ?? "");
  const [alamat, setAlamat] = useState(awal?.alamat ?? "");
  const [telepon, setTelepon] = useState(awal?.telepon ?? "");
  const [kontak, setKontak] = useState(awal?.kontak ?? "");
  const [lokasi, setLokasi] = useState<Lokasi[]>(awal?.lokasi.map((l) => ({ ...l, kunci: l.id })) ?? []);
  const [baruNama, setBaruNama] = useState("");
  const [baruAlamat, setBaruAlamat] = useState("");
  const [tambah, setTambah] = useState(!awal);
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});

  const tambahLokasi = () => {
    if (!baruNama.trim()) return setIsian((s) => ({ ...s, baruNama: "Isi nama lokasi, misalnya Gudang Cikarang." }));
    setLokasi((s) => [...s, { kunci: crypto.randomUUID(), nama: baruNama.trim(), alamat: baruAlamat.trim() }]);
    setBaruNama("");
    setBaruAlamat("");
    setIsian((s) => ({ ...s, baruNama: undefined, lokasi: undefined }));
    setTambah(false);
  };

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await simpanPelanggan({
        id: awal?.id,
        nama,
        alamat,
        telepon,
        kontak,
        lokasi: lokasi.map(({ id, nama: n, alamat: a }) => ({ id, nama: n, alamat: a })),
      });
      if (r.ok) {
        toast.success(r.pesan);
        router.replace(tutupHref, { scroll: false });
        router.refresh();
      } else setIsian(r.isian ?? { umum: r.galat });
    });
  };

  return (
    <SectionCard title={awal ? "Ubah Pelanggan" : "Tambah Pelanggan"}>
      <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
        <Field className="gap-2" data-invalid={Boolean(isian.nama)}>
          <Label htmlFor="nama" required>
            Nama Perusahaan
          </Label>
          <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} aria-invalid={Boolean(isian.nama)} />
          <FieldMessage>{isian.nama}</FieldMessage>
        </Field>
        <Field className="gap-2" data-invalid={Boolean(isian.alamat)}>
          <Label htmlFor="alamat" required>
            Alamat
          </Label>
          <Textarea
            id="alamat"
            rows={2}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            aria-invalid={Boolean(isian.alamat)}
          />
          <FieldMessage>{isian.alamat}</FieldMessage>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field className="gap-2">
            <Label htmlFor="telepon">Telepon / Faks</Label>
            <Input id="telepon" type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} />
          </Field>
          <Field className="gap-2">
            <Label htmlFor="kontak">Kontak</Label>
            <Input id="kontak" value={kontak} onChange={(e) => setKontak(e.target.value)} />
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">
            Lokasi Pengiriman{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </legend>
          {lokasi.map((l) => (
            <div key={l.kunci} className="flex items-start gap-2.5 rounded-lg border p-3">
              <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{l.nama}</span>
                {l.alamat && <span className="text-muted-foreground text-xs">{l.alamat}</span>}
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={`Hapus lokasi ${l.nama}`}
                onClick={() => setLokasi((s) => s.filter((x) => x.kunci !== l.kunci))}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          {tambah ? (
            <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-3">
              <Field className="gap-1.5" data-invalid={Boolean(isian.baruNama)}>
                <Label htmlFor="lokasi-nama">Nama lokasi</Label>
                <Input
                  id="lokasi-nama"
                  value={baruNama}
                  onChange={(e) => setBaruNama(e.target.value)}
                  placeholder="Contoh: Gudang Cikarang"
                />
                <FieldMessage>{isian.baruNama}</FieldMessage>
              </Field>
              <Field className="gap-1.5">
                <Label htmlFor="lokasi-alamat">Alamat lokasi</Label>
                <Input
                  id="lokasi-alamat"
                  value={baruAlamat}
                  onChange={(e) => setBaruAlamat(e.target.value)}
                  placeholder="Contoh: Kawasan Industri Jababeka Blok C-12"
                />
              </Field>
              <div className="flex justify-end gap-2">
                {lokasi.length > 0 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setTambah(false)}>
                    Batal
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" onClick={tambahLokasi}>
                  Tambahkan
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="ghost" className="w-fit" onClick={() => setTambah(true)}>
              <Plus aria-hidden="true" />
              Tambah Lokasi
            </Button>
          )}
          <FieldMessage>{isian.lokasi}</FieldMessage>
        </fieldset>
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
