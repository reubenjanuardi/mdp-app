"use client";

import { useId, useRef, useState } from "react";

import { cn } from "cn";
import { FileText, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const BATAS = 5 * 1024 * 1024;
const TIPE = ["application/pdf", "image/jpeg", "image/png"];

export function ukuranFile(b: number) {
  return b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`;
}

/** Area unggah: klik atau seret file. Memeriksa tipe dan ukuran di browser; server memeriksa ulang. */
export function FileDrop({
  name,
  judul,
  ket = "JPG, PNG, atau PDF, maks. 5 MB",
  file,
  onChange,
  invalid,
  galatId,
}: {
  name: string;
  judul: string;
  ket?: string;
  file: File | null;
  onChange: (f: File | null, galat?: string) => void;
  invalid?: boolean;
  galatId?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [seret, setSeret] = useState(false);

  const terima = (f: File | undefined) => {
    if (!f) return;
    if (!TIPE.includes(f.type)) return onChange(null, "Format file harus PDF, JPG, atau PNG.");
    if (f.size > BATAS) return onChange(null, `Ukuran file ${ukuranFile(f.size)} melebihi batas 5 MB.`);
    onChange(f);
  };

  if (file) {
    return (
      <div className="bg-muted flex items-center gap-3 rounded-lg border px-3 py-2.5">
        <span className="bg-background flex size-8 shrink-0 items-center justify-center rounded-md">
          <FileText className="size-4" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{file.name}</span>
          <span className="text-muted-foreground text-xs">{ukuranFile(file.size)}</span>
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Hapus ${file.name}`}
          onClick={() => {
            onChange(null);
            if (ref.current) ref.current.value = "";
          }}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        setSeret(true);
      }}
      onDragLeave={() => setSeret(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSeret(false);
        terima(e.dataTransfer.files[0]);
      }}
      className={cn(
        "bg-muted hover:bg-muted/70 focus-within:ring-ring/50 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-5 text-center focus-within:ring-3",
        seret && "border-primary bg-highlight",
        invalid && "border-destructive",
      )}
    >
      <span className="bg-background flex size-8 items-center justify-center rounded-md">
        <Upload className="size-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium">{judul}</span>
      <span className="text-muted-foreground text-xs">{ket}</span>
      <input
        ref={ref}
        id={id}
        name={name}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        aria-invalid={invalid || undefined}
        aria-describedby={galatId}
        onChange={(e) => terima(e.target.files?.[0])}
      />
    </label>
  );
}
