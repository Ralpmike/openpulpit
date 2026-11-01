"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FieldGroup } from "@/components/ui/atoms/field";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { passwordSignInSchema, type PasswordSignInFormValues } from "@/modules/accounts/schemas/auth";

export interface PasswordSignInFormProps {
  onSubmit: (values: PasswordSignInFormValues) => Promise<void>;
  defaultEmail?: string;
}

export function PasswordSignInForm({ onSubmit, defaultEmail = "" }: PasswordSignInFormProps) {
  const form = useForm<PasswordSignInFormValues>({
    resolver: zodResolver(passwordSignInSchema),
    defaultValues: { email: defaultEmail, password: "" },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate data-testid="password-sign-in-form">
      <FieldGroup>
        <FormFieldInput control={form.control} name="email" label="Email" type="email" inputMode="email" autoComplete="email" data-testid="sign-in-email" />
        <FormFieldInput control={form.control} name="password" label="Password" type="password" autoComplete="current-password" data-testid="sign-in-password" />
        <LoaderButton type="submit" size="lg" isLoading={form.formState.isSubmitting} loadingLabel="Signing in…" data-testid="password-sign-in-button">
          Sign in
        </LoaderButton>
      </FieldGroup>
    </form>
  );
}
