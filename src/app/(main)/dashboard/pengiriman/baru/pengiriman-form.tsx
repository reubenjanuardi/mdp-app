"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "cn";
import { CircleAlert, Hand, Truck } from "lucide-react";
import { toast } from "sonner";

import { FieldMessage, Label } from "@/components/mdp/field-label";
import { FileDrop } from "@/components/mdp/file-drop";
import { Notice } from "@/components/mdp/notice";
import { SearchSelect } from "@/components/mdp/search-select";
import { SectionCard } from "@/components/mdp/section-card";
import { SegmentPilihan } from "@/components/mdp/segment-pilihan";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { simpanPengiriman } from "@/server/actions/pengiriman";

type Jenis = "Ekspedisi" | "Antar Langsung";

const JENIS: { v: Jenis; ket: string; Icon: typeof Truck }[] = [
  { v: "Ekspedisi", ket: "Nama ekspedisi, nomor resi, tanggal kirim, jumlah koli", Icon: Truck },
  { v: "Antar Langsung", ket: "Nomor Tanda Terima Barang dan tanggal", Icon: Hand },
];

export function PengirimanForm({
  pesanan,
  awal,
  ekspedisi,
}: {
  pesanan: { id: string; pelanggan: string }[];
  awal: string;
  ekspedisi: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [idPesanan, setIdPesanan] = useState(awal);
  const [jenis, setJenis] = useState<Jenis>("Ekspedisi");
  const [namaEks, setNamaEks] = useState(ekspedisi[0] ?? "");
  const [resi, setResi] = useState("");
  const [ttb, setTtb] = useState("");
  const [tgl, setTgl] = useState("");
  const [koli, setKoli] = useState("");
  const [status, setStatus] = useState("Dalam Kirim");
  const [file, setFile] = useState<File | null>(null);
  const [galat, setGalat] = useState<string>();
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("idPesanan", idPesanan);
    fd.set("jenis", jenis);
    fd.set("ekspedisi", namaEks);
    fd.set("nomorResi", resi);
    fd.set("nomorTtb", ttb);
    fd.set("tanggal", tgl);
    fd.set("koli", koli);
    fd.set("status", status);
    if (file) fd.set("dokumen", file);
    start(async () => {
      const r = await simpanPengiriman(fd);
      if (r.ok && r.data) {
        toast.success(r.pesan);
        router.push(`/dashboard/pengiriman?pilih=${encodeURIComponent(r.data.id)}`);
        return;
      }
      setGalat(r.galat);
      setIsian(r.isian ?? {});
    });
  };

  return (
    <form onSubmit={kirim} noValidate className="flex flex-col gap-4">
      {galat && (
        <Notice nada="danger" icon={CircleAlert} title="Pengiriman belum dapat disimpan">
          {galat}
        </Notice>
      )}
      <SectionCard title="Data Pengiriman">
        <Field className="gap-2" data-invalid={Boolean(isian.idPesanan)}>
          <Label htmlFor="idPesanan" required>
            Pesanan
          </Label>
          <SearchSelect
            id="idPesanan"
            value={idPesanan}
            onChange={(v) => {
              setIdPesanan(v);
              router.replace(`?pesanan=${encodeURIComponent(v)}`, { scroll: false });
            }}
            options={pesanan.map((p) => ({ value: p.id, label: `${p.id} · ${p.pelanggan}`, cari: p.pelanggan }))}
            placeholder="Pilih pesanan"
            searchPlaceholder="Cari no. PO atau pelanggan"
            empty="Pesanan tidak ditemukan."
            invalid={Boolean(isian.idPesanan)}
          />
          <FieldMessage>{isian.idPesanan}</FieldMessage>
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">
            Jenis Pengiriman{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </legend>
          <div role="radiogroup" aria-label="Jenis pengiriman" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {JENIS.map(({ v, ket, Icon }) => {
              const aktif = jenis === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={aktif}
                  onClick={() => setJenis(v)}
                  className={cn(
                    "bg-background focus-visible:ring-ring/50 flex items-start gap-3 rounded-lg border p-3.5 text-left outline-none focus-visible:ring-3",
                    aktif && "border-primary bg-highlight border-2 p-[13px]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      aktif ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{v}</span>
                    <span className="text-muted-foreground text-xs">{ket}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {jenis === "Ekspedisi" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field className="gap-2" data-invalid={Boolean(isian.ekspedisi)}>
              <Label htmlFor="ekspedisi" required>
                Nama Ekspedisi
              </Label>
              <Input
                id="ekspedisi"
                list="daftar-ekspedisi"
                value={namaEks}
                onChange={(e) => setNamaEks(e.target.value)}
                aria-invalid={Boolean(isian.ekspedisi)}
              />
              <datalist id="daftar-ekspedisi">
                {ekspedisi.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
              <FieldMessage>{isian.ekspedisi}</FieldMessage>
            </Field>
            <Field className="gap-2" data-invalid={Boolean(isian.nomorResi)}>
              <Label htmlFor="nomorResi" required>
                Nomor Resi
              </Label>
              <Input
                id="nomorResi"
                value={resi}
                onChange={(e) => setResi(e.target.value)}
                placeholder="Masukkan nomor resi"
                aria-invalid={Boolean(isian.nomorResi)}
              />
              <FieldMessage>{isian.nomorResi}</FieldMessage>
            </Field>
            <Field className="gap-2" data-invalid={Boolean(isian.tanggal)}>
              <Label htmlFor="tanggal" required>
                Tanggal Kirim
              </Label>
              <Input
                id="tanggal"
                type="date"
                value={tgl}
                onChange={(e) => setTgl(e.target.value)}
                aria-invalid={Boolean(isian.tanggal)}
              />
              <FieldMessage>{isian.tanggal}</FieldMessage>
            </Field>
            <Field className="gap-2" data-invalid={Boolean(isian.koli)}>
              <Label htmlFor="koli" required>
                Jumlah Koli
              </Label>
              <Input
                id="koli"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={koli}
                onChange={(e) => setKoli(e.target.value)}
                aria-invalid={Boolean(isian.koli)}
              />
              <FieldMessage>{isian.koli}</FieldMessage>
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field className="gap-2" data-invalid={Boolean(isian.nomorTtb)}>
              <Label htmlFor="nomorTtb" required>
                No. Tanda Terima Barang
              </Label>
              <Input
                id="nomorTtb"
                value={ttb}
                onChange={(e) => setTtb(e.target.value)}
                placeholder="Contoh: TTB/11/2026/0240"
                aria-invalid={Boolean(isian.nomorTtb)}
              />
              <FieldMessage>{isian.nomorTtb}</FieldMessage>
            </Field>
            <Field className="gap-2" data-invalid={Boolean(isian.tanggal)}>
              <Label htmlFor="tanggal" required>
                Tanggal
              </Label>
              <Input
                id="tanggal"
                type="date"
                value={tgl}
                onChange={(e) => setTgl(e.target.value)}
                aria-invalid={Boolean(isian.tanggal)}
              />
              <FieldMessage>{isian.tanggal}</FieldMessage>
            </Field>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            {jenis === "Ekspedisi" ? "Hasil Pindai Resi" : "Hasil Pindai Tanda Terima Barang"}{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </p>
          <FileDrop
            name="dokumen"
            judul={jenis === "Ekspedisi" ? "Unggah hasil pindai resi" : "Unggah hasil pindai Tanda Terima Barang"}
            ket="PDF, JPG, atau PNG, maks. 5 MB"
            file={file}
            onChange={(f, g) => {
              setFile(f);
              setIsian((s) => ({ ...s, dokumen: g }));
            }}
            invalid={Boolean(isian.dokumen)}
            galatId="dokumen-galat"
          />
          <FieldMessage id="dokumen-galat">{isian.dokumen}</FieldMessage>
        </div>

        <div className="flex flex-col gap-2">
          <p id="status-label" className="text-sm font-medium">
            Status Pengiriman{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </p>
          <SegmentPilihan
            labelId="status-label"
            value={status}
            onChange={setStatus}
            options={["Dalam Kirim", "Selesai"]}
          />
        </div>
      </SectionCard>
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/pengiriman">Batal</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner aria-hidden="true" />}
          Simpan Pengiriman
        </Button>
      </div>
    </form>
  );
}
