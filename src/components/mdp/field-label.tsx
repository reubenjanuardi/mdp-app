import { CircleAlert } from "lucide-react";

import { FieldLabel } from "@/components/ui/field";

/** Label isian dengan tanda * merah untuk isian wajib. */
export function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <FieldLabel htmlFor={htmlFor} className="gap-0.5 text-sm leading-5 font-medium">
      {children}
      {required && (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      )}
    </FieldLabel>
  );
}

export function FieldHint({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p id={id} className="text-muted-foreground text-xs leading-4">
      {children}
    </p>
  );
}

/** Pesan galat per isian: ikon + teks, tidak bergantung pada warna saja. */
export function FieldMessage({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="text-destructive flex items-center gap-1.5 text-xs leading-4">
      <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
