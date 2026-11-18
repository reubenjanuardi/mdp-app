import { Kv, KvGrid } from "@/components/mdp/kv";
import { SectionCard } from "@/components/mdp/section-card";
import { tanggal } from "@/lib/format";
import type { DetailPesanan } from "@/server/data/detail";

export function DataCard({ d }: { d: DetailPesanan }) {
  const { po } = d;
  return (
    <SectionCard title="Data Pesanan">
      <KvGrid>
        <Kv label="No. Surat Pemesanan Pelanggan" mono>
          {po.nomor_surat_pemesanan}
        </Kv>
        <Kv label="Tanggal PO">{tanggal(po.tanggal_po)}</Kv>
        <Kv label="Pelanggan">{po.nama_pelanggan}</Kv>
        <Kv label="Rujukan Surat Penawaran" mono>
          {po.rujukan_penawaran ?? "-"}
        </Kv>
        <Kv label="Lokasi Pengiriman">{po.lokasi_pengiriman}</Kv>
        <Kv label="Ketentuan Pembayaran">{po.ketentuan_pembayaran ?? "-"}</Kv>
        <Kv label="Jatuh Tempo Pembayaran">
          {po.tanggal_jatuh_tempo ? (
            tanggal(po.tanggal_jatuh_tempo)
          ) : (
            <span className="text-destructive">Belum diisi</span>
          )}
        </Kv>
        <Kv label="PPN">{po.termasuk_ppn ? "Termasuk PPN 11%" : "Tanpa PPN"}</Kv>
      </KvGrid>
    </SectionCard>
  );
}
