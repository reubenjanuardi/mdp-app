import type { Metadata } from "next";

import { Kv } from "@/components/mdp/kv";
import { PageHeader } from "@/components/mdp/page-header";
import { SectionCard } from "@/components/mdp/section-card";
import { StatusBadge } from "@/components/mdp/status-badge";
import { boleh } from "@/lib/akses";
import { wajibAkses } from "@/server/auth/sesi";
import { namaEkspedisi } from "@/server/data/pengiriman";
import { muatPesanan } from "@/server/data/pesanan";

import { PengirimanForm } from "./pengiriman-form";

export const metadata: Metadata = { title: "Catat Pengiriman" };

export default async function Page({ searchParams }: { searchParams: Promise<{ pesanan?: string }> }) {
  const pengguna = await wajibAkses("pengiriman", "T");
  const { pesanan: idAwal } = await searchParams;
  const [semua, ekspedisi] = await Promise.all([muatPesanan(), namaEkspedisi()]);
  const p = semua.find((x) => x.id === idAwal);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catat Pengiriman"
        description="Pengiriman boleh dicatat sebelum tagihan lunas. Satu pesanan dapat dikirim bertahap."
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_376px]">
        <div className="min-w-0">
          <PengirimanForm
            pesanan={semua.map((x) => ({ id: x.id, pelanggan: x.pelanggan }))}
            awal={p?.id ?? ""}
            ekspedisi={ekspedisi}
          />
        </div>
        <SectionCard title="Ringkasan Pesanan">
          {p ? (
            <>
              <dl className="flex flex-col gap-4">
                <Kv label="Pelanggan">{p.pelanggan}</Kv>
                <Kv label="Lokasi Pengiriman">{p.lokasi}</Kv>
                {/* Status tagihan hanya untuk peran yang berhak melihat tagihan (PRD bagian 5). */}
                {boleh(pengguna.peran, "tagihan") && (
                  <Kv label="Status Tagihan">
                    <StatusBadge status={p.statusTagihan} />
                  </Kv>
                )}
              </dl>
              <div className="bg-border h-px" />
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs">Pengiriman sebelumnya</p>
                {p.pengiriman.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Belum ada. Ini akan menjadi pengiriman ke-1.</p>
                ) : (
                  p.pengiriman.map((k, i) => (
                    <div key={k.id_pengiriman} className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Ke-{i + 1} · {k.jenis_pengiriman}
                      </span>
                      <span className="flex-1" />
                      <StatusBadge status={k.status_pengiriman} />
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Pilih pesanan untuk melihat pelanggan, lokasi, dan pengiriman sebelumnya.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
