"use client";

import Link from "next/link";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { Checkbox } from "@/components/ui/atoms/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/atoms/field";

export function TermsField<T extends FieldValues>({ control, name }: { control: Control<T>; name: Path<T> }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid || undefined}>
          <Checkbox
            id="accepts-terms"
            checked={field.value === true}
            onCheckedChange={(checked) => field.onChange(checked === true)}
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={fieldState.error ? "accepts-terms-error" : undefined}
            className="mt-0.5 size-5"
            data-testid="accept-terms"
          />
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="accepts-terms" className="font-normal">
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="font-medium text-primary underline underline-offset-4">
                  terms of use
                </Link>{" "}
                and{" "}
                <Link href="/guidelines" target="_blank" className="font-medium text-primary underline underline-offset-4">
                  community guidelines
                </Link>
                .
              </span>
            </FieldLabel>
            <FieldError id="accepts-terms-error" errors={[fieldState.error]} />
          </div>
        </Field>
      )}
    />
  );
}
