"use client";

import { useActionState, useState } from "react";

import { CircleAlert, Eye, EyeOff } from "lucide-react";

import { FieldMessage, Label } from "@/components/mdp/field-label";
import { Notice } from "@/components/mdp/notice";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { masuk, type StatusMasuk } from "@/server/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<StatusMasuk, FormData>(masuk, {});
  const [lihat, setLihat] = useState(false);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.gagal && (
        <Notice nada="danger" icon={CircleAlert} title="Gagal masuk">
          {state.gagal}
        </Notice>
      )}
      <Field className="gap-2" data-invalid={Boolean(state.isian?.identitas)}>
        <Label htmlFor="identitas" required>
          Username atau Email
        </Label>
        <Input
          id="identitas"
          name="identitas"
          autoComplete="username"
          defaultValue={state.identitas}
          aria-invalid={Boolean(state.isian?.identitas)}
          aria-describedby={state.isian?.identitas ? "identitas-galat" : undefined}
          required
        />
        <FieldMessage id="identitas-galat">{state.isian?.identitas}</FieldMessage>
      </Field>
      <Field className="gap-2" data-invalid={Boolean(state.isian?.password)}>
        <Label htmlFor="password" required>
          Password
        </Label>
        <InputGroup>
          <InputGroupInput
            id="password"
            name="password"
            type={lihat ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(state.isian?.password)}
            aria-describedby={state.isian?.password ? "password-galat" : undefined}
            required
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={() => setLihat((v) => !v)}
              aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={lihat}
            >
              {lihat ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldMessage id="password-galat">{state.isian?.password}</FieldMessage>
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Spinner aria-hidden="true" />}
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
