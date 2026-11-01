"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpenIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/atoms/field";
import { Textarea } from "@/components/ui/atoms/textarea";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { broadcastDetailsSchema, type BroadcastDetailsFormValues } from "@/modules/broadcasting/schemas/broadcast";

export interface BroadcastDetailsFormProps {
  onSubmit: (values: BroadcastDetailsFormValues) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: Partial<BroadcastDetailsFormValues>;
  submitLabel?: string;
}

/** Title (required), description and Bible passage (optional) — requirement 7. */
export function BroadcastDetailsForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  submitLabel = "Next: check your microphone",
}: BroadcastDetailsFormProps) {
  const form = useForm<BroadcastDetailsFormValues>({
    resolver: zodResolver(broadcastDetailsSchema),
    defaultValues: { title: "", description: "", biblePassage: "", ...defaultValues },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="broadcast-details-form">
      <FieldGroup>
        <FormFieldInput control={form.control} name="title" label="Title" placeholder="Sunday Service" maxLength={120} data-testid="broadcast-title" />
        <FormFieldInput
          control={form.control}
          name="biblePassage"
          label="Bible passage (optional)"
          placeholder="John 3:16-18"
          description="Shown to listeners with the title."
          maxLength={60}
          autoCapitalize="words"
          data-testid="broadcast-passage"
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="broadcast-description">Description (optional)</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="broadcast-description"
                maxLength={1000}
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby="broadcast-description-help"
                data-testid="broadcast-description"
              />
              <FieldDescription id="broadcast-description-help">What this message is about, in a sentence or two.</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <LoaderButton type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Saving…" data-testid="details-next-button">
          {submitLabel}
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}

export function BiblePassage({ passage }: { passage: string }) {
  if (!passage) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground" data-testid="bible-passage">
      <BookOpenIcon aria-hidden className="size-4" />
      {passage}
    </span>
  );
}
