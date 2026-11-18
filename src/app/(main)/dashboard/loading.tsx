import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div role="status" className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2 text-sm">
      <Spinner aria-hidden="true" />
      Memuat data…
    </div>
  );
}
