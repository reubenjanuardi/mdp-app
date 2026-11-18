"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { FileSearch, Search } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { cariCepat, type HasilCari } from "@/server/actions/cari";

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [hasil, setHasil] = React.useState<HasilCari[]>([]);
  const [memuat, setMemuat] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setHasil([]);
      return;
    }
    let batal = false;
    setMemuat(true);
    const t = setTimeout(async () => {
      const r = await cariCepat(query);
      if (!batal) {
        setHasil(r);
        setMemuat(false);
      }
    }, 250);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [query]);

  const tutup = (v: boolean) => {
    setOpen(v);
    if (!v) setQuery("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => tutup(true)}
        aria-label="Cari pesanan (Ctrl K)"
        className="border-input text-muted-foreground hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3 sm:w-60"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden flex-1 text-left sm:block">Cari…</span>
        <kbd className="bg-muted hidden h-5 items-center rounded px-1 font-mono text-xs sm:inline-flex">Ctrl K</kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={tutup}
        title="Cari pesanan"
        description="Cari no. PO, pelanggan, nota, resi"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cari no. PO, pelanggan, nota, resi, atau TTB"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {memuat && (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                <Spinner aria-hidden="true" /> Mencari…
              </div>
            )}
            {!memuat && query.trim().length >= 2 && (
              <CommandEmpty>
                Data tidak ditemukan. Coba no. PO, nama pelanggan, no. nota, atau no. resi lain.
              </CommandEmpty>
            )}
            {!memuat && query.trim().length < 2 && (
              <div className="text-muted-foreground py-6 text-center text-sm">Ketik minimal 2 karakter.</div>
            )}
            {hasil.length > 0 && (
              <CommandGroup heading="Pesanan">
                {hasil.map((h) => (
                  <CommandItem
                    key={h.id}
                    value={h.id}
                    onSelect={() => {
                      tutup(false);
                      router.push(`/dashboard/pesanan/${encodeURIComponent(h.id)}`);
                    }}
                  >
                    <FileSearch aria-hidden="true" />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-mono text-xs">{h.id}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {h.pelanggan}
                        {h.cocokDengan ? ` · ${h.cocokDengan}` : ` · ${h.nomorSp}`}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
