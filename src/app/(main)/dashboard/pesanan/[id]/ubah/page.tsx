import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { PageHeader } from "@/components/mdp/page-header";
import { wajibAkses } from "@/server/auth/sesi";
import { detailPesanan } from "@/server/data/detail";
import { opsiMaster } from "@/server/data/master";

import { PesananForm } from "../../_components/pesanan-form";

export const metadata: Metadata = { title: "Ubah Pesanan" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await wajibAkses("pesanan", "U");
  const id = decodeURIComponent((await params).id);
  const [d, master] = await Promise.all([detailPesanan(id), opsiMaster()]);
  if (!d) notFound();
  const { po, ringkas } = d;

  // Pelanggan atau barang yang sudah dihapus dari master tetap bisa tampil sebagai pilihan untuk PO lama.
  const pelanggan = master.pelanggan.some((p) => p.id === po.id_pelanggan)
    ? master.pelanggan
    : [
        ...master.pelanggan,
        {
          id: po.id_pelanggan,
          nama: po.nama_pelanggan,
          lokasi: po.id_lokasi ? [{ id: po.id_lokasi, alamat: po.lokasi_pengiriman }] : [],
        },
      ];
  const barang = [
    ...master.barang,
    ...ringkas.barang
      .filter((b) => b.id_barang && !master.barang.some((m) => m.id === b.id_barang))
      .map((b) => ({
        id: b.id_barang as string,
        kode: b.kode_barang,
        nama: b.nama_barang,
        spesifikasi: b.spesifikasi,
        satuan: b.satuan,
        harga: b.harga_satuan,
      })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Ubah ${po.id_pesanan}`}
        description="Perubahan langsung tampil di daftar dan detail pesanan."
      />
      <PesananForm
        idPesanan={po.id_pesanan}
        pelanggan={pelanggan}
        barang={barang}
        barangTerkunci={ringkas.nota.length > 0}
        awal={{
          nomorSp: po.nomor_surat_pemesanan,
          tanggalPo: po.tanggal_po ?? "",
          idPelanggan: po.id_pelanggan,
          rujukan: po.rujukan_penawaran ?? "",
          idLokasi: po.id_lokasi ?? "",
          ketentuan: po.ketentuan_pembayaran ?? "",
          jatuhTempo: po.tanggal_jatuh_tempo ?? "",
          termasukPpn: po.termasuk_ppn,
          baris: ringkas.barang.map((b) => ({
            idBarang: b.id_barang ?? "",
            jumlah: b.jumlah,
            hargaSatuan: b.harga_satuan,
          })),
        }}
      />
    </div>
  );
}
