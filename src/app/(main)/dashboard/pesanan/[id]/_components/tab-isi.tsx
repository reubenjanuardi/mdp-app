import { Eye, FileText, Inbox } from "lucide-react";

import { Stack, TableWrap, Td, Th } from "@/components/mdp/data-table";
import { EmptyState } from "@/components/mdp/empty-state";
import { Timeline } from "@/components/mdp/kv";
import { Notice } from "@/components/mdp/notice";
import { StatusBadge } from "@/components/mdp/status-badge";
import { angka, rupiah, tanggal, tanggalJam } from "@/lib/format";
import type { DetailPesanan } from "@/server/data/detail";
import { labelTagihan } from "@/server/data/pesanan";

import { MenuNota, MenuPembayaran } from "./menu-baris";
import { type DataVerifikasi, VerifikasiDialog } from "./verifikasi-dialog";

export function TabTagihan({
  d,
  bisaBayar,
  bisaKoreksi,
}: {
  d: DetailPesanan;
  bisaBayar: boolean;
  bisaKoreksi: boolean;
}) {
  const nota = d.ringkas.nota;
  if (nota.length === 0)
    return (
      <EmptyState
        icon={FileText}
        title="Belum ada Nota Faktur"
        description="Tagihan untuk pesanan ini belum dibuat. Tambahkan nota agar pembayaran dan jatuh tempo dapat dipantau."
      />
    );
  return (
    <TableWrap label="Nota Faktur pesanan">
      <thead>
        <tr>
          <Th width={160}>No. Nota Faktur</Th>
          <Th width={120}>Tanggal</Th>
          <Th align="right">Total</Th>
          <Th align="right" width={130}>
            Sisa
          </Th>
          <Th width={128}>Status</Th>
          <Th width={48}>
            <span className="sr-only">Aksi</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {nota.map((n) => (
          <tr key={n.id}>
            <Td className="h-12">
              <span className="text-primary font-mono text-xs">{n.nomor}</span>
            </Td>
            <Td className="whitespace-nowrap">{tanggal(n.tanggal)}</Td>
            <Td align="right" className="font-medium whitespace-nowrap tabular-nums">
              {rupiah(n.total)}
            </Td>
            <Td
              align="right"
              className={n.ringkasan.sisa === 0 ? "text-muted-foreground tabular-nums" : "font-medium tabular-nums"}
            >
              {rupiah(n.ringkasan.sisa)}
            </Td>
            <Td>
              <StatusBadge status={labelTagihan(n.ringkasan)} />
            </Td>
            <Td>
              <MenuNota
                idPesanan={d.ringkas.id}
                idNota={n.id}
                nomor={n.nomor}
                bisaBayar={bisaBayar && n.ringkasan.status !== "Lunas"}
                bisaKoreksi={bisaKoreksi}
                koreksi={{
                  nota: d.ringkas.nota.map((x) => ({
                    id: x.id,
                    nomor: x.nomor,
                    status: x.ringkasan.status,
                    otomatis: x.ringkasan.status,
                    dikoreksi: x.ringkasan.dikoreksi,
                    sisa: x.ringkasan.sisa,
                  })),
                  pelanggan: d.ringkas.pelanggan,
                }}
              />
            </Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

export function TabPembayaran({
  d,
  bisaVerifikasi,
  bisaHapus,
}: {
  d: DetailPesanan;
  bisaVerifikasi: boolean;
  bisaHapus: boolean;
}) {
  if (d.pembayaran.length === 0)
    return (
      <EmptyState
        icon={Inbox}
        title="Belum ada pembayaran"
        description="Pembayaran yang dicatat dari bukti transaksi bank akan tampil di sini."
      />
    );
  const sisaNota = new Map(d.ringkas.nota.map((n) => [n.id, n.ringkasan.sisa]));
  return (
    <TableWrap label="Riwayat pembayaran">
      <thead>
        <tr>
          <Th width={190}>Tanggal</Th>
          <Th width={160}>Nota</Th>
          <Th align="right">Nominal</Th>
          <Th width={170}>Status</Th>
          <Th width={112}>
            <span className="sr-only">Aksi</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {d.pembayaran.map((b) => {
          const menunggu = b.status_verifikasi === "Menunggu Verifikasi";
          const data: DataVerifikasi = {
            id: b.id_pembayaran,
            nomorNota: b.nomorNota,
            pelanggan: d.ringkas.pelanggan,
            nominal: b.nominal_pembayaran ?? 0,
            waktu: b.waktu_pembayaran.toISOString(),
            metode: b.metode,
            referensi: b.nomor_referensi,
            penyetor: b.nama_penyetor,
            berita: b.berita_transaksi,
            namaFile: b.nama_file_bukti,
            adaBukti: Boolean(b.bukti_pembayaran),
            sisaNota: sisaNota.get(b.id_faktur) ?? 0,
          };
          return (
            <tr key={b.id_pembayaran}>
              <Td className="h-14">
                <Stack
                  utama={tanggalJam(b.waktu_pembayaran)}
                  ket={`${b.metode} · ${menunggu ? `dicatat ${b.pencatat ?? "-"}` : `diverifikasi ${b.verifikator ?? "-"}`}`}
                />
              </Td>
              <Td>
                <span className="text-primary font-mono text-xs">{b.nomorNota}</span>
              </Td>
              <Td align="right" className="font-medium whitespace-nowrap tabular-nums">
                {rupiah(b.nominal_pembayaran ?? 0)}
              </Td>
              <Td>
                <StatusBadge status={b.status_verifikasi} />
              </Td>
              <Td align="right">
                <div className="flex items-center justify-end gap-1">
                  {menunggu && bisaVerifikasi && <VerifikasiDialog data={data} />}
                  <MenuPembayaran id={b.id_pembayaran} adaBukti={Boolean(b.bukti_pembayaran)} bisaHapus={bisaHapus} />
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </TableWrap>
  );
}

export function TabPengiriman({ d }: { d: DetailPesanan }) {
  if (d.pengiriman.length === 0)
    return (
      <EmptyState
        icon={Inbox}
        title="Belum ada data pengiriman"
        description="Informasi akan tersedia setelah pengiriman dicatat."
      />
    );
  return (
    <TableWrap label="Pengiriman pesanan">
      <thead>
        <tr>
          <Th width={48}>Ke-</Th>
          <Th>Jenis</Th>
          <Th width={170}>No. Resi / TTB</Th>
          <Th width={120}>Tanggal</Th>
          <Th width={128}>Status</Th>
          <Th width={48}>
            <span className="sr-only">Bukti</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {d.pengiriman.map((k) => (
          <tr key={k.id_pengiriman}>
            <Td className="h-14">{k.ke}</Td>
            <Td>
              <Stack
                utama={k.jenis_pengiriman}
                ket={
                  k.jenis_pengiriman === "Ekspedisi"
                    ? `${k.ekspedisi ?? "-"}${k.jumlah_koli ? ` · ${angka(k.jumlah_koli)} koli` : ""}`
                    : k.nama_file_dokumen
                      ? `Bukti: ${k.nama_file_dokumen}`
                      : undefined
                }
                className="min-w-40"
              />
            </Td>
            <Td>
              <span className="font-mono text-xs">{k.nomor_resi ?? k.nomor_tanda_terima ?? "-"}</span>
            </Td>
            <Td className="whitespace-nowrap">{tanggal(k.tanggal_pengiriman)}</Td>
            <Td>
              <StatusBadge status={k.status_pengiriman} />
            </Td>
            <Td>
              {k.dokumen && (
                <a
                  href={`/api/berkas/pengiriman/${encodeURIComponent(k.id_pengiriman)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:bg-muted focus-visible:ring-ring/50 inline-flex size-7 items-center justify-center rounded-md outline-none focus-visible:ring-3"
                  aria-label={`Lihat bukti pengiriman ke-${k.ke}`}
                >
                  <Eye className="size-4" aria-hidden="true" />
                </a>
              )}
            </Td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}

export function TabProduksi({ d, bisaUbah }: { d: DetailPesanan; bisaUbah: boolean }) {
  const jumlah = d.ringkas.barang.reduce((s, b) => s + b.jumlah, 0);
  const satuan = d.ringkas.barang[0]?.satuan ?? "";
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted flex items-center gap-2.5 rounded-lg p-3">
        <span className="text-muted-foreground flex-1 text-sm">Status saat ini</span>
        <StatusBadge status={d.ringkas.produksi} />
      </div>
      {d.ringkas.produksi === "Tertunda" && d.ringkas.alasanTertunda && (
        <p className="text-sm">
          <span className="text-muted-foreground">Alasan tertunda: </span>
          {d.ringkas.alasanTertunda}
        </p>
      )}
      {d.produksi.length > 0 ? (
        <Timeline
          items={d.produksi.map((r) => ({
            key: r.id_riwayat,
            judul: r.status === "Selesai" ? `Selesai · ${angka(jumlah)} ${satuan}` : r.status,
            meta: `${tanggalJam(r.dibuat_pada)}${r.oleh ? ` · ${r.oleh}` : ""}`,
            isi: r.catatan && r.status === "Tertunda" ? r.catatan : undefined,
          }))}
        />
      ) : (
        <p className="text-muted-foreground text-sm">Belum ada riwayat perubahan status.</p>
      )}
      {!bisaUbah && (
        <Notice nada="neutral" icon={Eye} title="Hanya lihat" className="bg-card border-border text-foreground">
          <span className="text-muted-foreground">Status produksi diperbarui oleh Staf Produksi.</span>
        </Notice>
      )}
    </div>
  );
}
