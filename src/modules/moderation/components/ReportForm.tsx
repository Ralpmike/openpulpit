"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/atoms/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/atoms/radio-group";
import { Textarea } from "@/components/ui/atoms/textarea";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { REPORT_REASONS, reportSchema, type ReportFormValues, type ReportTargetType } from "@/modules/moderation/schemas/report";

export interface ReportFormProps {
  targetType: ReportTargetType;
  targetId: string;
  onSubmit: (values: ReportFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function ReportForm({ targetType, targetId, onSubmit, isSubmitting }: ReportFormProps) {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { targetType, targetId, reason: undefined as unknown as ReportFormValues["reason"], details: "" },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="report-form">
      <FieldGroup>
        <Controller
          control={form.control}
          name="reason"
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid || undefined}>
              <FieldLegend variant="label">What&apos;s wrong?</FieldLegend>
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2">
                {REPORT_REASONS.map((reason) => (
                  <FieldLabel
                    key={reason.value}
                    htmlFor={`reason-${reason.value}`}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-data-[state=checked]:border-primary"
                  >
                    <RadioGroupItem id={`reason-${reason.value}`} value={reason.value} className="mt-0.5" />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{reason.label}</span>
                      <span className="text-sm font-normal text-muted-foreground">{reason.description}</span>
                    </span>
                  </FieldLabel>
                ))}
              </RadioGroup>
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
        <Controller
          control={form.control}
          name="details"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="report-details">Details (optional)</FieldLabel>
              <Textarea {...field} value={field.value ?? ""} id="report-details" maxLength={1000} aria-invalid={fieldState.invalid || undefined} aria-describedby="report-details-help" />
              <FieldDescription id="report-details-help">For a live broadcast, roughly when it happened helps us.</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <LoaderButton type="submit" isLoading={isSubmitting} loadingLabel="Sending…" data-testid="submit-report">
          Send report
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}
