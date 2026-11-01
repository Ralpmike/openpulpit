"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FieldGroup } from "@/components/ui/atoms/field";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/modules/accounts/schemas/auth";

export interface ResetPasswordFormProps {
  email: string;
  onSubmit: (values: ResetPasswordFormValues) => Promise<void>;
}

export function ResetPasswordForm({ email, onSubmit }: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", password: "" },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="reset-password-form">
      <FieldGroup>
        <FormFieldInput
          control={form.control}
          name="otp"
          label="6-digit code"
          description={`We sent it to ${email}.`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          data-testid="reset-code-input"
        />
        <FormFieldInput control={form.control} name="password" label="New password" type="password" autoComplete="new-password" description="At least 8 characters." data-testid="reset-new-password" />
        <LoaderButton type="submit" size="lg" isLoading={form.formState.isSubmitting} loadingLabel="Saving…" data-testid="reset-password-button">
          Save new password
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}
