"use client";

import { useActionState } from "react";

import { FieldHint, FieldMessage, Label } from "@/components/mdp/field-label";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { gantiPassword, type StatusGanti } from "@/server/auth/actions";

export function GantiForm() {
  const [state, action, pending] = useActionState<StatusGanti, FormData>(gantiPassword, {});
  const g = state.isian ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <Field className="gap-2" data-invalid={Boolean(g.lama)}>
        <Label htmlFor="lama" required>
          Password Sementara atau Lama
        </Label>
        <Input id="lama" name="lama" type="password" autoComplete="current-password" aria-invalid={Boolean(g.lama)} />
        <FieldMessage>{g.lama}</FieldMessage>
      </Field>
      <Field className="gap-2" data-invalid={Boolean(g.baru)}>
        <Label htmlFor="baru" required>
          Password Baru
        </Label>
        <Input
          id="baru"
          name="baru"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(g.baru)}
          aria-describedby="baru-ket"
        />
        <FieldHint id="baru-ket">Minimal 10 karakter, memuat huruf dan angka.</FieldHint>
        <FieldMessage>{g.baru}</FieldMessage>
      </Field>
      <Field className="gap-2" data-invalid={Boolean(g.ulang)}>
        <Label htmlFor="ulang" required>
          Ulangi Password Baru
        </Label>
        <Input id="ulang" name="ulang" type="password" autoComplete="new-password" aria-invalid={Boolean(g.ulang)} />
        <FieldMessage>{g.ulang}</FieldMessage>
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Spinner aria-hidden="true" />}
        Simpan Password Baru
      </Button>
    </form>
  );
}
