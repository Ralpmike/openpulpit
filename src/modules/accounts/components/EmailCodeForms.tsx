"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FieldGroup } from "@/components/ui/atoms/field";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import {
  emailCodeRequestSchema,
  emailCodeVerifySchema,
  type EmailCodeRequestFormValues,
  type EmailCodeVerifyFormValues,
} from "@/modules/accounts/schemas/auth";

export interface EmailCodeRequestFormProps {
  onSubmit: (values: EmailCodeRequestFormValues) => Promise<void>;
  defaultEmail?: string;
  submitLabel?: string;
}

export function EmailCodeRequestForm({ onSubmit, defaultEmail = "", submitLabel = "Email me a code" }: EmailCodeRequestFormProps) {
  const form = useForm<EmailCodeRequestFormValues>({
    resolver: zodResolver(emailCodeRequestSchema),
    defaultValues: { email: defaultEmail },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="email-code-request-form">
      <FieldGroup>
        <FormFieldInput control={form.control} name="email" label="Email" type="email" inputMode="email" autoComplete="email" data-testid="code-email" />
        <LoaderButton type="submit" size="lg" isLoading={form.formState.isSubmitting} loadingLabel="Sending…" data-testid="send-code-button">
          {submitLabel}
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}

export interface EmailCodeVerifyFormProps {
  email: string;
  onSubmit: (values: EmailCodeVerifyFormValues) => Promise<void>;
}

export function EmailCodeVerifyForm({ email, onSubmit }: EmailCodeVerifyFormProps) {
  const form = useForm<EmailCodeVerifyFormValues>({
    resolver: zodResolver(emailCodeVerifySchema),
    defaultValues: { otp: "" },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="email-code-verify-form">
      <FieldGroup>
        <FormFieldInput
          control={form.control}
          name="otp"
          label="6-digit code"
          description={`We sent it to ${email}. It expires in 10 minutes.`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          data-testid="code-input"
        />
        <LoaderButton type="submit" size="lg" isLoading={form.formState.isSubmitting} loadingLabel="Checking…" data-testid="verify-code-button">
          Continue
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}
