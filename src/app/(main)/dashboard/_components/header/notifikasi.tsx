import { daftarPengingat } from "@/server/data/follow-up";

import { NotifikasiPopover } from "./notifikasi-popover";

export async function Notifikasi() {
  const items = await daftarPengingat();
  return <NotifikasiPopover items={items} />;
}
