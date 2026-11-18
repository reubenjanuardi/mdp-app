import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { MdpLogoTile } from "@/components/app-logo";
import { APP_CONFIG } from "@/config/app-config";
import { bacaSesi } from "@/server/auth/sesi";

import { GantiForm } from "./ganti-form";

export const metadata: Metadata = { title: "Ganti Password" };

export default async function Page() {
  const p = await bacaSesi();
  if (!p) redirect("/login");
  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-[400px] flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <MdpLogoTile size={40} />
          <p className="text-base font-medium">{APP_CONFIG.company}</p>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl leading-8 font-semibold tracking-[-0.6px]">Ganti Password</h1>
          <p className="text-muted-foreground text-sm">
            {p.wajibGantiPassword
              ? `Halo ${p.nama.split(" ")[0]}, akun Anda memakai password sementara. Buat password baru sebelum melanjutkan.`
              : "Buat password baru untuk akun Anda."}
          </p>
        </div>
        <GantiForm />
      </div>
    </main>
  );
}
