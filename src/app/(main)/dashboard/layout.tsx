import type { ReactNode } from "react";

import { cookies } from "next/headers";

import { cn } from "cn";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { halamanAwal } from "@/lib/akses";
import { wajibLogin } from "@/server/auth/sesi";
import { getPreference } from "@/server/server-actions";

import { Breadcrumbs } from "./_components/header/breadcrumbs";
import { Notifikasi } from "./_components/header/notifikasi";
import { SearchDialog } from "./_components/header/search-dialog";
import { ThemeSwitcher } from "./_components/header/theme-switcher";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const pengguna = await wajibLogin();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible] = await Promise.all([
    getPreference("sidebar_variant"),
    getPreference("sidebar_collapsible"),
  ]);

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant={variant}
        collapsible={collapsible}
        peran={pengguna.peran}
        beranda={halamanAwal(pengguna.peran)}
        user={{ nama: pengguna.nama, peran: pengguna.peran, username: pengguna.username }}
      />
      <SidebarInset
        className={cn(
          "[html[data-content-layout=centered]_&>*]:mx-auto",
          "[html[data-content-layout=centered]_&>*]:w-full",
          "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
          "peer-data-[variant=inset]:border",
          "min-w-0 overflow-x-clip",
        )}
      >
        <header className="bg-background sticky top-0 z-40 flex h-12 shrink-0 items-center border-b">
          <div className="flex w-full min-w-0 items-center gap-2 px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" aria-label="Buka atau tutup menu samping" />
            <Separator
              orientation="vertical"
              className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
            />
            <div className="min-w-0 flex-1">
              <Breadcrumbs />
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <SearchDialog />
              {pengguna.peran === "Admin" && <Notifikasi />}
              <ThemeSwitcher />
            </div>
          </div>
        </header>
        <div id="konten" className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
