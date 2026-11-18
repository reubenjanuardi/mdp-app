"use client";

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SectionCard } from "@/components/mdp/section-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TabRincian = {
  value: string;
  label: string;
  deskripsi: string;
  aksi?: React.ReactNode;
  isi: React.ReactNode;
};

/** Kartu "Rincian Pesanan" dengan tab; tab aktif disimpan di URL (?tab=) agar bisa dibagikan. */
export function Rincian({ tabs, judul = "Rincian Pesanan" }: { tabs: TabRincian[]; judul?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const awal = params.get("tab");
  const [aktif, setAktif] = useState(tabs.some((t) => t.value === awal) ? (awal as string) : tabs[0]?.value);
  const t = tabs.find((x) => x.value === aktif) ?? tabs[0];
  if (!t) return null;

  if (tabs.length === 1) {
    return (
      <SectionCard title={judul === "Rincian Pesanan" ? t.label : judul} description={t.deskripsi} actions={t.aksi}>
        {t.isi}
      </SectionCard>
    );
  }

  return (
    <SectionCard title={judul} description={t.deskripsi} actions={t.aksi}>
      <Tabs
        value={aktif}
        onValueChange={(v) => {
          setAktif(v);
          const q = new URLSearchParams(params.toString());
          q.set("tab", v);
          router.replace(`${path}?${q}`, { scroll: false });
        }}
        className="gap-4"
      >
        <TabsList className="max-w-full overflow-x-auto">
          {tabs.map((x) => (
            <TabsTrigger key={x.value} value={x.value}>
              {x.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((x) => (
          <TabsContent key={x.value} value={x.value}>
            {x.isi}
          </TabsContent>
        ))}
      </Tabs>
    </SectionCard>
  );
}
