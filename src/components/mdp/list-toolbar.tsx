"use client";

import { useEffect, useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "cn";
import { Check, CirclePlus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Mengubah query string tanpa memuat ulang halaman; setiap perubahan filter kembali ke halaman 1. */
export function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const set = (ubah: Record<string, string | string[] | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(ubah)) {
      q.delete(k);
      if (Array.isArray(v)) for (const x of v) q.append(k, x);
      else if (v) q.set(k, v);
    }
    if (!("hal" in ubah)) q.delete("hal");
    start(() => router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false }));
  };
  return { params, set, pending };
}

export function SearchBox({
  placeholder,
  param = "q",
  className,
  label,
}: {
  placeholder: string;
  param?: string;
  className?: string;
  label?: string;
}) {
  const { params, set } = useQueryUpdater();
  const awal = params.get(param) ?? "";
  const [nilai, setNilai] = useState(awal);

  useEffect(() => setNilai(awal), [awal]);
  useEffect(() => {
    if (nilai === awal) return;
    const t = setTimeout(() => set({ [param]: nilai.trim() || null }), 300);
    return () => clearTimeout(t);
    // biome-ignore lint/correctness/useExhaustiveDependencies: hanya menunggu ketikan berhenti
  }, [nilai]);

  return (
    <label
      data-slot="search-box"
      className={cn(
        "border-input bg-background focus-within:border-ring focus-within:ring-ring/50 flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 focus-within:ring-3 sm:w-80",
        className,
      )}
    >
      <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <input
        type="search"
        value={nilai}
        onChange={(e) => setNilai(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {nilai && (
        <button
          type="button"
          onClick={() => {
            setNilai("");
            set({ [param]: null });
          }}
          aria-label="Hapus pencarian"
          className="text-muted-foreground hover:text-foreground rounded"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </label>
  );
}

export function FacetFilter({ title, param, options }: { title: string; param: string; options: readonly string[] }) {
  const { params, set } = useQueryUpdater();
  const dipilih = params.getAll(param);
  const toggle = (o: string) =>
    set({ [param]: dipilih.includes(o) ? dipilih.filter((x) => x !== o) : [...dipilih, o] });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label={`Filter ${title}`}>
          <CirclePlus aria-hidden="true" />
          {title}
          {dipilih.length > 0 && (
            <span className="bg-primary text-primary-foreground ml-0.5 rounded-full px-1.5 text-xs leading-5">
              {dipilih.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        <ul aria-label={title}>
          {options.map((o) => {
            const aktif = dipilih.includes(o);
            return (
              <li key={o}>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={aktif}
                  onClick={() => toggle(o)}
                  className="hover:bg-muted focus-visible:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded border",
                      aktif && "bg-primary border-primary text-primary-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {aktif && <Check className="size-3" />}
                  </span>
                  {o}
                </button>
              </li>
            );
          })}
        </ul>
        {dipilih.length > 0 && (
          <button
            type="button"
            onClick={() => set({ [param]: null })}
            className="hover:bg-muted mt-1 w-full rounded-md border-t px-2 py-1.5 text-center text-sm"
          >
            Hapus filter
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Tab filter berbentuk pil seperti P-14 (Semua, Dalam Proses, ...). */
export function SegmentFilter({
  param,
  options,
  label,
}: {
  param: string;
  options: readonly { value: string; label: string; count?: number }[];
  label: string;
}) {
  const { params, set } = useQueryUpdater();
  const aktif = params.get(param) ?? "";
  return (
    <div role="radiogroup" aria-label={label} className="bg-muted inline-flex flex-wrap gap-0.5 rounded-lg p-0.5">
      {options.map((o) => {
        const pilih = aktif === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={pilih}
            onClick={() => set({ [param]: o.value || null })}
            className={cn(
              "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 h-7 rounded-md px-2.5 text-sm outline-none focus-visible:ring-3",
              pilih && "bg-background text-foreground shadow-xs",
            )}
          >
            {o.label}
            {o.count !== undefined && <span className="text-muted-foreground ml-1.5 text-xs">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
