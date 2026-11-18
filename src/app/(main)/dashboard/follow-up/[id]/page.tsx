import Link from "next/link";
import { notFound } from "next/navigation";

import { and, desc, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";

import { CrumbLabel } from "@/app/(main)/dashboard/_components/header/breadcrumbs";
import { Kv, SumRow, Timeline } from "@/components/mdp/kv";
import { PageHeader } from "@/components/mdp/page-header";
import { SectionCard } from "@/components/mdp/section-card";
import { StatusBadge } from "@/components/mdp/status-badge";
import { rupiah, tanggal, tanggalJam } from "@/lib/format";
import { wajibAkses } from "@/server/auth/sesi";
import { labelOleh, namaPengguna } from "@/server/data/detail";
import { muatPesanan } from "@/server/data/pesanan";
import { db } from "@/server/db";
import { faktur, tindak_lanjut } from "@/server/db/schema";

import { CatatanForm } from "./catatan-form";

export const metadata: Metadata = { title: "Catatan Tindak Lanjut" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await wajibAkses("followUp");
  const id = decodeURIComponent((await params).id);
  const f = await db.query.faktur.findFirst({ where: and(eq(faktur.id_faktur, id), isNull(faktur.dihapus_pada)) });
  if (!f) notFound();
  const [[p], riwayat, nama] = await Promise.all([
    muatPesanan({ id: f.id_pesanan }),
    db.query.tindak_lanjut.findMany({
      where: and(eq(tindak_lanjut.id_faktur, id), isNull(tindak_lanjut.dihapus_pada)),
      orderBy: [desc(tindak_lanjut.waktu)],
    }),
    namaPengguna(),
  ]);
  const n = p?.nota.find((x) => x.id === id);
  if (!p || !n) notFound();

  return (
    <div className="flex flex-col gap-6">
      <CrumbLabel segment={id} label={f.nomor_nota} />
      <PageHeader title="Catatan Tindak Lanjut" description={`${f.nomor_nota} · ${p.pelanggan}`} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        <div className="flex min-w-0 flex-col gap-4">
          <SectionCard title="Catat Hasil Tindak Lanjut">
            <CatatanForm idFaktur={id} />
          </SectionCard>
          <SectionCard title="Riwayat Tindak Lanjut">
            {riwayat.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada catatan. Catatan pertama akan muncul di sini.</p>
            ) : (
              <Timeline
                items={riwayat.map((t) => ({
                  key: t.id_tindak_lanjut,
                  judul: t.status_komunikasi,
                  meta: `${tanggalJam(t.waktu)}${labelOleh(nama, t.dicatat_oleh) ? ` · ${labelOleh(nama, t.dicatat_oleh)}` : ""}`,
                  isi: (
                    <>
                      <p>{t.catatan}</p>
                      {t.pengingat_berikutnya && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Pengingat: {tanggalJam(t.pengingat_berikutnya)}
                        </p>
                      )}
                    </>
                  ),
                }))}
              />
            )}
          </SectionCard>
        </div>
        <SectionCard title="Tagihan">
          <dl className="grid grid-cols-2 gap-4">
            <Kv label="No. Nota" mono>
              <span className="text-primary">{n.nomor}</span>
            </Kv>
            <Kv label="Pesanan" mono>
              <Link
                href={`/dashboard/pesanan/${encodeURIComponent(p.id)}?tab=tagihan`}
                className="text-primary hover:underline"
              >
                {p.id}
              </Link>
            </Kv>
            <Kv label="Jatuh Tempo">{p.jatuhTempo ? tanggal(p.jatuhTempo) : "Belum diisi"}</Kv>
            <Kv label="Penanda">
              {n.penanda ? <StatusBadge status={n.penanda} /> : <StatusBadge status={n.ringkasan.status} />}
            </Kv>
          </dl>
          <div className="flex flex-col gap-2">
            <SumRow label="Total tagihan" value={rupiah(n.total)} />
            <SumRow label="Terverifikasi" value={rupiah(n.ringkasan.terverifikasi)} />
            <div className="bg-border h-px" />
            <SumRow label="Sisa tagihan" value={rupiah(n.ringkasan.sisa)} strong />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
