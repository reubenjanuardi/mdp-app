"use client";

import Link from "next/link";

import { useShallow } from "zustand/react/shallow";

import { MdpLogoTile } from "@/components/app-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { menuUntuk } from "@/navigation/sidebar/sidebar-items";
import type { Peran } from "@/server/db/schema";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

type Props = React.ComponentProps<typeof Sidebar> & {
  peran: Peran;
  beranda: string;
  user: { nama: string; peran: string; username: string };
};

export function AppSidebar({ peran, beranda, user, ...props }: Props) {
  const menu = menuUntuk(peran);
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={APP_CONFIG.company}>
              <Link prefetch={false} href={beranda}>
                <MdpLogoTile size={32} />
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">{APP_CONFIG.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{APP_CONFIG.subtitle}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Menu utama">
          <NavMain items={menu} />
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
