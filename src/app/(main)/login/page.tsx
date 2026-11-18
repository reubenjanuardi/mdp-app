import { redirect } from "next/navigation";

import type { Metadata } from "next";

import { MdpLogoTile } from "@/components/app-logo";
import { APP_CONFIG } from "@/config/app-config";
import { halamanAwal } from "@/lib/akses";
import { bacaSesi } from "@/server/auth/sesi";

import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage() {
  const aktif = await bacaSesi();
  if (aktif) redirect(aktif.wajibGantiPassword ? "/ganti-password" : halamanAwal(aktif.peran));
  return (
    <main className="bg-background flex min-h-dvh">
      <section
        aria-label={APP_CONFIG.company}
        className="bg-primary text-primary-foreground hidden w-[640px] max-w-[45%] shrink-0 flex-col p-12 lg:flex"
      >
        <div className="flex items-center gap-2.5">
          <MdpLogoTile size={40} />
          <p className="text-base leading-[22px] font-medium">{APP_CONFIG.company}</p>
        </div>
        <div className="flex-1" />
        <div className="flex flex-col gap-3">
          <p className="text-3xl leading-9 font-semibold tracking-[-0.75px]">Satu pesanan, satu tempat.</p>
          <p className="text-base leading-6 opacity-85">
            Pesanan, tagihan, pembayaran, status produksi, dan pengiriman tertaut ke PO yang sama.
          </p>
        </div>
        <div className="h-12" />
        <p className="text-xs leading-4 opacity-75">Sistem internal · hanya untuk akun terdaftar</p>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[360px] flex-col gap-5">
          <div className="flex items-center gap-2.5 lg:hidden">
            <MdpLogoTile size={40} />
            <p className="text-base leading-[22px] font-medium">{APP_CONFIG.company}</p>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl leading-8 font-semibold tracking-[-0.6px]">Masuk</h1>
            <p className="text-muted-foreground text-sm leading-5">Gunakan akun yang diberikan Admin.</p>
          </div>
          <LoginForm />
          <p className="text-muted-foreground text-center text-xs leading-4">
            Lupa password? Hubungi Admin untuk reset password.
          </p>
        </div>
      </section>
    </main>
  );
}
