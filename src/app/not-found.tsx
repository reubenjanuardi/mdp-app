import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Alamat yang dibuka tidak ada atau datanya sudah dihapus. Kembali ke halaman awal untuk melanjutkan.
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/">Kembali ke halaman awal</Link>
      </Button>
    </main>
  );
}
