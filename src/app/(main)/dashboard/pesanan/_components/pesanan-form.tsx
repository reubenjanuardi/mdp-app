"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CircleAlert, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FieldHint, FieldMessage, Label } from "@/components/mdp/field-label";
import { SumRow } from "@/components/mdp/kv";
import { Notice } from "@/components/mdp/notice";
import { NumberInput } from "@/components/mdp/number-input";
import { SearchSelect } from "@/components/mdp/search-select";
import { SectionCard } from "@/components/mdp/section-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { rupiah } from "@/lib/format";
import { hitungTotalPesanan } from "@/lib/status";
import { type InputPesanan, simpanPesananBaru, ubahPesanan } from "@/server/actions/pesanan";
import type { OpsiBarang, OpsiPelanggan } from "@/server/data/master";

type Baris = { kunci: string; idBarang: string; jumlah: number; hargaSatuan: number };

export type NilaiAwal = Omit<InputPesanan, "baris"> & { baris: Omit<Baris, "kunci">[] };

const kosong = (): Baris => ({ kunci: crypto.randomUUID(), idBarang: "", jumlah: Number.NaN, hargaSatuan: Number.NaN });

export function PesananForm({
  pelanggan,
  barang,
  awal,
  idPesanan,
  barangTerkunci,
}: {
  pelanggan: OpsiPelanggan[];
  barang: OpsiBarang[];
  awal?: NilaiAwal;
  idPesanan?: string;
  barangTerkunci?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [galat, setGalat] = useState<string>();
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});

  const [nomorSp, setNomorSp] = useState(awal?.nomorSp ?? "");
  const [tanggalPo, setTanggalPo] = useState(awal?.tanggalPo ?? "");
  const [idPelanggan, setIdPelanggan] = useState(awal?.idPelanggan ?? "");
  const [rujukan, setRujukan] = useState(awal?.rujukan ?? "");
  const [idLokasi, setIdLokasi] = useState(awal?.idLokasi ?? "");
  const [ketentuan, setKetentuan] = useState(awal?.ketentuan ?? "");
  const [jatuhTempo, setJatuhTempo] = useState(awal?.jatuhTempo ?? "");
  const [termasukPpn, setTermasukPpn] = useState(awal?.termasukPpn ?? true);
  const [baris, setBaris] = useState<Baris[]>(
    awal?.baris.length ? awal.baris.map((b) => ({ ...b, kunci: crypto.randomUUID() })) : [kosong()],
  );

  const plg = pelanggan.find((p) => p.id === idPelanggan);
  const peta = useMemo(() => new Map(barang.map((b) => [b.id, b])), [barang]);
  const total = hitungTotalPesanan(
    baris.map((b) => ({
      jumlah: Number.isNaN(b.jumlah) ? 0 : b.jumlah,
      hargaSatuan: Number.isNaN(b.hargaSatuan) ? 0 : b.hargaSatuan,
    })),
    termasukPpn,
  );

  const ubahBaris = (k: string, ubah: Partial<Baris>) =>
    setBaris((s) => s.map((b) => (b.kunci === k ? { ...b, ...ubah } : b)));
  const g = (k: string) => isian[k];

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    const input: InputPesanan = {
      nomorSp,
      tanggalPo,
      idPelanggan,
      rujukan,
      idLokasi,
      ketentuan,
      jatuhTempo,
      termasukPpn,
      baris: baris.map(({ idBarang, jumlah, hargaSatuan }) => ({ idBarang, jumlah, hargaSatuan })),
    };
    start(async () => {
      const r = idPesanan ? await ubahPesanan(idPesanan, input) : await simpanPesananBaru(input);
      if (r.ok && r.data) {
        toast.success(r.pesan);
        router.push(`/dashboard/pesanan/${encodeURIComponent(r.data.id)}`);
        return;
      }
      setGalat(r.galat ?? "Pesanan belum dapat disimpan.");
      setIsian(r.isian ?? {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const jumlahGalat = Object.values(isian).filter(Boolean).length;

  return (
    <form onSubmit={simpan} noValidate className="flex flex-col gap-6">
      {galat && (
        <Notice
          nada="danger"
          icon={CircleAlert}
          title={idPesanan ? "Perubahan belum dapat disimpan" : "Pesanan belum dapat disimpan"}
        >
          {jumlahGalat > 0 ? `Lengkapi ${jumlahGalat} isian wajib yang ditandai di bawah.` : galat}
        </Notice>
      )}

      <SectionCard title="Informasi PO">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field className="gap-2" data-invalid={Boolean(g("nomorSp"))}>
            <Label htmlFor="nomorSp" required>
              No. Surat Pemesanan Pelanggan
            </Label>
            <Input
              id="nomorSp"
              value={nomorSp}
              onChange={(e) => setNomorSp(e.target.value)}
              placeholder="Contoh: SP/ABC/X/2026/001"
              aria-invalid={Boolean(g("nomorSp"))}
            />
            <FieldMessage>{g("nomorSp")}</FieldMessage>
          </Field>
          <Field className="gap-2" data-invalid={Boolean(g("tanggalPo"))}>
            <Label htmlFor="tanggalPo" required>
              Tanggal PO
            </Label>
            <Input
              id="tanggalPo"
              type="date"
              value={tanggalPo}
              onChange={(e) => setTanggalPo(e.target.value)}
              aria-invalid={Boolean(g("tanggalPo"))}
            />
            <FieldMessage>{g("tanggalPo")}</FieldMessage>
          </Field>
          <Field className="gap-2" data-invalid={Boolean(g("idPelanggan"))}>
            <Label htmlFor="idPelanggan" required>
              Pelanggan
            </Label>
            <SearchSelect
              id="idPelanggan"
              value={idPelanggan}
              onChange={(v) => {
                setIdPelanggan(v);
                const p = pelanggan.find((x) => x.id === v);
                setIdLokasi(p?.lokasi.length === 1 ? p.lokasi[0].id : "");
              }}
              options={pelanggan.map((p) => ({ value: p.id, label: p.nama }))}
              placeholder="Pilih pelanggan"
              searchPlaceholder="Cari nama pelanggan"
              empty="Pelanggan tidak ditemukan. Tambahkan dulu di Data Master."
              invalid={Boolean(g("idPelanggan"))}
            />
            <FieldMessage>{g("idPelanggan")}</FieldMessage>
          </Field>
          <Field className="gap-2">
            <Label htmlFor="rujukan">Rujukan Surat Penawaran</Label>
            <Input id="rujukan" value={rujukan} onChange={(e) => setRujukan(e.target.value)} placeholder="Opsional" />
          </Field>
          <Field className="gap-2" data-invalid={Boolean(g("idLokasi"))}>
            <Label htmlFor="idLokasi" required>
              Lokasi Pengiriman
            </Label>
            <SearchSelect
              id="idLokasi"
              value={idLokasi}
              onChange={setIdLokasi}
              options={(plg?.lokasi ?? []).map((l) => ({ value: l.id, label: l.alamat }))}
              placeholder={plg ? "Pilih lokasi pengiriman" : "Pilih pelanggan dahulu"}
              disabled={!plg}
              invalid={Boolean(g("idLokasi"))}
              describedBy="idLokasi-ket"
            />
            <FieldHint id="idLokasi-ket">Dipilih dari lokasi milik pelanggan.</FieldHint>
            <FieldMessage>{g("idLokasi")}</FieldMessage>
          </Field>
          <Field className="gap-2">
            <Label htmlFor="ketentuan">Ketentuan Pembayaran</Label>
            <Input
              id="ketentuan"
              value={ketentuan}
              onChange={(e) => setKetentuan(e.target.value)}
              placeholder="Contoh: 30 hari setelah nota"
            />
          </Field>
          <Field className="gap-2" data-invalid={Boolean(g("jatuhTempo"))}>
            <Label htmlFor="jatuhTempo" required>
              Jatuh Tempo Pembayaran
            </Label>
            <Input
              id="jatuhTempo"
              type="date"
              value={jatuhTempo}
              min={tanggalPo || undefined}
              onChange={(e) => setJatuhTempo(e.target.value)}
              aria-invalid={Boolean(g("jatuhTempo"))}
            />
            <FieldMessage>{g("jatuhTempo")}</FieldMessage>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Barang" description="Harga satuan terisi dari harga acuan dan dapat diubah per PO.">
        {barangTerkunci && (
          <Notice nada="neutral" icon={Lock} title="Barang terkunci">
            Pesanan ini sudah memiliki Nota Faktur, sehingga barang, jumlah, dan harga tidak dapat diubah.
          </Notice>
        )}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-muted">
                <th scope="col" className="h-10 px-3 text-left font-medium">
                  Barang
                </th>
                <th scope="col" className="h-10 w-32 px-3 text-left font-medium">
                  Jumlah
                </th>
                <th scope="col" className="h-10 w-20 px-3 text-left font-medium">
                  Satuan
                </th>
                <th scope="col" className="h-10 w-36 px-3 text-left font-medium">
                  Harga Satuan
                </th>
                <th scope="col" className="h-10 w-36 px-3 text-right font-medium">
                  Subtotal
                </th>
                <th scope="col" className="w-12">
                  <span className="sr-only">Hapus baris</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b, i) => {
                const m = peta.get(b.idBarang);
                const sub = Math.round(
                  (Number.isNaN(b.jumlah) ? 0 : b.jumlah) * (Number.isNaN(b.hargaSatuan) ? 0 : b.hargaSatuan),
                );
                return (
                  <tr key={b.kunci} className="border-t align-top">
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <SearchSelect
                          value={b.idBarang}
                          onChange={(v) => {
                            const x = peta.get(v);
                            ubahBaris(b.kunci, { idBarang: v, hargaSatuan: x ? x.harga : b.hargaSatuan });
                          }}
                          options={barang.map((x) => ({
                            value: x.id,
                            label: `${x.kode} · ${x.nama}`,
                            ket: x.spesifikasi ?? undefined,
                          }))}
                          placeholder="Pilih barang"
                          searchPlaceholder="Cari kode atau nama barang"
                          empty="Barang tidak ditemukan. Tambahkan dulu di Data Master."
                          invalid={Boolean(g(`baris.${i}.idBarang`))}
                          disabled={barangTerkunci}
                          className="min-w-56"
                        />
                        {m?.spesifikasi && <span className="text-muted-foreground text-xs">{m.spesifikasi}</span>}
                        <FieldMessage>{g(`baris.${i}.idBarang`)}</FieldMessage>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <NumberInput
                        aria-label={`Jumlah baris ${i + 1}`}
                        value={b.jumlah}
                        onChange={(n) => ubahBaris(b.kunci, { jumlah: n })}
                        aria-invalid={Boolean(g(`baris.${i}.jumlah`))}
                        disabled={barangTerkunci}
                      />
                      <FieldMessage>{g(`baris.${i}.jumlah`)}</FieldMessage>
                    </td>
                    <td className="text-muted-foreground px-3 py-3 leading-8">{m?.satuan ?? "-"}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <NumberInput
                          aria-label={`Harga satuan baris ${i + 1}`}
                          prefix="Rp"
                          value={b.hargaSatuan}
                          onChange={(n) => ubahBaris(b.kunci, { hargaSatuan: n })}
                          aria-invalid={Boolean(g(`baris.${i}.hargaSatuan`))}
                          disabled={barangTerkunci}
                        />
                        {m && <span className="text-muted-foreground text-xs">Acuan {rupiah(m.harga)}</span>}
                        <FieldMessage>{g(`baris.${i}.hargaSatuan`)}</FieldMessage>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right leading-8 font-medium tabular-nums">{rupiah(sub)}</td>
                    <td className="px-1 py-3">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Hapus baris ${i + 1}`}
                        disabled={baris.length === 1 || barangTerkunci}
                        onClick={() => setBaris((s) => s.filter((x) => x.kunci !== b.kunci))}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {g("baris") && <FieldMessage>{g("baris")}</FieldMessage>}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Button
            type="button"
            variant="outline"
            onClick={() => setBaris((s) => [...s, kosong()])}
            disabled={barangTerkunci}
          >
            <Plus aria-hidden="true" />
            Tambah Baris
          </Button>
          <div className="hidden flex-1 sm:block" />
          <div className="flex w-full flex-col gap-3 sm:w-[340px]">
            <div className="flex items-center gap-2">
              <Checkbox
                id="ppn"
                checked={termasukPpn}
                onCheckedChange={(v) => setTermasukPpn(Boolean(v))}
                disabled={barangTerkunci}
              />
              <label htmlFor="ppn" className="text-sm font-medium">
                Termasuk PPN 11%
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <SumRow label="Subtotal" value={rupiah(total.subtotal)} />
              <SumRow label="PPN 11%" value={rupiah(total.ppn)} />
              <div className="bg-border h-px" />
              <SumRow label="Total" value={rupiah(total.total)} strong />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <p className="text-muted-foreground flex-1 text-xs">Isian bertanda * wajib diisi.</p>
        <Button asChild variant="outline">
          <Link href={idPesanan ? `/dashboard/pesanan/${encodeURIComponent(idPesanan)}` : "/dashboard/pesanan"}>
            Batal
          </Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner aria-hidden="true" />}
          {idPesanan ? "Simpan Perubahan" : "Simpan Pesanan"}
        </Button>
      </div>
    </form>
  );
}
