import Link from "next/link";

import { Lock } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Akses ditolak" };

export default function Page() {
  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <Lock className="text-primary size-10" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight">Akses ditolak</h1>
        <p className="text-muted-foreground text-sm">
          Peran Anda tidak memiliki izin untuk membuka halaman ini. Hubungi Admin bila Anda memerlukan akses.
        </p>
        <Button asChild className="mt-2">
          <Link href="/">Kembali ke halaman awal</Link>
        </Button>
      </div>
    </main>
  );
}
