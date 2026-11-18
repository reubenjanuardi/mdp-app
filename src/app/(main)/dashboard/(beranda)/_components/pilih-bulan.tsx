"use client";

import { usePathname, useRouter } from "next/navigation";

import { Calendar } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PilihBulan({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const path = usePathname();
  return (
    <Select value={value} onValueChange={(v) => router.replace(`${path}?bulan=${v}`, { scroll: false })}>
      <SelectTrigger className="w-44" aria-label="Pilih bulan ringkasan">
        <Calendar aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
