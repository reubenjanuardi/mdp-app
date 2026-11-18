import type { Metadata } from "next";

import { PageHeader } from "@/components/mdp/page-header";
import { wajibAkses } from "@/server/auth/sesi";
import { opsiMaster } from "@/server/data/master";

import { PesananForm } from "../_components/pesanan-form";

export const metadata: Metadata = { title: "Tambah Pesanan" };

export default async function Page() {
  await wajibAkses("pesanan", "T");
  const { pelanggan, barang } = await opsiMaster();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tambah Pesanan"
        description="Isian mengikuti surat pemesanan pelanggan. Pelanggan dan barang dipilih dari data master."
      />
      <PesananForm pelanggan={pelanggan} barang={barang} />
    </div>
  );
}
