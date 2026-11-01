"use client";

import type { ComponentProps } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/atoms/field";
import { Input } from "@/components/ui/atoms/input";

export interface FormFieldInputProps<T extends FieldValues>
  extends Omit<ComponentProps<typeof Input>, "name" | "defaultValue"> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  "data-testid"?: string;
}

/** A labelled input wired to react-hook-form, with its error linked for screen readers. */
export function FormFieldInput<T extends FieldValues>({
  control,
  name,
  label,
  description,
  "data-testid": testId,
  ...inputProps
}: FormFieldInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        const descriptionId = description ? `${id}-description` : undefined;
        const errorId = fieldState.error ? `${id}-error` : undefined;
        const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
              {...inputProps}
              {...field}
              value={field.value ?? ""}
              id={id}
              data-testid={testId}
              aria-invalid={fieldState.invalid || undefined}
              aria-describedby={describedBy}
            />
            {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
            <FieldError id={errorId} errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
