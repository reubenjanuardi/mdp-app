import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { SumRow } from "@/components/mdp/kv";
import { SectionCard } from "@/components/mdp/section-card";
import { angka, rupiah } from "@/lib/format";
import type { DetailPesanan } from "@/server/data/detail";

export function BarangCard({ d }: { d: DetailPesanan }) {
  const { po, ringkas } = d;
  return (
    <SectionCard title="Barang">
      <TableWrap label="Barang pesanan">
        <thead>
          <tr>
            <Th width={88}>Kode</Th>
            <Th>Nama dan Spesifikasi</Th>
            <Th align="right" width={140}>
              Jumlah
            </Th>
            <Th align="right" width={112}>
              Harga Satuan
            </Th>
            <Th align="right" width={140}>
              Subtotal
            </Th>
          </tr>
        </thead>
        <tbody>
          {ringkas.barang.map((b) => (
            <tr key={b.id_pesanan_barang}>
              <Td className="h-14">
                <span className="font-mono text-xs">{b.kode_barang}</span>
              </Td>
              <Td className="h-14">
                <Stack
                  utama={<span className="font-medium">{b.nama_barang}</span>}
                  ket={b.spesifikasi}
                  className="min-w-48"
                />
              </Td>
              <Td align="right" className="whitespace-nowrap tabular-nums">
                {angka(b.jumlah)} {b.satuan}
              </Td>
              <Td align="right" className="whitespace-nowrap tabular-nums">
                {rupiah(b.harga_satuan)}
              </Td>
              <Td align="right" className="font-medium whitespace-nowrap tabular-nums">
                {rupiah(b.subtotal)}
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <div className="flex justify-end">
        <div className="flex w-full max-w-80 flex-col gap-2">
          <SumRow label="Subtotal" value={rupiah(po.subtotal)} />
          {po.termasuk_ppn && <SumRow label="PPN 11%" value={rupiah(po.ppn)} />}
          <div className="bg-border h-px" />
          <SumRow label="Total" value={rupiah(po.total)} strong />
        </div>
      </div>
    </SectionCard>
  );
}
