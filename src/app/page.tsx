import { redirect } from "next/navigation";

import { halamanAwal } from "@/lib/akses";
import { bacaSesi } from "@/server/auth/sesi";

export default async function Page() {
  const p = await bacaSesi();
  redirect(p ? halamanAwal(p.peran) : "/login");
}
