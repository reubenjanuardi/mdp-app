import {
  BellRing,
  CalendarClock,
  Factory,
  LayoutDashboard,
  type LucideIcon,
  Package,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
} from "lucide-react";

import type { Peran } from "@/server/db/schema";

export interface NavMainLinkItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  /** true: aktif hanya pada URL yang sama persis. */
  exact?: boolean;
}

export type NavMainItem = NavMainLinkItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

const ITEM = {
  dashboard: { id: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, exact: true },
  pesanan: { id: "pesanan", title: "Pesanan", url: "/dashboard/pesanan", icon: ShoppingCart },
  jatuhTempo: { id: "jatuh-tempo", title: "Jatuh Tempo", url: "/dashboard/jatuh-tempo", icon: CalendarClock },
  followUp: { id: "follow-up", title: "Follow-up", url: "/dashboard/follow-up", icon: BellRing },
  pengiriman: { id: "pengiriman", title: "Pengiriman PO", url: "/dashboard/pengiriman", icon: Truck },
  rekapPengiriman: { id: "rekap-pengiriman", title: "Rekap Pengiriman", url: "/dashboard/pengiriman/rekap", icon: Truck },
  produksi: { id: "produksi", title: "Status Produksi PO", url: "/dashboard/produksi", icon: Factory },
  realisasiProduksi: { id: "realisasi-produksi", title: "Realisasi Produksi", url: "/dashboard/produksi/realisasi", icon: Factory },
  pelanggan: { id: "pelanggan", title: "Pelanggan", url: "/dashboard/data-master/pelanggan", icon: Users },
  barang: { id: "barang", title: "Barang", url: "/dashboard/data-master/barang", icon: Package },
  pengguna: { id: "pengguna", title: "Pengguna", url: "/dashboard/pengguna", icon: UserCog },
} satisfies Record<string, NavMainLinkItem>;

// Menu per peran mengikuti PRD 7.1.
const MENU: Record<Peran, NavGroup[]> = {
  Owner: [{ id: 1, label: "Operasional", items: [ITEM.dashboard, ITEM.pesanan, ITEM.jatuhTempo, ITEM.pengiriman, ITEM.rekapPengiriman] }],
  Admin: [
    {
      id: 1,
      label: "Operasional",
      items: [ITEM.dashboard, ITEM.pesanan, ITEM.jatuhTempo, ITEM.followUp, ITEM.pengiriman, ITEM.rekapPengiriman],
    },
    { id: 2, label: "Data Master", items: [ITEM.pelanggan, ITEM.barang, ITEM.pengguna] },
  ],
  "Staf Operasional": [{ id: 1, label: "Operasional", items: [ITEM.dashboard, ITEM.pesanan, ITEM.jatuhTempo] }],
  "Staf Pengiriman": [{ id: 1, label: "Operasional", items: [ITEM.pesanan, ITEM.pengiriman, ITEM.rekapPengiriman] }],
  "Staf Produksi": [{ id: 1, label: "Operasional", items: [ITEM.dashboard, ITEM.produksi, ITEM.realisasiProduksi, ITEM.pesanan] }],
};

export function menuUntuk(peran: Peran) {
  return MENU[peran];
}
