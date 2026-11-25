import type { Metadata } from "next";

import { PageHeader } from "@/components/mdp/page-header";
import { wajibAkses } from "@/server/auth/sesi";

import { RekapPengirimanForm } from "../rekap-pengiriman-form";

export const metadata: Metadata = { title: "Tambah Rekap Pengiriman" };

export default async function Page() {
  await wajibAkses("pengiriman", "T");
  return <div className="flex flex-col gap-6"><PageHeader title="Tambah Rekap Pengiriman" description="Satu baris mengikuti rekap Excel perusahaan." /><RekapPengirimanForm /></div>;
}
