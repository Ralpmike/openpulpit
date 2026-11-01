"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FieldGroup } from "@/components/ui/atoms/field";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { broadcastDetailsSchema, type BroadcastDetailsFormValues } from "@/modules/broadcasting/schemas/broadcast";

export interface BroadcastDetailsFormProps {
  onSubmit: (values: BroadcastDetailsFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function BroadcastDetailsForm({ onSubmit, isSubmitting }: BroadcastDetailsFormProps) {
  const form = useForm<BroadcastDetailsFormValues>({
    resolver: zodResolver(broadcastDetailsSchema),
    defaultValues: { title: "", description: "", biblePassage: "" },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="broadcast-details-form">
      <FieldGroup>
        <FormFieldInput control={form.control} name="title" label="Title" placeholder="Sunday Service" maxLength={120} data-testid="broadcast-title" />
        <LoaderButton type="submit" size="lg" isLoading={isSubmitting} loadingLabel="Saving…" data-testid="details-next-button">
          Next: check your microphone
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}
