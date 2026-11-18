"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { FieldMessage, Label } from "@/components/mdp/field-label";
import { SectionCard } from "@/components/mdp/section-card";
import { SegmentPilihan } from "@/components/mdp/segment-pilihan";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ubahStatusProduksi } from "@/server/actions/produksi";

const STATUS = ["Dalam Proses", "Selesai", "Tertunda"] as const;

export function UbahStatus({
  id,
  pelanggan,
  statusSaatIni,
  tutupHref,
}: {
  id: string;
  pelanggan: string;
  statusSaatIni: string;
  tutupHref: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(statusSaatIni === "Dalam Proses" ? "Selesai" : "Dalam Proses");
  const [catatan, setCatatan] = useState("");
  const [isian, setIsian] = useState<Record<string, string | undefined>>({});

  const simpan = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await ubahStatusProduksi({ idPesanan: id, status: status as (typeof STATUS)[number], catatan });
      if (r.ok) {
        toast.success(r.pesan);
        setCatatan("");
        setIsian({});
        router.replace(tutupHref, { scroll: false });
        router.refresh();
      } else {
        setIsian(r.isian ?? {});
        if (!r.isian?.catatan && !r.isian?.status) toast.error(r.galat);
      }
    });
  };

  return (
    <SectionCard title={`Ubah Status ${id}`} description={`${pelanggan} · saat ini ${statusSaatIni}`}>
      <form onSubmit={simpan} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p id="status-baru" className="text-sm font-medium">
            Status Baru{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </p>
          <SegmentPilihan labelId="status-baru" value={status} onChange={setStatus} options={STATUS} />
          <FieldMessage>{isian.status}</FieldMessage>
        </div>
        {status === "Tertunda" && (
          <Field className="gap-2" data-invalid={Boolean(isian.catatan)}>
            <Label htmlFor="alasan" required>
              Alasan Tertunda
            </Label>
            <Textarea
              id="alasan"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis alasan, misalnya bahan baku belum datang"
              aria-invalid={Boolean(isian.catatan)}
            />
            <FieldMessage>{isian.catatan}</FieldMessage>
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href={tutupHref} scroll={false}>
              Batal
            </Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner aria-hidden="true" />}
            Simpan Status
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
