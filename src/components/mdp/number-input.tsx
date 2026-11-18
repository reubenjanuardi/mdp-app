"use client";

import { useEffect, useState } from "react";

import { cn } from "cn";

const fmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** "1.000.000" atau "27,5" menjadi angka; teks kosong atau tidak valid menjadi NaN. */
export function parseAngka(teks: string) {
  const bersih = teks.replace(/\s|Rp/gi, "").replace(/\./g, "").replace(",", ".");
  if (bersih === "" || !/^-?\d*(\.\d*)?$/.test(bersih)) return Number.NaN;
  return Number(bersih);
}

/** Isian angka dengan pemisah ribuan Indonesia. Nilai dikirim ke induk sebagai number (NaN bila kosong). */
export function NumberInput({
  value,
  onChange,
  prefix,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "prefix"> & {
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
}) {
  const [teks, setTeks] = useState(Number.isNaN(value) ? "" : fmt.format(value));
  const [fokus, setFokus] = useState(false);

  useEffect(() => {
    if (!fokus) setTeks(Number.isNaN(value) ? "" : fmt.format(value));
  }, [value, fokus]);

  return (
    <label
      data-slot="input-group"
      className={cn(
        "border-input bg-background focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 dark:bg-input/30 flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 text-sm focus-within:ring-3",
        className,
      )}
    >
      {prefix && (
        <span className="text-muted-foreground shrink-0" aria-hidden="true">
          {prefix}
        </span>
      )}
      <input
        {...props}
        type="text"
        inputMode="decimal"
        value={teks}
        onFocus={() => setFokus(true)}
        onBlur={() => {
          setFokus(false);
          const n = parseAngka(teks);
          setTeks(Number.isNaN(n) ? teks : fmt.format(n));
        }}
        onChange={(e) => {
          setTeks(e.target.value);
          onChange(parseAngka(e.target.value));
        }}
        className="min-w-0 flex-1 bg-transparent tabular-nums outline-none"
      />
    </label>
  );
}
