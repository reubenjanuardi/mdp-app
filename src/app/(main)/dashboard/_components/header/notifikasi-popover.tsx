"use client";

import { useState } from "react";

import Link from "next/link";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Pengingat } from "@/server/data/follow-up";

import { PengingatList } from "../pengingat-list";

export function NotifikasiPopover({ items }: { items: Pengingat[] }) {
  const [open, setOpen] = useState(false);
  const baru = items.filter((i) => i.baru).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative"
          aria-label={baru > 0 ? `Pengingat, ${baru} baru` : "Pengingat"}
        >
          <Bell aria-hidden="true" />
          {baru > 0 && (
            <span className="bg-destructive text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-medium">
              {baru}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,360px)] p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-base font-medium">Pengingat</p>
          <Link
            href="/dashboard/follow-up"
            onClick={() => setOpen(false)}
            className="text-primary text-sm font-medium hover:underline"
          >
            Buka Follow-up
          </Link>
        </div>
        <p className="text-muted-foreground mb-2 text-xs">Pengingat dalam aplikasi untuk Admin.</p>
        <div className="max-h-[60vh] overflow-y-auto">
          <PengingatList items={items} onPilih={() => setOpen(false)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
