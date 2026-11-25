import type { Metadata } from "next";

import { PageHeader } from "@/components/mdp/page-header";
import { wajibAkses } from "@/server/auth/sesi";

import { ProduksiHarianForm } from "../produksi-harian-form";

export const metadata: Metadata = { title: "Tambah Realisasi Produksi" };

export default async function Page() {
  await wajibAkses("produksi", "T");
  return <div className="flex flex-col gap-6"><PageHeader title="Tambah Realisasi Produksi" description="Satu baris output operator per tanggal dan mesin." /><ProduksiHarianForm /></div>;
}
