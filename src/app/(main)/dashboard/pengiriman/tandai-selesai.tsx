"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { tandaiSelesai } from "@/server/actions/pengiriman";

export function TandaiSelesai({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await tandaiSelesai(id);
          if (r.ok) {
            toast.success(r.pesan);
            router.refresh();
          } else toast.error(r.galat);
        })
      }
    >
      {pending ? <Spinner aria-hidden="true" /> : <Check aria-hidden="true" />}
      Tandai Selesai
    </Button>
  );
}
