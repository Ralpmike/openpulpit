"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/atoms/field";
import { Textarea } from "@/components/ui/atoms/textarea";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { preacherApplicationSchema, type PreacherApplicationFormValues } from "@/modules/accounts/schemas/auth";

export interface PreacherApplicationFormProps {
  onSubmit: (values: PreacherApplicationFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function PreacherApplicationForm({ onSubmit, isSubmitting }: PreacherApplicationFormProps) {
  const form = useForm<PreacherApplicationFormValues>({
    resolver: zodResolver(preacherApplicationSchema),
    defaultValues: { ministry: "", note: "" },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="preacher-application-form">
      <FieldGroup>
        <FormFieldInput control={form.control} name="ministry" label="Ministry or church" autoComplete="organization" data-testid="application-ministry" />
        <Controller
          control={form.control}
          name="note"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="application-note">Anything we should know? (optional)</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="application-note" maxLength={500} aria-describedby="application-note-help" />
              <FieldDescription id="application-note-help">Where you preach, or a link to your ministry.</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <LoaderButton type="submit" isLoading={isSubmitting} loadingLabel="Sending…" data-testid="submit-application-button">
          Send application
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}
