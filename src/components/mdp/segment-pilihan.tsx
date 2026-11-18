"use client";

import { cn } from "cn";

/** Pilihan bersegmen (radio) seperti "Dalam Kirim | Selesai" di desain. Panah kiri/kanan berpindah pilihan. */
export function SegmentPilihan({
  value,
  onChange,
  options,
  labelId,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  labelId?: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={cn("bg-muted inline-flex w-fit flex-wrap gap-0.5 rounded-lg p-[3px]", className)}
      onKeyDown={(e) => {
        const i = options.indexOf(value);
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(options[(i + 1) % options.length]);
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(options[(i - 1 + options.length) % options.length]);
        }
      }}
    >
      {options.map((o) => {
        const aktif = o === value;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={aktif}
            tabIndex={aktif ? 0 : -1}
            onClick={() => onChange(o)}
            className={cn(
              "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 h-[26px] rounded-md px-2.5 text-sm font-medium outline-none focus-visible:ring-3",
              aktif && "bg-background text-foreground shadow-sm",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
