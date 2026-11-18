"use client";

import { useState } from "react";

import { cn } from "cn";
import { Check, ChevronsUpDown } from "lucide-react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type Opsi = { value: string; label: string; ket?: string; cari?: string };

/** Pilihan dengan kolom pencarian (combobox) untuk data master: pelanggan, lokasi, barang. */
export function SearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Cari…",
  empty = "Tidak ditemukan.",
  invalid,
  describedBy,
  disabled,
  className,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: Opsi[];
  placeholder: string;
  searchPlaceholder?: string;
  empty?: string;
  invalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const pilih = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          className={cn(
            "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 text-left text-sm outline-none focus-visible:ring-3 disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("min-w-0 flex-1 truncate", !pilih && "text-muted-foreground")}>
            {pilih?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command
          filter={(v, s) => {
            const o = options.find((x) => x.value === v);
            const teks = `${o?.label ?? ""} ${o?.ket ?? ""} ${o?.cari ?? ""}`.toLowerCase();
            return teks.includes(s.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", o.value === value ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{o.label}</span>
                    {o.ket && <span className="text-muted-foreground truncate text-xs">{o.ket}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
