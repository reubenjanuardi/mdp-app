"use client";

import Link from "next/link";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

// Galat tak terduga di halaman dashboard (misalnya basis data tidak terjangkau). Detail teknis hanya di log server.
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="bg-destructive-subtle text-destructive flex size-10 items-center justify-center rounded-lg">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold">Data belum dapat dimuat</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Terjadi gangguan saat mengambil data. Coba muat ulang. Bila masih gagal, periksa koneksi ke server atau hubungi
        Admin.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Coba Lagi
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/pesanan">Ke Daftar Pesanan</Link>
        </Button>
      </div>
    </div>
  );
}
